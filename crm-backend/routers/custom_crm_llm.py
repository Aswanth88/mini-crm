import asyncio
import random
from datetime import datetime

class CustomCRMLLM:
    def __init__(self):
        self.initialized = False

    async def initialize(self):
        # Simulate model init delay
        print("Initializing Mock CRM LLM...")
        await asyncio.sleep(1)
        self.initialized = True
        print("Mock CRM LLM initialized successfully")

    async def process_query(self, query, lead_data, history=None):
        if not self.initialized:
            await self.initialize()

        intent = self.classify_intent(query)
        response = self.generate_response(intent, query, lead_data)
        actions = self.extract_actions(intent, lead_data)

        return {
            "intent": intent["label"],
            "confidence": intent["score"],
            "response": response,
            "actions": actions,
            "metadata": {
                "processingTime": datetime.utcnow().isoformat(),
                "model": "MockCRM-LLM-v1",
                "tokenCount": len(response)
            }
        }

    def classify_intent(self, query):
        q = query.lower()
        if "follow" in q or "email" in q or "contact" in q:
            return {"label": "follow_up_request", "score": 0.95}
        if "detail" in q or "info" in q or "tell me about" in q:
            return {"label": "lead_details_request", "score": 0.90}
        if "update" in q or "status" in q or "change" in q:
            return {"label": "status_update", "score": 0.85}
        if "schedule" in q or "meeting" in q or "appointment" in q:
            return {"label": "schedule_meeting", "score": 0.88}
        if "analytics" in q or "report" in q or "performance" in q:
            return {"label": "analytics_request", "score": 0.82}
        return {"label": "general_inquiry", "score": 0.70}

    def generate_response(self, intent, query, lead):
        name = lead.get("name", "the lead")
        status = lead.get("status", "Not specified")

        if intent["label"] == "follow_up_request":
            return f"I'll help you create a follow-up email for {name}. Given their current status ({status}), here's a personalized strategy."

        elif intent["label"] == "lead_details_request":
            return f"Lead: {name}\n\n📧 Email: {lead.get('email')}\n📊 Status: {status}\n📅 Last Contact: {lead.get('lastContact', 'Not specified')}\n💼 Company: {lead.get('company', 'Not specified')}\n📱 Phone: {lead.get('phone', 'Not specified')}"

        elif intent["label"] == "status_update":
            suggestions = self.get_status_suggestions(status)
            return f"{name} is currently '{status}'. Suggested next statuses: {', '.join(suggestions)}."

        elif intent["label"] == "schedule_meeting":
            return f"Suggesting a {self.suggest_meeting_type(status)} with {name} next {self.suggest_optimal_time()}."

        elif intent["label"] == "analytics_request":
            return f"📊 Analytics for {name}:\nLead Score: {random.randint(50, 100)}\nEngagement: High\nConversion Probability: {random.randint(50, 95)}%"

        else:
            return f"I'm here to assist you with CRM-related tasks for {name}. Let me know what you need."

    def extract_actions(self, intent, lead):
        actions = []

        if intent["label"] == "follow_up_request":
            actions.append({
                "type": "generate_email",
                "recipient": lead.get("email"),
                "priority": "high",
                "suggestedSubject": f"Following up on our conversation - {lead.get('name')}"
            })

        elif intent["label"] == "status_update":
            actions.append({
                "type": "update_status",
                "leadId": lead.get("id"),
                "suggestions": self.get_status_suggestions(lead.get("status")),
                "currentStatus": lead.get("status")
            })

        elif intent["label"] == "schedule_meeting":
            actions.append({
                "type": "schedule_meeting",
                "leadId": lead.get("id"),
                "meetingType": self.suggest_meeting_type(lead.get("status")),
                "suggestedTime": self.suggest_optimal_time()
            })

        elif intent["label"] == "analytics_request":
            actions.append({
                "type": "generate_report",
                "leadId": lead.get("id"),
                "reportType": "lead_analytics",
                "metrics": ["engagement", "conversion_probability", "response_rate"]
            })

        return actions

    def get_status_suggestions(self, current):
        transitions = {
            "New": ["Contacted", "Qualified", "Not Interested"],
            "Contacted": ["Qualified", "Opportunity", "Nurture"],
            "Qualified": ["Opportunity", "Proposal Sent", "Not Qualified"],
            "Opportunity": ["Closed Won", "Closed Lost", "Negotiation"],
            "Closed Won": ["Onboarding", "Upsell Opportunity"],
            "Closed Lost": ["Nurture", "Archive"]
        }
        return transitions.get(current, ["Contacted", "Qualified", "Not Interested"])

    def suggest_meeting_type(self, status):
        mapping = {
            "New": "Discovery Call",
            "Contacted": "Needs Assessment",
            "Qualified": "Product Demo",
            "Opportunity": "Proposal Review",
            "Closed Won": "Kickoff Meeting"
        }
        return mapping.get(status, "Discovery Call")

    def suggest_optimal_time(self):
        return random.choice([
            "Tuesday 10:00 AM",
            "Wednesday 2:00 PM",
            "Thursday 11:00 AM",
            "Friday 9:00 AM"
        ])
