import unittest
from app.services.evaluator import (
    evaluate_multiple_choice,
    evaluate_numeric_or_string,
    evaluate_predict_output,
    evaluate_fill_blank,
)


class TestEvaluator(unittest.TestCase):

    def test_multiple_choice(self):
        # By option letter
        is_cor, _ = evaluate_multiple_choice("A", "A) Python is dynamically typed", ["A) Python is dynamically typed", "B) Java"])
        self.assertTrue(is_cor)

        # By full text
        is_cor, _ = evaluate_multiple_choice("Python is dynamically typed", "A) Python is dynamically typed")
        self.assertTrue(is_cor)

        # Wrong choice
        is_cor, _ = evaluate_multiple_choice("B", "A) Python is dynamically typed")
        self.assertFalse(is_cor)

        # Substring false positive prevention (e.g. "a" in "Java")
        is_cor, _ = evaluate_multiple_choice("Java", "A) C++", ["A) C++", "B) Java"])
        self.assertFalse(is_cor)

    def test_numeric_or_string(self):
        # Strict numbers
        is_cor, _ = evaluate_numeric_or_string("42", "42")
        self.assertTrue(is_cor)

        # Float tolerance
        is_cor, _ = evaluate_numeric_or_string("3.14159", "3.141592")
        self.assertTrue(is_cor)

        # Avoid substring match bug (1 in 10)
        is_cor, _ = evaluate_numeric_or_string("1", "10")
        self.assertFalse(is_cor)

        is_cor, _ = evaluate_numeric_or_string("10", "1")
        self.assertFalse(is_cor)

    def test_predict_output(self):
        # Normalizes trailing newlines
        is_cor, _ = evaluate_predict_output("Hello World\n", "Hello World")
        self.assertTrue(is_cor)

        # Line-by-line whitespace
        is_cor, _ = evaluate_predict_output("Line 1 \nLine 2", "Line 1\nLine 2")
        self.assertTrue(is_cor)

        # Wrong output
        is_cor, _ = evaluate_predict_output("Line 1", "Line 2")
        self.assertFalse(is_cor)

    def test_fill_blank(self):
        # Python keywords must match exact case
        is_cor, _ = evaluate_fill_blank("True", "True")
        self.assertTrue(is_cor)

        is_cor, _ = evaluate_fill_blank("true", "True")
        self.assertFalse(is_cor)

        is_cor, _ = evaluate_fill_blank("def", "def")
        self.assertTrue(is_cor)

        is_cor, _ = evaluate_fill_blank("Def", "def")
        self.assertFalse(is_cor)

        # Single and double quote equivalency
        is_cor, _ = evaluate_fill_blank('"hello"', "'hello'")
        self.assertTrue(is_cor)


if __name__ == "__main__":
    unittest.main()
