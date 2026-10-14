from fastapi import APIRouter

router = APIRouter()

TOPICS = [
    {"id": "intro", "title": "Introduction to Python", "description": "What is Python and why use it?"},
    {"id": "variables", "title": "Variables & Data Types", "description": "Numbers, strings, and booleans."},
    {"id": "io", "title": "Input & Output", "description": "Reading and printing data."},
    {"id": "operators", "title": "Operators", "description": "Math and logic in Python."},
    {"id": "conditionals", "title": "Conditional Statements", "description": "If, elif, and else."},
    {"id": "loops", "title": "Loops", "description": "For and while loops."},
    {"id": "strings", "title": "Strings", "description": "String manipulation and formatting."},
    {"id": "collections", "title": "Lists, Tuples, Sets, Dicts", "description": "Data structures in Python."},
    {"id": "functions", "title": "Functions", "description": "Reusable blocks of code."},
    {"id": "debugging", "title": "Basic Problem-Solving", "description": "How to find and fix errors."}
]

@router.get("/")
def get_topics():
    return {"topics": TOPICS}
