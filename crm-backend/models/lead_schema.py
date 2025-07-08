# backend/models/lead_schema.py

from pydantic import BaseModel
from typing import Optional, List

class Lead(BaseModel):
    id: Optional[str]
    name: str
    email: str
    phone: Optional[str] = ""
    status: Optional[str] = "new"

class QueryRequest(BaseModel):
    query: str
    lead: Lead
    conversationHistory: Optional[List[str]] = []
