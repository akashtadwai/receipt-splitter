from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import OCRResponse, ReceiptSplitRequest, ReceiptSplitResponse
from app.services.ocr_service import structured_ocr
from app.services.calculator import calculate_split
from app.config.settings import ENABLE_CORS, CORS_ORIGINS

app = FastAPI(title="Receipt Splitter API")

# Configure CORS if enabled
if ENABLE_CORS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.post("/process-receipt", response_model=OCRResponse)
async def process_receipt(file: UploadFile = File(...)):
    """Process a receipt image using Mistral OCR"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Process image with OCR service
        result = await structured_ocr(file_content, file.filename)
        
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

@app.post("/calculate-split", response_model=ReceiptSplitResponse)
async def calculate_receipt_split(data: ReceiptSplitRequest):
    """Calculate how to split a receipt among multiple people"""
    try:
        # Use the calculator service
        result = calculate_split(
            items=data.items,
            persons=data.persons,
            receipt_total=data.receipt_total
        )
        return result
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="No persons provided for split")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating split: {str(e)}")

# Health check endpoint that will be pinged
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Application is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
