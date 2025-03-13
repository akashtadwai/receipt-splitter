import base64
import json
import time
import httpx
from pathlib import Path
from typing import Dict, Any

from fastapi import HTTPException
from mistralai import Mistral, ImageURLChunk, TextChunk
from app.config.settings import MISTRAL_API_KEY, MISTRAL_OCR_MODEL, MISTRAL_VISION_MODEL, MISTRAL_TEXT_MODEL
from app.models.schemas import StructuredOCR

# Initialize Mistral client
client = Mistral(api_key=MISTRAL_API_KEY)

async def structured_ocr(image_data: bytes, filename: str) -> Dict[str, Any]:
    """Process image with Mistral OCR API and structure the results"""
    # Save image temporarily
    temp_path = Path(f"temp_{filename}")
    temp_path.write_bytes(image_data)
    
    try:
        # Encode the image to base64
        encoded_image = base64.b64encode(image_data).decode()
        base64_data_url = f"data:image/jpeg;base64,{encoded_image}"
        
        # Process the image using OCR
        image_ocr_markdown = await process_image_ocr(base64_data_url)
        
        # Validate if image is a receipt
        is_receipt = await validate_receipt(image_ocr_markdown)
        
        if not is_receipt:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image doesn't appear to be a valid receipt. Please upload an image containing items, prices, and a total amount."
            )
            
        # Extract structured data from OCR results
        structured_data = await parse_ocr_to_structured_data(base64_data_url, image_ocr_markdown)
        
        # Format the response
        formatted_response = format_structured_response(structured_data, filename)
        
        return process_formatted_response(formatted_response)
    finally:
        # Clean up the temporary file
        if temp_path.exists():
            temp_path.unlink()

async def process_image_ocr(base64_data_url: str) -> str:
    """Process image with OCR and return markdown text"""
    for attempt in range(5):  # Try up to 5 times
        try:
            image_response = client.ocr.process(
                document=ImageURLChunk(image_url=base64_data_url),
                model=MISTRAL_OCR_MODEL
            )
            return image_response.pages[0].markdown
        except httpx.RemoteProtocolError as e:
            if attempt < 4 and hasattr(e, 'status_code') and e.status_code == 429:
                wait_time = (2 ** attempt) * 3  # Exponential backoff
                print(f"Rate limit exceeded, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Failed to process image with OCR after multiple attempts")

async def validate_receipt(ocr_text: str) -> bool:
    """Validate if the OCR text is from a receipt"""
    for attempt in range(5):
        try:
            validation = client.chat.complete(
                model=MISTRAL_TEXT_MODEL,
                messages=[{
                    "role": "user",
                    "content": f"Examine this OCR text and tell me if this is from a receipt/bill/invoice. A receipt typically has item names, prices, quantities, and a total amount. Answer only 'YES' or 'NO'.\n\n{ocr_text}"
                }],
                stream=False,
                temperature=0
            )
            response = validation.choices[0].message.content.strip().upper()
            return response == "YES"
        except httpx.RemoteProtocolError as e:
            if attempt < 5 and hasattr(e, 'status_code') and e.status_code == 429:
                wait_time = (2 ** attempt) * 3  # Exponential backoff
                print(f"Rate limit exceeded during validation, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise HTTPException(status_code=500, detail=f"Receipt validation error: {str(e)}")
    
    return False

def process_formatted_response(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process the raw OCR response and convert string prices to floats"""
    # Initialize processed data with required fields
    processed_data = {
        "file_name": response_data.get("file_name", ""),
        "topics": response_data.get("topics", ["Receipt", "Transaction"]),
        "languages": response_data.get("languages", ["English"]),
        "ocr_contents": {
            "items": [],  # Initialize with empty array
            "total_order_bill_details": {
                "total_bill": 0.0,  # Initialize with default values
                "taxes": []
            }
        }
    }
    
    # Process existing ocr_contents if available
    ocr_contents = response_data.get("ocr_contents", {})
    
    # Process items
    items_source = ocr_contents.get("items", response_data.get("items", []))
    if items_source:
        processed_items = []
        for item in items_source:
            processed_item = {"name": item.get("name", "Unknown Item")}
            price_str = str(item.get("price", "0")).replace("₹", "").replace(",", "").strip()
            try:
                processed_item["price"] = float(price_str)
            except ValueError:
                processed_item["price"] = 0.0
            processed_items.append(processed_item)
        processed_data["ocr_contents"]["items"] = processed_items
    
    # Find total_order_bill_details (handle case sensitivity and location variations)
    bill_details = None
    if "total_order_bill_details" in ocr_contents:
        bill_details = ocr_contents["total_order_bill_details"]
    elif "Total Order Bill Details" in response_data:
        bill_details = response_data["Total Order Bill Details"]
    elif "total_order_bill_details" in response_data:
        bill_details = response_data["total_order_bill_details"]
    
    if bill_details:
        processed_total = {"taxes": []}
        
        # Process total bill
        bill_value = bill_details.get("total_bill", 0)
        bill_str = str(bill_value).replace("₹", "").replace(",", "").strip()
        try:
            processed_total["total_bill"] = float(bill_str)
        except ValueError:
            processed_total["total_bill"] = 0.0
            
        # Process taxes
        taxes = bill_details.get("taxes", [])
        for tax in taxes:
            name = tax.get("name", "Unknown Tax")
            amount_str = str(tax.get("amount", "0")).replace("₹", "").strip()
            
            # Handle "+" and "-" prefixes
            if amount_str.startswith("+ "):
                amount_str = amount_str[2:]
            elif amount_str.startswith("- "):
                amount_str = "-" + amount_str[2:]
            
            try:
                amount = float(amount_str)
                processed_total["taxes"].append({"name": name, "amount": amount})
            except ValueError:
                pass
        
        processed_data["ocr_contents"]["total_order_bill_details"] = processed_total
    
    return processed_data



async def parse_ocr_to_structured_data(base64_data_url: str, ocr_text: str) -> Dict[str, Any]:
    """Parse OCR text to structured JSON data"""
    for attempt in range(5):
        try:
            chat_response = client.chat.parse(
                model=MISTRAL_VISION_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        ImageURLChunk(image_url=base64_data_url),
                        TextChunk(text=(
                            "This is the image's OCR in markdown:\n"
                            f"<BEGIN_IMAGE_OCR>\n{ocr_text}\n<END_IMAGE_OCR>.\n"
                            "Convert this into a structured JSON response and limit it to the following contents: It should always contain `items` field & `total_order_bill_details` field."
                            "items field should be a list of dict containing name and price"
                            "`Total Order Bill Details` should consist of total bill and taxes. Taxes shouldn't include labels that are marked as *Free*"
                            "If Delivery Free or Late Night Fee or Handling Fee is free it shouldn't be included in the taxes list."
                        ))
                    ],
                }],
                response_format=StructuredOCR,
                temperature=0
            )
            raw_response = json.loads(chat_response.choices[0].message.parsed.json())
            return raw_response
        except httpx.RemoteProtocolError as e:
            if attempt < 4 and hasattr(e, 'status_code') and e.status_code == 429:
                wait_time = (2 ** attempt) * 3
                print(f"Rate limit exceeded, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise HTTPException(status_code=500, detail=f"OCR parsing error: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Failed to parse OCR results after multiple attempts")

def format_structured_response(response_data: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Format the structured response data"""
    if not isinstance(response_data, dict):
        raise HTTPException(status_code=500, detail="Invalid response format from AI model")
        
    # Check if response already has the expected structure
    if "ocr_contents" in response_data:
        return response_data
        
    # Extract and restructure data
    ocr_contents = {
        "items": response_data.get("items", []),
        "total_order_bill_details": response_data.get("total_order_bill_details", {})
    }
    
    return {
        "file_name": Path(filename).stem,
        "topics": ["Receipt", "Transaction"],
        "languages": ["English"],
        "ocr_contents": ocr_contents
    }
