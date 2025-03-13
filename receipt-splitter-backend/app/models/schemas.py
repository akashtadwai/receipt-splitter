from pydantic import BaseModel
from typing import List, Dict, Any
from enum import Enum
import pycountry

# Define language enum
languages = {lang.alpha_2: lang.name for lang in pycountry.languages if hasattr(lang, 'alpha_2')}

class LanguageMeta(Enum.__class__):
    def __new__(metacls, cls, bases, classdict):
        for code, name in languages.items():
            classdict[name.upper().replace(' ', '_')] = name
        return super().__new__(metacls, cls, bases, classdict)

class Language(Enum, metaclass=LanguageMeta):
    pass

# API Models
class Item(BaseModel):
    name: str
    price: float

class Tax(BaseModel):
    name: str
    amount: float

class TotalOrderBillDetails(BaseModel):
    total_bill: float
    taxes: List[Tax] = []

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
    receipt_total: float

class PersonAmountPair(BaseModel):
    person: str
    amount: float

class ReceiptSplitResponse(BaseModel):
    breakdown: List[PersonAmountPair]
    extra_amount: float
    extra_per_person: float

class StructuredOCR(BaseModel):
    is_receipt: bool
    reason: str
    file_name: str
    topics: list[str]
    languages: list[Language]
    ocr_contents: dict
