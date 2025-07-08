from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.lead_schema import QueryRequest
from routers.custom_crm_llm import CustomCRMLLM

app = FastAPI()
llm = CustomCRMLLM()

# CORS (adjust frontend port if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Mini-CRM backend running"}

@app.post("/llm")
async def handle_llm_query(request: QueryRequest):
    result = await llm.process_query(
        query=request.query,
        lead_data=request.lead.dict(),
        history=request.conversationHistory
    )
    return result