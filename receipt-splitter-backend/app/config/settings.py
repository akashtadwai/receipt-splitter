import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# API Constants
MISTRAL_VISION_MODEL = "pixtral-12b-latest" 

# App Settings
ENABLE_CORS = True
CORS_ORIGINS = ["*"]  # In production, restrict this to your frontend URL
PROMPT = \
"""
    "INITIAL DETECTION - Carefully analyze if this image is ACTUALLY a receipt/bill/invoice:
    - A valid receipt MUST have ALL of these elements:
    * A clear list of purchased items with corresponding prices
    * A structured format with items aligned in rows/columns
    * A clearly marked total amount
    * Usually contains business name, date, and payment information
    * Consistent currency symbols (₹, $, €, etc.) before numerical values

    - This is NOT a receipt if ANY of these are true:
    * Contains mathematical equations, formulas, or academic notation
    * Contains LaTeX or other technical/scientific symbols (σ, ∫, ∑, ≡, etc.)
    * Has variables, functions, or mathematical expressions (e.g., max(F(T) - K, 0))
    * Primarily consists of paragraphs of text without itemized prices
    * Is a menu, poster, advertisement, or academic paper
    * Lacks a clear itemized structure and total amount

    If it is NOT a receipt/bill (doesn't satisfy ALL receipt criteria or matches ANY non-receipt criteria), respond with: {\"is_receipt\": false, \"reason\": \"explanation\"}.\n\n"

    "If it IS a receipt/bill, extract the data with EXACTLY these requirements:\n"
    "1. Items section must contain product purchases only with their FINAL prices (not MRP)\n"
    "2. The final total_bill should be the actual amount paid by the customer\n"
    "3. CRITICAL RULES FOR TAXES AND DISCOUNTS:\n"
    "   - EXCLUDE ALL line items marked as 'FREE', 'Zero', '0', or '₹0'\n"
    "   - EXCLUDE ALL 'Product discount', 'MRP discount' items - these are already factored into item prices\n"
    "   - EXCLUDE delivery charges or any other fees with zero value\n"
    "   - ONLY include fees, charges, and taxes that have a non-zero monetary value AND are charged on top of item prices\n"
    "   - For Blinkit/grocery receipts, only include 'Handling charge' if it has a non-zero value\n"
    "4. IMPORTANT - taxes array should ONLY include:\n"
    "   - Service charges, handling fees, delivery fees (ONLY if they have a positive non-zero value)\n"
    "   - Tax items like GST, VAT, service tax (ONLY if they have a positive non-zero value)\n"
    "   - Final bill discounts (NOT product/MRP discounts) (ONLY if they have a negative non-zero value)\n"
    "5. ALWAYS EXCLUDE from taxes:\n"
    "   - ANY item with value of 0 or marked as FREE\n"
    "   - MRP (Maximum Retail Price) information\n"
    "   - 'Product discount' or any discount showing the difference between MRP and selling price\n" 
    "   - Item totals / subtotals\n"
    "   - Any line that summarizes the order\n"
    "6. Format all monetary values as plain numbers without currency symbols\n"
    "7. Handle + and - correctly (e.g., discount of 45 should be -45.0)\n\n"
    "Return a structured JSON matching this Pydantic model:\n"
    "class StructuredOCR(BaseModel):\n"
    "    is_receipt: bool = True\n"
    "    reason: str \n"
    "    file_name: str\n"
    "    topics: list[str]\n"
    "    languages: list[str]\n"
    "    ocr_contents: dict = {\n"
    "        \"items\": [{\"name\": str, \"price\": float}],\n"
    "        \"total_order_bill_details\": {\n"
    "            \"total_bill\": float,\n"
    "            \"taxes\": [{\"name\": str, \"amount\": float}]\n"
    "        }\n"
    "    }\n"
    ""
"""
