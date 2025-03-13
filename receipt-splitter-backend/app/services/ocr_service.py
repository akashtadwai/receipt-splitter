import base64
import json
import time
import httpx
from pathlib import Path
from typing import Dict, Any

from fastapi import HTTPException
from mistralai import Mistral, ImageURLChunk, TextChunk
from app.models.schemas import StructuredOCR

from app.config.settings import MISTRAL_API_KEY, MISTRAL_VISION_MODEL, PROMPT

# Initialize Mistral client
client = Mistral(api_key=MISTRAL_API_KEY)

async def structured_ocr(image_data: bytes, filename: str) -> Dict[str, Any]:
    """Process image with Mistral OCR API and structure the results in a single API call"""
    # Save image temporarily
    temp_path = Path(f"temp_{filename}")
    temp_path.write_bytes(image_data)
    
    try:
        # Encode the image to base64
        encoded_image = base64.b64encode(image_data).decode()
        base64_data_url = f"data:image/jpeg;base64,{encoded_image}"
        
        # Process the image with a single call to vision model
        structured_data = await process_with_vision_model(base64_data_url, filename)
        return structured_data
    finally:
        # Clean up the temporary file
        if temp_path.exists():
            temp_path.unlink()

async def process_with_vision_model(base64_data_url: str, filename: str) -> Dict[str, Any]:
    """Process image with vision model and extract structured data in one call"""
    for attempt in range(5):  # Try up to 5 times
        try:
            chat_response = client.chat.parse(
                model=MISTRAL_VISION_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        ImageURLChunk(image_url=base64_data_url),
                        TextChunk(text=PROMPT),
                    ],
                }],
                response_format=StructuredOCR,
                temperature=0
            )
            
            # Parse the response
            raw_response = json.loads(chat_response.choices[0].message.parsed.json())
            # Check if the image is a receipt
            if not raw_response.get("is_receipt", True):
                reason = raw_response.get("reason", "The image doesn't appear to be a valid receipt")
                raise HTTPException(status_code=400, detail=reason)
            
            # Format the response for our schema
            formatted_response = {
                "file_name": Path(filename).stem,
                "topics": raw_response.get("topics", []),
                "languages": raw_response.get("languages", []),
                "ocr_contents": {
                    "items": raw_response.get("ocr_contents", {}).get("items", []),
                    "total_order_bill_details": raw_response.get('ocr_contents',{}).get("total_order_bill_details", {
                        "total_bill": 0.0,
                        "taxes": []
                    })
                }
            }
            
            return formatted_response
            
        except httpx.RemoteProtocolError as e:
            if attempt < 4 and hasattr(e, 'status_code') and e.status_code == 429:
                wait_time = (2 ** attempt) * 3
                print(f"Rate limit exceeded, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise HTTPException(status_code=500, detail=f"API error occurred: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Failed to process image after multiple attempts")
