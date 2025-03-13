import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable is not set")

# API Constants
MISTRAL_OCR_MODEL = "mistral-ocr-latest"
MISTRAL_VISION_MODEL = "pixtral-12b-latest" 
MISTRAL_TEXT_MODEL = "mistral-small-latest"

# App Settings
ENABLE_CORS = True
CORS_ORIGINS = ["*"]  # In production, restrict this to your frontend URL

# Testing
MOCK_DATA_ENABLED = os.getenv("MOCK_DATA_ENABLED", "False").lower() == "true"

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
