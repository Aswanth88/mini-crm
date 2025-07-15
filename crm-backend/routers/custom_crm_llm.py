import asyncio
import random
from datetime import datetime
from typing import List, Dict, Optional


class CustomCRMLLM:
    def __init__(self):
        self.initialized = False

    async def initialize(self):
        print("Bootstrapping Advanced CRM LLM engine...")
        await asyncio.sleep(1.2)
        self.initialized = True
        print("Advanced CRM LLM is live with enhanced reasoning and task inference!")

    async def process_query(self, query: str, lead_data: Dict, history: Optional[List[str]] = None) -> Dict:
        if not self.initialized:
            await self.initialize()

        history = history or []
        intent = self.classify_intent(query, history)
        response = self.generate_response(intent, query, lead_data, history)
        actions = self.extract_actions(intent, lead_data)

        return {
            "intent": intent["label"],
            "confidence": intent["score"],
            "response": response,
            "actions": actions,
            "metadata": {
                "processingTime": datetime.utcnow().isoformat(),
                "model": "AdvancedCRM-LLM-v2",
                "tokenCount": len(response.split())
            }
        }

    def classify_intent(self, query: str, history: List[str]) -> Dict:
        q = query.lower()
        compound_query = q + " ".join(history).lower()

        if any(term in compound_query for term in ["follow", "remind", "ping", "email"]):
            return {"label": "follow_up_request", "score": 0.97}
        if any(term in compound_query for term in ["detail", "info", "overview", "profile"]):
            return {"label": "lead_details_request", "score": 0.93}
        if any(term in compound_query for term in ["status", "update", "progress"]):
            return {"label": "status_update", "score": 0.89}
        if any(term in compound_query for term in ["schedule", "meeting", "appointment"]):
            return {"label": "schedule_meeting", "score": 0.91}
        if any(term in compound_query for term in ["analytics", "performance", "report", "kpi"]):
            return {"label": "analytics_request", "score": 0.88}

        return {"label": "general_inquiry", "score": 0.75}

    def generate_response(self, intent: Dict, query: str, lead: Dict, history: List[str]) -> str:
        # DEBUG: Print the lead data to see what's being received
        print(f"DEBUG - Lead data received: {lead}")
        print(f"DEBUG - Lead data keys: {list(lead.keys())}")
        
        name = lead.get("name", "the lead")
        status = lead.get("status", "Unknown")
        email = lead.get("email", "N/A")
        phone = lead.get("phone", "N/A")
        company = lead.get("company", "Unknown")
        address = lead.get("address", "Not Available")
        source = lead.get("source", "Not Available")
        title = lead.get("title", "Not Available")
        industry = lead.get("industry", "Not Available")
        website = lead.get("website", "Not Available")
        
        # DEBUG: Print the final processed values
        print(f"DEBUG - Final values: name={name}, status={status}, email={email}, phone={phone}, company={company}, address={address}, source={source}, title={title}, industry={industry}, website={website}")

        if intent["label"] == "follow_up_request":
            return f"Compose a follow-up email for {name} at {email} based on their current status ({status}). Ensure empathy and personalized value proposition."

        if intent["label"] == "lead_details_request":
            return (f"Lead Profile Summary:\n"
                    f"- Name: {name}\n"
                    f"- Email: {email}\n"
                    f"- Phone: {phone}\n"
                    f"- Status: {status}\n"
                    f"- Address: {address}\n"
                    f"- Source: {source}\n"
                    f"- Company: {company}\n"
                    f"- Title: {title}\n"
                    f"- Industry: {industry}\n"
                    f"- Website: {website}\n"
                    f"- Recommended Next Step: {self.get_recommended_action(status)}")

        if intent["label"] == "status_update":
            options = self.get_status_suggestions(status)
            return f"Current status for {name} is '{status}'. Potential transitions: {', '.join(options)}. Would you like to proceed with an update?"

        if intent["label"] == "schedule_meeting":
            return f"Proposed: {self.suggest_meeting_type(status)} with {name} on {self.suggest_optimal_time()} for qualification and discussion."

        if intent["label"] == "analytics_request":
            return (f"📊 Performance Report for {name} (Status: {status})\n"
                    f"- Engagement Score: {random.randint(60, 100)}\n"
                    f"- Conversion Probability: {random.randint(55, 90)}%\n"
                    f"- Activity Frequency: High\n"
                    f"- Priority Level: High")

        return f"I'm ready to assist with insights or actions for {name}. Type 'follow-up', 'details', or 'analytics' to proceed."

    def extract_actions(self, intent: Dict, lead: Dict) -> List[Dict]:
        actions = []
        lead_id = lead.get("id")

        if intent["label"] == "follow_up_request":
            actions.append({
                "type": "send_email",
                "recipient": lead.get("email"),
                "subject": f"Following up on our discussion - {lead.get('name')}",
                "priority": "urgent"
            })

        elif intent["label"] == "status_update":
            actions.append({
                "type": "update_status",
                "leadId": lead_id,
                "current": lead.get("status"),
                "suggestions": self.get_status_suggestions(lead.get("status"))
            })

        elif intent["label"] == "schedule_meeting":
            actions.append({
                "type": "schedule_meeting",
                "leadId": lead_id,
                "meetingType": self.suggest_meeting_type(lead.get("status")),
                "suggestedTime": self.suggest_optimal_time()
            })

        elif intent["label"] == "analytics_request":
            actions.append({
                "type": "generate_report",
                "leadId": lead_id,
                "reportType": "crm_analytics",
                "metrics": ["engagement", "conversion_probability", "response_rate"]
            })

        return actions

    def get_status_suggestions(self, current_status: str) -> List[str]:
        pipeline = {
            "new": ["contacted", "qualified", "not_interested"],
            "contacted": ["qualified", "converted", "follow_up"],
            "qualified": ["converted", "demo_scheduled", "proposal_sent"],
            "converted": ["negotiation", "closed_won", "closed_lost"],
            "closed_won": ["onboarding"],
            "closed_lost": ["reopen", "nurture"]
        }
        return pipeline.get(current_status, ["contacted", "qualified"])

    def suggest_meeting_type(self, status: str) -> str:
        mapping = {
            "new": "Introductory Call",
            "contacted": "Qualification Meeting",
            "qualified": "Solution Demo",
            "converted": "Proposal Review",
            "closed_won": "Handoff Meeting"
        }
        return mapping.get(status, "Consultation")

    def suggest_optimal_time(self) -> str:
        return random.choice([
            "Monday 11:00 AM",
            "Tuesday 2:30 PM",
            "Wednesday 4:00 PM",
            "Thursday 10:00 AM",
            "Friday 9:30 AM"
        ])

    def get_recommended_action(self, status: str) -> str:
        strategy = {
            "new": "Initiate contact with an introductory email",
            "contacted": "Qualify their needs through conversation",
            "qualified": "Send demo or pitch deck",
            "converted": "Arrange proposal meeting",
            "closed_won": "Initiate onboarding process"
        }
        return strategy.get(status, "Evaluate lead status and plan follow-up")