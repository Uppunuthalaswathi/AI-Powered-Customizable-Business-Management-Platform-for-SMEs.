import os


def answer_business_question(question: str) -> dict:
    """Provider-independent seam. No model is called until an adapter is configured."""
    if not os.getenv("LLM_PROVIDER") or not os.getenv("LLM_API_KEY"):
        return {"available": False, "answer": None, "message": "Business-question answering is not configured. No AI answer was generated."}
    return {"available": False, "answer": None, "message": "The configured provider adapter is not implemented yet."}
