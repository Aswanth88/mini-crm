import requests
import base64
import json
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import os
from PIL import Image
import io

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
    
    def __init__(self, openrouter_api_key: str, model_name: str = "mistralai/mistral-small-3.2-24b-instruct:free"):
        """
        Initialize the processor with OpenRouter API key
        
        Args:
            openrouter_api_key: Your OpenRouter API key
            model_name: The image-to-text model to use
        """
        self.api_key = openrouter_api_key
        self.model_name = model_name
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Validate API key
        if not self.api_key or self.api_key == "OPENROUTER_API_KEY":
            raise ValueError("Please provide a valid OpenRouter API key")
        
        print(f"Initialized with model: {self.model_name}")
        
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
        Extract text from image using OpenRouter API
        
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
            
            response = requests.post(self.base_url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            
            # Check if the response has the expected structure
            if 'choices' not in result:
                raise Exception(f"Unexpected API response structure: {result}")
            
            if not result['choices']:
                raise Exception("No choices returned from API")
            
            return result['choices'][0]['message']['content']
            
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")
    
    def generate_leads_from_text(self, text: str) -> List[Lead]:
        """
        Generate lead information from extracted text using OpenRouter API
        
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
            
            response = requests.post(self.base_url, headers=headers, json=data)
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
                
        except Exception as e:
            raise Exception(f"Error generating leads from text: {str(e)}")
    
    def process_image(self, image_path: str) -> List[Lead]:
        """
        Complete pipeline to process an image and extract leads
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of Lead objects
        """
        print(f"Processing image: {image_path}")
        
        # Step 1: Extract text from image
        print("Extracting text from image...")
        extracted_text = self.extract_text_from_image(image_path)
        print(f"Extracted text: {extracted_text[:200]}...")
        
        # Step 2: Generate leads from text
        print("Generating leads from extracted text...")
        leads = self.generate_leads_from_text(extracted_text)
        print(f"Generated {len(leads)} leads")
        
        return leads
    
    def process_multiple_images(self, image_paths: List[str]) -> List[Lead]:
        """
        Process multiple images and combine the results
        
        Args:
            image_paths: List of paths to image files
            
        Returns:
            Combined list of Lead objects from all images
        """
        all_leads = []
        
        for image_path in image_paths:
            try:
                leads = self.process_image(image_path)
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
            response = requests.post(self.base_url, headers=headers, json=data)
            
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
                
        except Exception as e:
            print(f"❌ API connection test failed: {str(e)}")
            return False