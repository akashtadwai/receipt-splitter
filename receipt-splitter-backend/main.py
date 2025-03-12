from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import os
import base64
from pathlib import Path
from enum import Enum
import time
import httpx
from mistralai import Mistral, ImageURLChunk, TextChunk
from dotenv import load_dotenv
import pycountry

# Load environment variables
load_dotenv()

# Get Mistral API key from environment variables
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable is not set")

# Initialize Mistral client
client = Mistral(api_key=MISTRAL_API_KEY)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for our API
class Item(BaseModel):
    name: str
    price: float

class Tax(BaseModel):
    name: str
    amount: float

class TotalOrderBillDetails(BaseModel):
    total_bill: float
    taxes: List[Tax]

class OCRContents(BaseModel):
    items: List[Item]
    total_order_bill_details: TotalOrderBillDetails

class OCRResponse(BaseModel):
    file_name: str
    topics: List[str]
    languages: List[str]
    ocr_contents: OCRContents

class ItemSplit(BaseModel):
    item_name: str
    price: float
    contributors: Dict[str, float]  # Map of person name to amount

class ReceiptSplitRequest(BaseModel):
    items: List[ItemSplit]
    persons: List[str]

class PersonAmountPair(BaseModel):
    person: str
    amount: float

class ReceiptSplitResponse(BaseModel):
    breakdown: List[PersonAmountPair]
    extra_amount: float
    extra_per_person: float

languages = {lang.alpha_2: lang.name for lang in pycountry.languages if hasattr(lang, 'alpha_2')}

class LanguageMeta(Enum.__class__):
    def __new__(metacls, cls, bases, classdict):
        for code, name in languages.items():
            classdict[name.upper().replace(' ', '_')] = name
        return super().__new__(metacls, cls, bases, classdict)

class Language(Enum, metaclass=LanguageMeta):
    pass


class StructuredOCR(BaseModel):
    file_name: str
    topics: list[str]
    languages: list[Language]
    ocr_contents: dict

# Mock OCR output for testing when no image is provided
MOCK_OCR_OUTPUT = {
    "file_name": "instamart_order",
    "topics": ["Instamart Order", "Grocery Delivery"],
    "languages": ["English"],
    "ocr_contents": {
        "items": [
            {"name": "Coriander Leaves (Kothimbir)", "price": 17.0},
            {"name": "Nandini GoodLife Toned Milk", "price": 146.0},
            {"name": "Epigamia Greek Yogurt - Raspberry", "price": 60.0},
            {"name": "Beetroot", "price": 18.0},
            {"name": "Carrot (Gajar)", "price": 28.0},
            {"name": "Curry Leaves (Kadi Patta)", "price": 9.0}
        ],
        "total_order_bill_details": {
            "total_bill": 289.0,
            "taxes": [
                {"name": "Handling Fee", "amount": 10.5}
            ]
        }
    }
}

async def structured_ocr(image_data: bytes, filename: str) -> Dict[str, Any]:
    """Process image with Mistral OCR API and structure the results"""
    # Save image temporarily
    temp_path = Path(f"temp_{filename}")
    temp_path.write_bytes(image_data)
    
    try:
        # Encode the image to base64
        encoded_image = base64.b64encode(image_data).decode()
        base64_data_url = f"data:image/jpeg;base64,{encoded_image}"
        
        # Process the image using OCR, with retry logic
        image_ocr_markdown = None
        for attempt in range(3):  # Try up to 3 times
            try:
                image_response = client.ocr.process(
                    document=ImageURLChunk(image_url=base64_data_url),
                    model="mistral-ocr-latest"
                )
                image_ocr_markdown = image_response.pages[0].markdown
                break  # Exit the loop if successful
            except httpx.RemoteProtocolError as e:
                if hasattr(e, 'status_code') and e.status_code == 429:  # Rate limit error
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Rate limit exceeded, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e  # Raise other exceptions
                
        if not image_ocr_markdown:
            raise HTTPException(status_code=500, detail="Failed to process image with OCR")
        
        is_receipt = False
        for attempt in range(3):
            try:
                receipt_validation = client.chat.complete(
                    model="mistral-small-latest",
                    messages=[
                        {
                            "role": "user",
                            "content": f"Examine this OCR text and tell me if this is from a receipt/bill/invoice. A receipt typically has item names, prices, quantities, and a total amount. Answer only 'YES' or 'NO'.\n\n{image_ocr_markdown}"
                        }
                    ],
                    stream=False,
                    temperature=0
                )
                validation_response = receipt_validation.choices[0].message.content.strip().upper()
                is_receipt = validation_response == "YES"
                break
            except httpx.RemoteProtocolError as e:
                if attempt < 2 and hasattr(e, 'status_code') and e.status_code == 429:
                    wait_time = 2 ** attempt
                    print(f"Rate limit exceeded during validation, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e
        
        if not is_receipt:
            raise HTTPException(
                status_code=400, 
                detail="The uploaded image doesn't appear to be a valid receipt. Please upload an image containing items, prices, and a total amount."
            )
        
        # Parse the OCR result with receipt validation
        chat_response = None
        for attempt in range(3):  # Try up to 3 times
            try:
                chat_response = client.chat.parse(
                    model="pixtral-12b-latest",
                    messages=[
                            {
                                "role": "user",
                                "content": [
                                    ImageURLChunk(image_url=base64_data_url),
                                    TextChunk(text=(
                                        "This is the image's OCR in markdown:\n"
                                        f"<BEGIN_IMAGE_OCR>\n{image_ocr_markdown}\n<END_IMAGE_OCR>.\n"
                                        "Convert this into a structured JSON response and limit it to the following contents: It should always contain `items` field & `Total Order Bill Details` field."
                                        "items field should be a list of dict containing name and price"
                                        "`Total Order Bill Details` should consist of total bill and taxes. Taxes shouldn't include labels that are marked as *Free*"
                                        "If Delivery Free or Late Night Fee or Handling Fee is free it shouldn't be included in the taxes list."
                                    ))
                                ],
                            },
                        ],
                        response_format=StructuredOCR,
                        temperature=0
                    )
                break  # Exit the loop if successful
            except httpx.RemoteProtocolError as e:
                if hasattr(e, 'status_code') and e.status_code == 429:  # Rate limit error
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Rate limit exceeded, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e  # Raise other exceptions
                
        if not chat_response:
            raise HTTPException(status_code=500, detail="Failed to parse OCR results")
            
        # Extract the structured response
        structured_response = json.loads(chat_response.choices[0].message.parsed.json())
        
        # Validate if it's a receipt
        if not isinstance(structured_response, dict):
            raise HTTPException(status_code=500, detail="Invalid response format from AI model")
            
        # For valid receipts, format the response
        if "ocr_contents" not in structured_response:
            # Extract relevant fields and restructure
            ocr_contents = {
                "items": structured_response.get("items", []),
                "total_order_bill_details": structured_response.get("total_order_bill_details", {})
            }
            
            structured_response = {
                "file_name": Path(filename).stem,
                "topics": ["Receipt", "Transaction"],
                "languages": ["English"],
                "ocr_contents": ocr_contents
            }
            
        # Return the structured data
        return structured_response
    finally:
        # Clean up the temporary file
        if temp_path.exists():
            temp_path.unlink()

@app.post("/process-receipt", response_model=OCRResponse)
async def process_receipt(file: UploadFile = File(...)):
    """Process a receipt image using Mistral OCR"""
    if not file:
        return MOCK_OCR_OUTPUT
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process image with Mistral OCR
        result = await structured_ocr(file_content, file.filename)
        
        return result
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

# Update the request model to include receipt_total
class ReceiptSplitRequest(BaseModel):
    items: List[ItemSplit]
    persons: List[str]
    receipt_total: float  # Required field for the total from OCR

@app.post("/calculate-split", response_model=ReceiptSplitResponse)
async def calculate_split(data: ReceiptSplitRequest):
    # Calculate the sum of all item prices
    items_total = sum(item.price for item in data.items)
    
    # Get the receipt total directly from the request data
    # This comes from the Mistral API OCR results
    receipt_total = data.receipt_total
    
    # Calculate extra amount (tax/discount)
    extra_amount = receipt_total - items_total
    extra_per_person = extra_amount / len(data.persons) if data.persons else 0
    
    # Calculate how much each person owes
    person_totals = {person: 0.0 for person in data.persons}
    
    # Add item costs based on contributions
    for item in data.items:
        for person, amount in item.contributors.items():
            if person in person_totals:
                person_totals[person] += amount
    
    # Add extra amount per person
    for person in person_totals:
        person_totals[person] += extra_per_person
    
    # Format the response
    breakdown = [
        PersonAmountPair(person=person, amount=round(amount, 2))
        for person, amount in person_totals.items()
    ]
    
    return ReceiptSplitResponse(
        breakdown=breakdown,
        extra_amount=round(extra_amount, 2),
        extra_per_person=round(extra_per_person, 2)
    )

@app.get("/mock-receipt")
async def get_mock_receipt():
    return MOCK_OCR_OUTPUT

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)