# backend/models/lead_schema.py

from pydantic import BaseModel
from typing import Optional, List

class Lead(BaseModel):
    id: Optional[str]
    name: str
    email: str
    phone: Optional[str] = ""
    status: Optional[str] = "new"
    company: Optional[str] = "Unknown"
    address: Optional[str] = "Not Available"
    source: Optional[str] = "Not Available"
    title: Optional[str] = "Not Available"
    industry: Optional[str] = "Not Available"
    website: Optional[str] = "Not Available"
    
class QueryRequest(BaseModel):
    query: str
    lead: Lead
    conversationHistory: Optional[List[str]] = []
