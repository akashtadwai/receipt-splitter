import pytest
from unittest.mock import patch, MagicMock
import json
import base64
from pathlib import Path

from fastapi import HTTPException
from app.services.ocr_service import (
    process_image_ocr,
    validate_receipt,
    parse_ocr_to_structured_data,
    format_structured_response
)

# Mock base64 image data
MOCK_IMAGE_DATA = b"test image data"
MOCK_BASE64_URL = "data:image/jpeg;base64," + base64.b64encode(MOCK_IMAGE_DATA).decode()

@pytest.mark.asyncio
@patch("app.services.ocr_service.client")
async def test_process_image_ocr(mock_client):
    # Mock the Mistral client response
    mock_response = MagicMock()
    mock_response.pages = [MagicMock(markdown="Test OCR Markdown")]
    mock_client.ocr.process.return_value = mock_response
    
    # Call the function
    result = await process_image_ocr(MOCK_BASE64_URL)
    
    # Verify the result
    assert result == "Test OCR Markdown"
    mock_client.ocr.process.assert_called_once()

@pytest.mark.asyncio
@patch("app.services.ocr_service.client")
async def test_validate_receipt_true(mock_client):
    # Mock a positive response from the Mistral client
    mock_response = MagicMock()
    mock_message = MagicMock()
    mock_message.content = "YES"
    mock_response.choices = [MagicMock(message=mock_message)]
    mock_client.chat.complete.return_value = mock_response
    
    # Call the function with receipt-like OCR text
    result = await validate_receipt("Item1 $10.00\nItem2 $20.00\nTotal $30.00")
    
    # Verify the result
    assert result is True
    mock_client.chat.complete.assert_called_once()

@pytest.mark.asyncio
@patch("app.services.ocr_service.client")
async def test_validate_receipt_false(mock_client):
    # Mock a negative response from the Mistral client
    mock_response = MagicMock()
    mock_message = MagicMock()
    mock_message.content = "NO"
    mock_response.choices = [MagicMock(message=mock_message)]
    mock_client.chat.complete.return_value = mock_response
    
    # Call the function with non-receipt OCR text
    result = await validate_receipt("This is just some random text")
    
    # Verify the result
    assert result is False
    mock_client.chat.complete.assert_called_once()

def test_format_structured_response():
    # Test with already formatted response
    formatted_response = {
        "file_name": "already_formatted",
        "topics": ["Receipt"],
        "languages": ["English"],
        "ocr_contents": {
            "items": [{"name": "Item1", "price": 10.0}],
            "total_order_bill_details": {"total_bill": 10.0}
        }
    }
    result = format_structured_response(formatted_response, "test.jpg")
    assert result == formatted_response
    
    # Test with unformatted response
    unformatted_response = {
        "items": [{"name": "Item1", "price": 10.0}],
        "total_order_bill_details": {"total_bill": 10.0}
    }
    result = format_structured_response(unformatted_response, "test.jpg")
    assert result["file_name"] == "test"
    assert "ocr_contents" in result
    assert result["ocr_contents"]["items"] == unformatted_response["items"]
