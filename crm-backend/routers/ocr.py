import requests
import base64
import json
import re
import time
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import os
from PIL import Image
import io
import pytesseract
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed

@dataclass
class Lead:
    """Data class to represent extracted lead information"""
    name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    additional_info: Optional[str] = None

class DocumentImageProcessor:
    """Main class for processing documents and images to extract leads"""
    
    def __init__(self, openrouter_api_key: str, model_name: str = "mistralai/mistral-small-3.2-24b-instruct:free", 
                 api_timeout: int = 30, max_documents_for_api: int = 5):
        """
        Initialize the processor with OpenRouter API key
        
        Args:
            openrouter_api_key: Your OpenRouter API key
            model_name: The image-to-text model to use
            api_timeout: Timeout for API calls in seconds
            max_documents_for_api: Maximum number of documents to process via API before switching to OCR
        """
        self.api_key = openrouter_api_key
        self.model_name = model_name
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.api_timeout = api_timeout
        self.max_documents_for_api = max_documents_for_api
        
        # Validate API key
        if not self.api_key or self.api_key == "OPENROUTER_API_KEY":
            raise ValueError("Please provide a valid OpenRouter API key")
        
        # Setup regex patterns for lead extraction
        self._setup_regex_patterns()
        
        print(f"Initialized with model: {self.model_name}")
        print(f"API timeout: {self.api_timeout} seconds")
        print(f"Max documents for API: {self.max_documents_for_api}")
    
    def _setup_regex_patterns(self):
        """Setup regex patterns for extracting lead information"""
        # Email pattern
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        # Phone pattern (supports various formats)
        self.phone_pattern = re.compile(r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})')
        
        # Website pattern
        self.website_pattern = re.compile(r'https?://(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?')
        
        # Social media patterns
        self.linkedin_pattern = re.compile(r'(?:linkedin\.com/in/|@)([a-zA-Z0-9-]+)')
        self.twitter_pattern = re.compile(r'(?:twitter\.com/|@)([a-zA-Z0-9_]+)')
        
        # Name patterns (basic - looks for capitalized words)
        self.name_pattern = re.compile(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b')
        
        # Common job titles
        self.title_keywords = [
            'CEO', 'CTO', 'CFO', 'COO', 'President', 'Vice President', 'VP',
            'Director', 'Manager', 'Engineer', 'Developer', 'Analyst', 'Consultant',
            'Specialist', 'Coordinator', 'Assistant', 'Executive', 'Lead', 'Senior',
            'Principal', 'Head of', 'Chief'
        ]
        
        # Company indicators
        self.company_indicators = [
            'Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Ltd', 'Limited',
            'Technologies', 'Solutions', 'Services', 'Group', 'Associates'
        ]
    
    def extract_text_with_tesseract(self, image_path: str) -> str:
        """
        Extract text from image using Tesseract OCR
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text from the image
        """
        try:
            # Use Tesseract to extract text
            text = pytesseract.image_to_string(Image.open(image_path))
            return text
        except Exception as e:
            raise Exception(f"Error extracting text with Tesseract: {str(e)}")
    
    def extract_leads_with_regex(self, text: str) -> List[Lead]:
        """
        Extract lead information from text using regex patterns
        
        Args:
            text: The text to extract leads from
            
        Returns:
            List of Lead objects
        """
        leads = []
        
        # Extract all matches
        emails = self.email_pattern.findall(text)
        phones = self.phone_pattern.findall(text)
        websites = self.website_pattern.findall(text)
        names = self.name_pattern.findall(text)
        
        # Extract social media
        linkedin_handles = self.linkedin_pattern.findall(text)
        twitter_handles = self.twitter_pattern.findall(text)
        
        # Group related information
        lines = text.split('\n')
        
        # Try to associate information together
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Check if this line contains contact information
            line_emails = self.email_pattern.findall(line)
            line_phones = self.phone_pattern.findall(line)
            line_names = self.name_pattern.findall(line)
            
            if line_emails or line_phones or line_names:
                lead = Lead()
                
                # Extract information from current line and surrounding lines
                context_lines = []
                for j in range(max(0, i-2), min(len(lines), i+3)):
                    context_lines.append(lines[j].strip())
                
                context_text = ' '.join(context_lines)
                
                # Extract email
                if line_emails:
                    lead.email = line_emails[0]
                
                # Extract phone
                if line_phones:
                    lead.phone = f"({line_phones[0][0]}) {line_phones[0][1]}-{line_phones[0][2]}"
                
                # Extract name
                if line_names:
                    lead.name = line_names[0]
                elif names:
                    # Find closest name
                    for name in names:
                        if name in context_text:
                            lead.name = name
                            break
                
                # Extract title
                for title in self.title_keywords:
                    if title.lower() in context_text.lower():
                        lead.title = title
                        break
                
                # Extract company
                for indicator in self.company_indicators:
                    pattern = rf'\b\w+\s+{indicator}\b'
                    company_match = re.search(pattern, context_text, re.IGNORECASE)
                    if company_match:
                        lead.company = company_match.group()
                        break
                
                # Extract website
                website_matches = self.website_pattern.findall(context_text)
                if website_matches:
                    lead.website = website_matches[0]
                
                # Extract social media
                social_media = {}
                for handle in linkedin_handles:
                    if handle in context_text:
                        social_media['linkedin'] = handle
                        break
                
                for handle in twitter_handles:
                    if handle in context_text:
                        social_media['twitter'] = handle
                        break
                
                if social_media:
                    lead.social_media = social_media
                
                # Add additional info
                lead.additional_info = context_text[:200] + "..." if len(context_text) > 200 else context_text
                
                # Only add if we have meaningful information
                if lead.email or lead.phone or lead.name:
                    leads.append(lead)
        
        # If no structured leads found, create basic leads from extracted data
        if not leads:
            max_items = max(len(emails), len(phones), len(names))
            for i in range(max_items):
                lead = Lead()
                if i < len(emails):
                    lead.email = emails[i]
                if i < len(phones):
                    lead.phone = f"({phones[i][0]}) {phones[i][1]}-{phones[i][2]}"
                if i < len(names):
                    lead.name = names[i]
                
                if lead.email or lead.phone or lead.name:
                    leads.append(lead)
        
        return leads
    
    def encode_image(self, image_path: str) -> str:
        """
        Encode image to base64 string
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded string of the image
        """
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            raise Exception(f"Error encoding image: {str(e)}")
    
    def compress_image(self, image_path: str, max_size: int = 1024) -> str:
        """
        Compress image if it's too large while maintaining aspect ratio
        
        Args:
            image_path: Path to the image file
            max_size: Maximum dimension size in pixels
            
        Returns:
            Base64 encoded string of the compressed image
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA'):
                    img = img.convert('RGB')
                
                # Calculate new size maintaining aspect ratio
                width, height = img.size
                if width > max_size or height > max_size:
                    if width > height:
                        new_width = max_size
                        new_height = int((height * max_size) / width)
                    else:
                        new_height = max_size
                        new_width = int((width * max_size) / height)
                    
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Convert to base64
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                return base64.b64encode(buffer.getvalue()).decode('utf-8')
                
        except Exception as e:
            raise Exception(f"Error compressing image: {str(e)}")
    
    def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using OpenRouter API with timeout handling
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text from the image
        """
        try:
            # Encode and compress image
            base64_image = self.compress_image(image_path)
            
            # Prepare the prompt for text extraction
            prompt = """
            Please extract all text content from this image. Focus on:
            - Names of people and organizations
            - Contact information (emails, phone numbers, addresses)
            - Job titles and positions
            - Company names and industries
            - Website URLs and social media handles
            - Any other relevant business information
            
            Please provide the extracted text in a structured format.
            """
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "Lead Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            # Check if the response has the expected structure
            if 'choices' not in result:
                raise Exception(f"Unexpected API response structure: {result}")
            
            if not result['choices']:
                raise Exception("No choices returned from API")
            
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.Timeout:
            raise TimeoutError(f"API request timed out after {self.api_timeout} seconds")
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")
    
    def generate_leads_from_text(self, text: str) -> List[Lead]:
        """
        Generate lead information from extracted text using OpenRouter API with timeout handling
        
        Args:
            text: The extracted text content
            
        Returns:
            List of Lead objects
        """
        try:
            prompt = f"""
            Based on the following text, extract and structure lead information. 
            Please identify all potential leads (people/companies) and return them in JSON format.
            
            For each lead, extract:
            - name (person or company name)
            - company (if it's a person, their company)
            - title (job title/position)
            - email (email address)
            - phone (phone number)
            - address (physical address)
            - industry (business industry)
            - website (website URL)
            - social_media (social media handles as key-value pairs)
            - additional_info (any other relevant information)
            
            Text to analyze:
            {text}
            
            Please return the response as a JSON array of lead objects. If no leads are found, return an empty array.
            Example format:
            [
                {{
                    "name": "John Doe",
                    "company": "Tech Corp",
                    "title": "Software Engineer",
                    "email": "john@techcorp.com",
                    "phone": "+1-555-0123",
                    "address": "123 Tech Street, San Francisco, CA",
                    "industry": "Technology",
                    "website": "https://techcorp.com",
                    "social_media": {{"linkedin": "john-doe", "twitter": "@johndoe"}},
                    "additional_info": "Specializes in AI/ML"
                }}
            ]
            """
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "Lead Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            # Check if the response has the expected structure
            if 'choices' not in result:
                raise Exception(f"Unexpected API response structure: {result}")
            
            if not result['choices']:
                raise Exception("No choices returned from API")
            
            content = result['choices'][0]['message']['content']
            
            # Extract JSON from the response
            try:
                # Find JSON content within the response
                start = content.find('[')
                end = content.rfind(']') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                    leads_data = json.loads(json_str)
                else:
                    leads_data = json.loads(content)
                
                # Convert to Lead objects
                leads = []
                for lead_data in leads_data:
                    lead = Lead(
                        name=lead_data.get('name'),
                        company=lead_data.get('company'),
                        title=lead_data.get('title'),
                        email=lead_data.get('email'),
                        phone=lead_data.get('phone'),
                        address=lead_data.get('address'),
                        industry=lead_data.get('industry'),
                        website=lead_data.get('website'),
                        social_media=lead_data.get('social_media'),
                        additional_info=lead_data.get('additional_info')
                    )
                    leads.append(lead)
                
                return leads
                
            except json.JSONDecodeError:
                print(f"Warning: Could not parse JSON from response: {content}")
                return []
                
        except requests.exceptions.Timeout:
            raise TimeoutError(f"API request timed out after {self.api_timeout} seconds")
        except Exception as e:
            raise Exception(f"Error generating leads from text: {str(e)}")
    
    def process_image_with_api(self, image_path: str) -> List[Lead]:
        """
        Process image using API (original method)
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of Lead objects
        """
        print(f"Processing image with API: {image_path}")
        
        # Step 1: Extract text from image
        print("Extracting text from image...")
        extracted_text = self.extract_text_from_image(image_path)
        print(f"Extracted text: {extracted_text[:200]}...")
        
        # Step 2: Generate leads from text
        print("Generating leads from extracted text...")
        leads = self.generate_leads_from_text(extracted_text)
        print(f"Generated {len(leads)} leads")
        
        return leads
    
    def process_image_with_ocr(self, image_path: str) -> List[Lead]:
        """
        Process image using Tesseract OCR and regex
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of Lead objects
        """
        print(f"Processing image with OCR: {image_path}")
        
        # Step 1: Extract text using Tesseract
        print("Extracting text with Tesseract...")
        extracted_text = self.extract_text_with_tesseract(image_path)
        print(f"Extracted text: {extracted_text[:200]}...")
        
        # Step 2: Extract leads using regex
        print("Extracting leads with regex...")
        leads = self.extract_leads_with_regex(extracted_text)
        print(f"Generated {len(leads)} leads")
        
        return leads
    
    def process_image(self, image_path: str, use_ocr: bool = False) -> List[Lead]:
        """
        Complete pipeline to process an image and extract leads
        
        Args:
            image_path: Path to the image file
            use_ocr: Force use of OCR instead of API
            
        Returns:
            List of Lead objects
        """
        if use_ocr:
            return self.process_image_with_ocr(image_path)
        
        # Try API first, fallback to OCR on failure or timeout
        try:
            return self.process_image_with_api(image_path)
        except (TimeoutError, Exception) as e:
            print(f"API processing failed: {str(e)}")
            print("Falling back to OCR processing...")
            return self.process_image_with_ocr(image_path)
    
    def process_multiple_images(self, image_paths: List[str]) -> List[Lead]:
        """
        Process multiple images and combine the results
        Automatically switches to OCR if more than max_documents_for_api
        
        Args:
            image_paths: List of paths to image files
            
        Returns:
            Combined list of Lead objects from all images
        """
        all_leads = []
        
        # Determine processing method
        use_ocr = len(image_paths) > self.max_documents_for_api
        
        if use_ocr:
            print(f"Processing {len(image_paths)} documents with OCR (exceeds limit of {self.max_documents_for_api})")
        else:
            print(f"Processing {len(image_paths)} documents with API")
        
        # Process images with parallel execution for OCR
        if use_ocr:
            with ThreadPoolExecutor(max_workers=4) as executor:
                future_to_path = {executor.submit(self.process_image_with_ocr, path): path for path in image_paths}
                
                for future in as_completed(future_to_path):
                    path = future_to_path[future]
                    try:
                        leads = future.result()
                        all_leads.extend(leads)
                    except Exception as e:
                        print(f"Error processing {path}: {str(e)}")
                        continue
        else:
            # Process sequentially with API, fallback to OCR on failures
            for image_path in image_paths:
                try:
                    leads = self.process_image(image_path, use_ocr=False)
                    all_leads.extend(leads)
                except Exception as e:
                    print(f"Error processing {image_path}: {str(e)}")
                    continue
        
        return all_leads
    
    def save_leads_to_json(self, leads: List[Lead], output_path: str):
        """
        Save leads to a JSON file
        
        Args:
            leads: List of Lead objects
            output_path: Path to save the JSON file
        """
        leads_data = []
        for lead in leads:
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
                'additional_info': lead.additional_info
            }
            leads_data.append(lead_dict)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(leads_data, f, indent=2, ensure_ascii=False)
        
        print(f"Leads saved to {output_path}")
    
    def print_leads(self, leads: List[Lead]):
        """
        Print leads in a formatted way
        
        Args:
            leads: List of Lead objects
        """
        if not leads:
            print("No leads found.")
            return
        
        for i, lead in enumerate(leads, 1):
            print(f"\n--- Lead {i} ---")
            print(f"Name: {lead.name or 'N/A'}")
            print(f"Company: {lead.company or 'N/A'}")
            print(f"Title: {lead.title or 'N/A'}")
            print(f"Email: {lead.email or 'N/A'}")
            print(f"Phone: {lead.phone or 'N/A'}")
            print(f"Address: {lead.address or 'N/A'}")
            print(f"Industry: {lead.industry or 'N/A'}")
            print(f"Website: {lead.website or 'N/A'}")
            print(f"Social Media: {lead.social_media or 'N/A'}")
            print(f"Additional Info: {lead.additional_info or 'N/A'}")
    
    def test_api_connection(self):
        """
        Test the API connection with a simple text request
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "Lead Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": "Hello, can you respond with 'API connection successful'?"
                    }
                ]
            }
            
            print("Testing API connection...")
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error Response: {response.text}")
                return False
            
            result = response.json()
            
            if 'choices' in result and result['choices']:
                print("✅ API connection successful!")
                return True
            else:
                print("❌ API connection failed - unexpected response structure")
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ API connection test timed out after {self.api_timeout} seconds")
            return False
        except Exception as e:
            print(f"❌ API connection test failed: {str(e)}")
            return False

# Usage example
if __name__ == "__main__":
    # Initialize processor
    processor = DocumentImageProcessor(
        openrouter_api_key="YOUR_API_KEY",
        api_timeout=30,
        max_documents_for_api=5
    )
    
    # Test single image
    # leads = processor.process_image("image.jpg")
    
    # Test multiple images (will use OCR if more than 5)
    # image_paths = ["image1.jpg", "image2.jpg", "image3.jpg"]
    # leads = processor.process_multiple_images(image_paths)
    
    # processor.print_leads(leads)
    # processor.save_leads_to_json(leads, "extracted_leads.json")