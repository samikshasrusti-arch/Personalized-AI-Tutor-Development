import json
import re
import logging
from typing import Optional
from groq import Groq, RateLimitError, APITimeoutError, APIConnectionError, APIStatusError
from app.core.config import settings
from app.services.prompts import (
    build_tutor_prompt,
    build_practice_question_prompt,
    build_evaluation_prompt,
    build_quiz_questions_prompt,
    build_recommendation_prompt,
)

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when AI service encounters a recoverable error."""
    pass


class AIService:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.client: Optional[Groq] = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key)

    def _check_client(self):
        if not self.client:
            raise AIServiceError(
                "GROQ_API_KEY is not configured. Please add it to the backend .env file."
            )

    def _chat(self, messages: list, temperature: float = 0.7, max_tokens: int = 1200) -> str:
        """Core wrapper around Groq chat completions with error handling."""
        self._check_client()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            if not content:
                raise AIServiceError("AI returned an empty response.")
            return content
        except RateLimitError:
            raise AIServiceError("Rate limit reached. Please wait a moment and try again.")
        except APITimeoutError:
            raise AIServiceError("Request timed out. Please try again.")
        except APIConnectionError:
            raise AIServiceError("Could not connect to the AI provider. Check your internet connection.")
        except APIStatusError as e:
            raise AIServiceError(f"AI provider error ({e.status_code}): {e.message}")

    def _parse_json(self, raw: str) -> dict | list:
        """Extract and parse JSON from AI response, handling markdown code fences."""
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
        # Find first JSON structure
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse failed: {e}\nRaw: {raw[:500]}")
            raise AIServiceError(f"AI returned malformed data. Please try again.")

    # ─── Learn ───────────────────────────────────────────────────────────────

    def explain_concept(self, topic: str, profile: dict, context: list = None) -> str:
        system_prompt = build_tutor_prompt(
            experience=profile.get("experience", "beginner"),
            style=profile.get("explanationStyle", "simple"),
            difficulty=profile.get("difficulty", "easy"),
            goal=profile.get("goal", ""),
        )
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.extend(context)
        messages.append({
            "role": "user",
            "content": f"Please explain the concept of '{topic}' in Python. Start with a clear definition, then show a practical example, then explain it step by step."
        })
        return self._chat(messages, temperature=0.7, max_tokens=1200)

    def answer_question(self, topic: str, question: str, profile: dict, context: list = None) -> str:
        system_prompt = build_tutor_prompt(
            experience=profile.get("experience", "beginner"),
            style=profile.get("explanationStyle", "simple"),
            difficulty=profile.get("difficulty", "easy"),
            goal=profile.get("goal", ""),
        )
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": question})
        return self._chat(messages, temperature=0.7, max_tokens=1000)

    # ─── Practice ────────────────────────────────────────────────────────────

    def generate_practice_question(self, topic: str, difficulty: str, question_type: str, profile: dict) -> dict:
        prompt = build_practice_question_prompt(topic, difficulty, question_type, profile)
        messages = [{"role": "user", "content": prompt}]
        raw = self._chat(messages, temperature=0.8, max_tokens=800)
        data = self._parse_json(raw)
        if not isinstance(data, dict):
            raise AIServiceError("AI returned unexpected format for practice question.")
        # Validate required keys
        required = ["questionText", "explanation", "hint"]
        for key in required:
            if key not in data:
                raise AIServiceError(f"AI response missing required field: {key}")
        return data

    def evaluate_answer(self, question_text: str, expected: str, learner_answer: str, question_type: str) -> dict:
        prompt = build_evaluation_prompt(question_text, expected, learner_answer, question_type)
        messages = [{"role": "user", "content": prompt}]
        raw = self._chat(messages, temperature=0.3, max_tokens=600)
        data = self._parse_json(raw)
        if not isinstance(data, dict):
            raise AIServiceError("AI returned unexpected format for evaluation.")
        # Ensure required keys with safe defaults
        defaults = {
            "isCorrect": False,
            "score": 0.0,
            "feedback": "Unable to evaluate. Please try again.",
            "explanation": expected,
            "hint": "",
            "suggestedNextStep": "Review this topic and try again.",
        }
        for k, v in defaults.items():
            if k not in data:
                data[k] = v
        return data

    # ─── Quiz ────────────────────────────────────────────────────────────────

    def generate_quiz_questions(self, topic: str, difficulty: str, count: int, profile: dict) -> list:
        prompt = build_quiz_questions_prompt(topic, difficulty, count, profile)
        messages = [{"role": "user", "content": prompt}]
        raw = self._chat(messages, temperature=0.8, max_tokens=2500)
        data = self._parse_json(raw)
        if not isinstance(data, list):
            raise AIServiceError("AI returned unexpected format for quiz questions.")
        validated = []
        for i, q in enumerate(data):
            if not isinstance(q, dict):
                continue
            # Ensure required fields
            q.setdefault("questionId", f"q{i+1}")
            q.setdefault("questionText", "")
            q.setdefault("options", [])
            q.setdefault("correctAnswer", "")
            q.setdefault("explanation", "")
            q.setdefault("hint", "")
            q.setdefault("topic", topic)
            q.setdefault("difficulty", difficulty)
            if q["questionText"] and len(q["options"]) >= 2:
                validated.append(q)
        if not validated:
            raise AIServiceError("No valid quiz questions were generated. Please try again.")
        return validated[:count]

    # ─── Recommendations ─────────────────────────────────────────────────────

    def get_recommendation(self, weak_topics: list, recent_scores: dict, completed: list) -> dict:
        if not weak_topics and not completed:
            return {
                "topicId": "intro",
                "topicTitle": "Introduction to Python",
                "reason": "Start your Python journey with the basics!",
                "suggestedActivity": "learn",
                "difficulty": "easy",
            }
        prompt = build_recommendation_prompt(weak_topics, recent_scores, completed)
        messages = [{"role": "user", "content": prompt}]
        try:
            raw = self._chat(messages, temperature=0.5, max_tokens=300)
            data = self._parse_json(raw)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
        # Fallback
        fallback_topic = weak_topics[0] if weak_topics else "intro"
        return {
            "topicId": fallback_topic,
            "topicTitle": fallback_topic.replace("-", " ").title(),
            "reason": "This topic needs more practice based on your recent performance.",
            "suggestedActivity": "revise",
            "difficulty": "easy",
        }


ai_service = AIService()
