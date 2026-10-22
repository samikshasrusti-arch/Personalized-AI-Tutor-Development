"""
Evaluation Service
Provides deterministic, type-aware evaluation for objective practice questions
and safe AI evaluation for open-ended code and explanations without executing code.
"""
import re
import math
from typing import Tuple, Optional, List


def _clean_str(s: str) -> str:
    """Normalize internal and external whitespace."""
    return " ".join(s.strip().split())


def _try_parse_number(val: str) -> Optional[float]:
    """Attempt to parse string as a float/int."""
    cleaned = val.strip().replace(",", "")
    # Check if matches number pattern
    if re.fullmatch(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?", cleaned):
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def evaluate_multiple_choice(
    learner_ans: str,
    expected_ans: str,
    options: Optional[List[str]] = None,
) -> Tuple[bool, str]:
    """
    Evaluates MCQ without substring false positives.
    Recognizes option prefixes (e.g. 'A', 'B') and full option strings.
    """
    l_clean = _clean_str(learner_ans)
    e_clean = _clean_str(expected_ans)

    if not l_clean:
        return False, "No answer provided."

    # Direct exact match
    if l_clean.lower() == e_clean.lower():
        return True, "Correct! Great job."

    # Extract prefix letter if formatted like 'A) ...' or 'A. ...'
    def extract_prefix_and_body(text: str) -> Tuple[str, str]:
        m = re.match(r"^([A-Da-d])[\)\.\:\-\s]+(.*)$", text)
        if m:
            return m.group(1).upper(), _clean_str(m.group(2)).lower()
        if re.fullmatch(r"^[A-Da-d]$", text):
            return text.upper(), ""
        return "", text.lower()

    l_letter, l_body = extract_prefix_and_body(l_clean)
    e_letter, e_body = extract_prefix_and_body(e_clean)

    # If both have letters (e.g. 'A' vs 'A')
    if l_letter and e_letter and l_letter == e_letter:
        return True, "Correct! Great job."

    # If learner submitted letter only and expected has matching letter
    if l_letter and e_letter and l_letter != e_letter:
        return False, f"Not quite. The correct answer is: {expected_ans}"

    # If learner submitted body text matching expected body text
    if l_body and e_body and l_body == e_body:
        return True, "Correct! Great job."

    # Check against options list if available
    if options:
        # Find expected option in options
        matching_opt = None
        for opt in options:
            o_letter, o_body = extract_prefix_and_body(opt)
            if (e_letter and o_letter == e_letter) or (e_body and o_body == e_body):
                matching_opt = opt
                break

        if matching_opt:
            m_letter, m_body = extract_prefix_and_body(matching_opt)
            if l_letter and m_letter and l_letter == m_letter:
                return True, "Correct! Great job."
            if l_body and m_body and l_body == m_body:
                return True, "Correct! Great job."

    return False, f"Not quite. The correct answer is: {expected_ans}"


def evaluate_numeric_or_string(learner_ans: str, expected_ans: str) -> Tuple[bool, str]:
    """
    Evaluates numeric answers strictly by value, avoiding substring bugs like '1' in '10'.
    """
    l_num = _try_parse_number(learner_ans)
    e_num = _try_parse_number(expected_ans)

    if l_num is not None and e_num is not None:
        # Exact integer comparison if both are integers
        if l_num.is_integer() and e_num.is_integer():
            if int(l_num) == int(e_num):
                return True, "Correct! Great job."
            return False, f"Not quite. Expected {int(e_num)}, but received {int(l_num)}."
        # Floating point with strict tolerance
        if math.isclose(l_num, e_num, rel_tol=1e-5, abs_tol=1e-5):
            return True, "Correct! Great job."
        return False, f"Not quite. Expected {expected_ans}, but received {learner_ans}."

    # If either is not a number, compare normalized strings strictly (NO substring matching)
    l_clean = _clean_str(learner_ans)
    e_clean = _clean_str(expected_ans)

    if l_clean.lower() == e_clean.lower():
        return True, "Correct! Great job."

    return False, f"Not quite. The correct answer is: {expected_ans}"


def evaluate_predict_output(learner_ans: str, expected_ans: str) -> Tuple[bool, str]:
    """
    Evaluates Python stdout prediction.
    Normalizes newlines and trailing whitespace per line, but preserves value differences.
    """
    # Normalize newlines
    l_norm = learner_ans.replace("\r\n", "\n").replace("\r", "\n").strip()
    e_norm = expected_ans.replace("\r\n", "\n").replace("\r", "\n").strip()

    if l_norm == e_norm:
        return True, "Correct! Great job."

    # Line-by-line whitespace strip
    l_lines = [line.rstrip() for line in l_norm.split("\n")]
    e_lines = [line.rstrip() for line in e_norm.split("\n")]

    if l_lines == e_lines:
        return True, "Correct! Great job."

    # Check if single numeric output
    if len(l_lines) == 1 and len(e_lines) == 1:
        num_match, msg = evaluate_numeric_or_string(l_lines[0], e_lines[0])
        if num_match:
            return True, "Correct! Great job."

    # Also check case-insensitive match if output strings are purely alphabetic
    if l_norm.lower() == e_norm.lower():
        return True, "Correct! Great job."

    return False, f"Not quite. Expected output:\n{expected_ans}"


def evaluate_fill_blank(learner_ans: str, expected_ans: str) -> Tuple[bool, str]:
    """
    Evaluates fill-in-the-blank code tokens.
    Respects Python keyword and identifier case sensitivity and forbids substring false matches.
    """
    l_clean = learner_ans.strip()
    e_clean = expected_ans.strip()

    # 1. Exact token match
    if l_clean == e_clean:
        return True, "Correct! Great job."

    # 2. Check numeric equality if both inputs are valid numbers
    l_num = _try_parse_number(l_clean)
    e_num = _try_parse_number(e_clean)
    if l_num is not None and e_num is not None:
        if l_num.is_integer() and e_num.is_integer():
            if int(l_num) == int(e_num):
                return True, "Correct! Great job."
            return False, f"Not quite. Expected {int(e_num)}, but received {int(l_num)}."
        if math.isclose(l_num, e_num, rel_tol=1e-5, abs_tol=1e-5):
            return True, "Correct! Great job."
        return False, f"Not quite. Expected {expected_ans}, but received {learner_ans}."

    # 3. Python keywords are strictly case-sensitive
    python_keywords = {
        "False", "None", "True", "and", "as", "assert", "async", "await",
        "break", "class", "continue", "def", "del", "elif", "else", "except",
        "finally", "for", "from", "global", "if", "import", "in", "is",
        "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
        "while", "with", "yield"
    }
    if e_clean in python_keywords or l_clean in python_keywords:
        if l_clean != e_clean:
            return False, f"Not quite. Python keywords are case-sensitive. Expected: '{e_clean}', got: '{l_clean}'."

    # 4. Equivalent Python string quotes (e.g. 'hello' vs "hello")
    if len(l_clean) >= 2 and len(e_clean) >= 2:
        l_is_quoted = (l_clean[0] in ("'", '"') and l_clean[-1] == l_clean[0])
        e_is_quoted = (e_clean[0] in ("'", '"') and e_clean[-1] == e_clean[0])
        if l_is_quoted and e_is_quoted:
            if l_clean[1:-1] == e_clean[1:-1]:
                return True, "Correct! Great job. (Single and double quotes are interchangeable in Python)"

    # 5. Normalized whitespace match
    if _clean_str(l_clean) == _clean_str(e_clean):
        return True, "Correct! Great job."

    return False, f"Not quite. Expected: {expected_ans}"
