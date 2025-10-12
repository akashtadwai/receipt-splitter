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

class Tax(BaseModel):
    name: str
    amount: float

class Item(BaseModel):
    name: str
    price: float

class TotalBillDetails(BaseModel):
    total_bill: float
    taxes: List[Tax]

class OCRContents(BaseModel):
    items: List[Item]
    total_order_bill_details: TotalBillDetails

# API Models
class StructuredOCR(BaseModel):
    is_receipt: bool
    reason: str
    file_name: str
    topics: list[str]
    languages: list[Language]
    ocr_contents: OCRContents
