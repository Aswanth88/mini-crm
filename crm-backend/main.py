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
from PIL import Image
import fitz  # PyMuPDF
import numpy as np
import io

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
    """Process uploaded image or PDF for OCR and lead extraction"""
    start_time = time.time()
    
    try:
        # Check if OCR processor is available
        if ocr_processor is None:
            raise HTTPException(
                status_code=503,
                detail="OCR service is not available. Please check OPENROUTER_API_KEY configuration."
            )
        
        # Read file content
        content = await file.read()
        
        # Validate file size (max 10MB)
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )
        
        # Check file type and handle accordingly
        if file.content_type == 'application/pdf':
            # Convert PDF to images
            image_paths = await convert_pdf_to_images(content)
        elif file.content_type.startswith('image/'):
            # Handle regular image files
            image_paths = await save_image_file(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPG, PNG, GIF, BMP) or PDF"
            )
        
        # Process all images for OCR
        all_leads = []
        optimized_image_paths = []
        
        try:
            for image_path in image_paths:
                # Optimize image for better OCR results
                optimized_path = optimize_image_for_ocr(image_path)
                optimized_image_paths.append(optimized_path)
                
                logger.info(f"Processing OCR for optimized image: {optimized_path}")
                leads = ocr_processor.process_image(optimized_path)
                all_leads.extend(leads)
            
            # Process leads and add confidence scores
            leads_data = []
            for lead in all_leads:
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
                "file_type": "PDF" if file.content_type == 'application/pdf' else "Image",
                "pages_processed": len(image_paths),
                "leads_count": len(leads_data),
                "leads": leads_data,
                "processing_time": processing_time,
                "message": f"Successfully extracted {len(leads_data)} lead(s) from {file.filename}"
            }
            
        finally:
            # Clean up temporary files (both original and optimized)
            all_paths_to_cleanup = image_paths + optimized_image_paths
            for image_path in set(all_paths_to_cleanup):  # Use set to avoid duplicates
                try:
                    if os.path.exists(image_path):
                        os.unlink(image_path)
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary file {image_path}: {e}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing OCR: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while processing file: {str(e)}"
        )

async def convert_pdf_to_images(pdf_content: bytes) -> list:
    """Convert PDF content to image files using PyMuPDF (no external dependencies)"""
    try:
        # Open PDF from bytes
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        
        image_paths = []
        
        # Process each page
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Render page to image with high DPI for better OCR
            mat = fitz.Matrix(3.0, 3.0)  # 3x zoom = ~300 DPI
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            
            # Save as temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'_page_{page_num+1}.png') as tmp_file:
                image.save(tmp_file, format='PNG')
                image_paths.append(tmp_file.name)
        
        pdf_document.close()
        logger.info(f"Successfully converted PDF to {len(image_paths)} image(s) using PyMuPDF")
        return image_paths
        
    except Exception as e:
        logger.error(f"Error converting PDF to images with PyMuPDF: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert PDF to images: {str(e)}"
        )

async def save_image_file(image_content: bytes) -> list:
    """Save image content to temporary file and return list with single file path"""
    try:
        # Create temporary file to save uploaded image
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_file:
            tmp_file.write(image_content)
            return [tmp_file.name]
            
    except Exception as e:
        logger.error(f"Error saving image file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save image file: {str(e)}"
        )
def optimize_image_for_ocr(image_path: str) -> str:
    """Optimize image for better OCR results"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Enhance image quality for OCR
            # You can add more image processing here like:
            # - Increase contrast
            # - Remove noise
            # - Adjust brightness
            # - Resize if too small
            
            # Save optimized image
            optimized_path = image_path.replace('.png', '_optimized.png')
            img.save(optimized_path, format='PNG', optimize=True)
            
            # Remove original and return optimized path
            os.unlink(image_path)
            return optimized_path
            
    except Exception as e:
        logger.warning(f"Failed to optimize image {image_path}: {e}")
        return image_path 
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