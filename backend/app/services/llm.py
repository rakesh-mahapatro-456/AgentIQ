import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0.1, # Keep it low for factual sales data
            model_name="llama-3.3-70b-versatile", # Updated to current model
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

    def get_model(self):
        return self.llm

llm_service = LLMService()