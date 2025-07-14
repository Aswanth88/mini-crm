from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models.lead_schema import QueryRequest
from routers.custom_crm_llm import CustomCRMLLM
from routers import email_sender
from routers.ocr import DocumentImageProcessor
from dotenv import load_dotenv
import logging
import tempfile
import os
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Mini-CRM Backend",
    description="A FastAPI backend for Mini-CRM with LLM integration",
    version="1.0.0"
)

# Initialize LLM and OCR processor (with error handling)
try:
    llm = CustomCRMLLM()
    logger.info("CustomCRMLLM initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize CustomCRMLLM: {e}")
    llm = None

try:
    # Initialize OCR processor with your OpenRouter API key
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not found in environment variables")
        ocr_processor = None
    else:
        ocr_processor = DocumentImageProcessor(openrouter_api_key)
        logger.info("OCR processor initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OCR processor: {e}")
    ocr_processor = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    health_status = {
        "status": "healthy",
        "service": "Mini-CRM Backend",
        "llm_available": llm is not None,
        "ocr_available": ocr_processor is not None,
        "timestamp": time.time()
    }
    return JSONResponse(content=health_status)

# Favicon endpoint (returns 204 No Content)
@app.get("/favicon.ico")
async def favicon():
    """Return 204 for favicon requests to avoid 404 errors"""
    return JSONResponse(content=None, status_code=204)

# Root endpoint
@app.get("/")
async def read_root():
    """Root endpoint with basic service information"""
    return {
        "message": "Mini-CRM backend running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "llm": "/llm (POST)",
            "ocr": "/ocr (POST)",
            "docs": "/docs"
        }
    }

# LLM endpoint with enhanced error handling
@app.post("/llm")
async def handle_llm_query(request: QueryRequest):
    """Handle LLM queries with proper error handling"""
    try:
        if llm is None:
            raise HTTPException(
                status_code=503, 
                detail="LLM service is not available"
            )
        
        # Validate request
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
        
        # Process the query
        result = await llm.process_query(
            query=request.query,
            lead_data=request.lead.model_dump(),
            history=request.conversationHistory
        )
        
        logger.info(f"Successfully processed query: {request.query[:50]}...")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing LLM query: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing query"
        )

# OCR endpoint for image processing
@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """Process uploaded image for OCR and lead extraction"""
    start_time = time.time()
    
    try:
        # Check if OCR processor is available
        if ocr_processor is None:
            raise HTTPException(
                status_code=503,
                detail="OCR service is not available. Please check OPENROUTER_API_KEY configuration."
            )
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPG, PNG, GIF, BMP)"
            )
        
        # Validate file size (max 10MB)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )
        
        # Create temporary file to save uploaded image
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Process the image using OCR
            logger.info(f"Processing OCR for file: {file.filename}")
            leads = ocr_processor.process_image(tmp_file_path)
            
            # Process leads and add confidence scores
            leads_data = []
            for lead in leads:
                # Calculate confidence based on available fields
                confidence = calculate_lead_confidence(lead)
                
                lead_dict = {
                    'name': lead.name,
                    'company': lead.company,
                    'title': lead.title,
                    'email': lead.email,
                    'phone': lead.phone,
                    'address': lead.address,
                    'industry': lead.industry,
                    'website': lead.website,
                    'social_media': lead.social_media,
                    'additional_info': lead.additional_info,
                    'confidence': confidence
                }
                leads_data.append(lead_dict)
            
            processing_time = time.time() - start_time
            
            logger.info(f"Successfully processed OCR, found {len(leads_data)} leads in {processing_time:.2f}s")
            
            # Return standardized response format
            return {
                "success": True,
                "filename": file.filename,
                "leads_count": len(leads_data),
                "leads": leads_data,
                "processing_time": processing_time,
                "message": f"Successfully extracted {len(leads_data)} lead(s) from {file.filename}"
            }
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing OCR: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while processing image: {str(e)}"
        )

def calculate_lead_confidence(lead):
    """Calculate confidence score based on available lead information"""
    score = 0
    
    # Essential fields (higher weight)
    if lead.name:
        score += 3
    if lead.email:
        score += 2
    if lead.phone:
        score += 2
    
    # Additional fields (lower weight)
    if lead.company:
        score += 1
    if lead.title:
        score += 1
    if lead.address:
        score += 1
    if lead.industry:
        score += 1
    if lead.website:
        score += 1
    if lead.social_media:
        score += 1
    if lead.additional_info:
        score += 1
    
    # Normalize to 0-1 scale
    max_score = 13  # 3+2+2+1+1+1+1+1+1+1
    confidence = min(score / max_score, 1.0)
    
    return confidence

# Error handler for 404s
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "detail": f"Endpoint not found: {request.url.path}",
            "available_endpoints": ["/", "/health", "/llm", "/ocr", "/docs"]
        }
    )

# Include email sender router
try:
    app.include_router(email_sender.router)
    logger.info("Email sender router included successfully")
except Exception as e:
    logger.error(f"Failed to include email sender router: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Mini-CRM Backend starting up...")
    logger.info("Health check available at: /health")
    logger.info("API documentation available at: /docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)