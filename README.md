# AI Tutor — Personalized AI Learning Assistant

An adaptive, full-stack educational platform built for college students and beginners learning **Python Programming Basics**. Powered by the **Groq API** (using `openai/gpt-oss-120b`), **FastAPI**, **React 19**, **Vite**, **TypeScript**, and **SQLite**.

---

## 🌟 Key Features

1. **Personalized Onboarding & Learner Profiles**
   - Captures experience level (`beginner`, `some_coding`, `intermediate`), explanation style (`simple`, `detailed`, `analogy-based`), and target difficulty (`easy`, `medium`, `hard`).
   - Stored in persistent local storage and SQLite backend.

2. **Learn Mode (Conversational Tutoring)**
   - Structured topic lessons: core concept definition, real-world examples, step-by-step code walkthroughs, common misconceptions, and quick checks.
   - Interactive doubt solving: ask follow-up questions, request simpler analogies, or request alternative examples.
   - Lesson completion tracking that marks topics done and boosts learner mastery.

3. **Dynamic Practice Mode**
   - Supports 5 distinct question types:
     - Multiple Choice Questions (MCQs)
     - Predict the Output
     - Fill in the Blanks
     - Find the Bug / Error Detection
     - Short Code Snippets
   - Instant deterministic grading for objective questions and AI evaluation for open-ended code questions.
   - On-demand progressive hints before revealing explanations.

4. **Assessment Quiz Mode**
   - Configurable question counts (3, 5, 10) and difficulty levels.
   - Built-in timer and progress stepper navigation.
   - **Deterministic scoring** computed strictly in application code (not hallucinated by LLM).
   - Detailed question review comparing learner answer vs. correct answer with in-depth explanations.

5. **Progress & Revision Hub (Adaptive Learning)**
   - Deterministic Topic Mastery formula incorporating lesson completion (15%), practice volume (25%), and quiz scores (60%).
   - Identifies **Strong Topics** (≥70% mastery) and **Weak Topics** needing revision.
   - AI-generated personalized study plan and recommendation for next best activity.

6. **System Diagnostics & Settings**
   - Live backend health monitoring (`/api/health`).
   - Real-time verification of Groq model connection and API key status.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19 + Vite + TS)          │
│  - Zustand State Store  - Tailwind CSS  - Lucide Icons      │
│  - Learn Workspace     - Practice Hub  - Assessment Quiz    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (Proxy :5173 -> :8001)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (FastAPI + Uvicorn)              │
│  - Pydantic Schemas     - Pure SQLite DB Layer              │
│  - Progress Service     - Deterministic Evaluation Engine   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     Local SQLite DB         │ │      Groq Cloud API         │
│  - learner_profiles         │ │  - Model: openai/gpt-oss-120b
│  - learning_sessions        │ │  - Fast LLM inference       │
│  - practice_attempts        │ │  - Structured JSON parsing  │
│  - quiz_attempts & progress │ └─────────────────────────────┘
└─────────────────────────────┘
```

---

## 📂 Project Structure

```
Project/
├── backend/
│   ├── .env                    # Groq API key and model config
│   ├── .env.example            # Example configuration template
│   ├── main.py                 # FastAPI application entrypoint
│   ├── app/
│   │   ├── api/                # API routes (topics, learn, practice, quiz, progress)
│   │   ├── core/               # Pydantic settings & config
│   │   ├── db/                 # Pure SQLite database access layer
│   │   ├── models/             # Pydantic schemas
│   │   └── services/           # AI service (Groq SDK) & Progress calculation service
│   └── venv/                   # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI layout & navigation
│   │   ├── pages/              # Dashboard, Learn, Practice, Quiz, Progress, Settings
│   │   ├── services/           # Axios API client
│   │   ├── store/              # Zustand learner profile store
│   │   └── types/              # TypeScript interfaces & types
│   ├── vite.config.ts          # Vite configuration with proxy to port 8001
│   └── package.json            # Frontend dependencies
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Groq API Key (from [console.groq.com](https://console.groq.com))

### 1. Backend Setup

```bash
cd backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Create .env file with your Groq API key:
# GROQ_API_KEY=gsk_...
# GROQ_MODEL=openai/gpt-oss-120b

# Run backend server
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
The backend API documentation will be accessible at: `http://127.0.0.1:8001/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`

---

## 🎯 Verification & Testing

- **Backend Health Check:**
  ```bash
  curl http://127.0.0.1:8001/api/health
  ```
- **Run Frontend Production Build:**
  ```bash
  cd frontend
  npm run build
  ```

---

## 🎓 Academic viva / Project Demonstration Notes
- **Why pure SQLite?** Avoids compiled binary dependencies and platform-specific DLL blocks while delivering instant zero-config ACID local persistence.
- **Why deterministic scoring for quizzes?** Never rely on LLMs to count scores or do math; LLMs generate the questions and rich explanations, while application code calculates exact grades and progress analytics.
- **How is mastery computed?** Weighted combination of lesson engagement, practice attempt success, and best assessment quiz scores.
