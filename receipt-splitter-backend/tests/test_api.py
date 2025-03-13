import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.models.schemas import OCRResponse

client = TestClient(app)

def test_mock_receipt_endpoint():
    response = client.get("/mock-receipt")
    assert response.status_code == 200
    data = response.json()
    assert "file_name" in data
    assert "ocr_contents" in data
    assert "items" in data["ocr_contents"]
    assert "total_order_bill_details" in data["ocr_contents"]

@pytest.mark.asyncio
@patch("app.main.structured_ocr")
async def test_process_receipt_success(mock_structured_ocr):
    # Mock the OCR service response
    mock_result = {
        "file_name": "test_receipt",
        "topics": ["Receipt", "Transaction"],
        "languages": ["English"],
        "ocr_contents": {
            "items": [
                {"name": "Test Item 1", "price": 10.0},
                {"name": "Test Item 2", "price": 20.0}
            ],
            "total_order_bill_details": {
                "total_bill": 30.0,
                "taxes": []
            }
        }
    }
    mock_structured_ocr.return_value = mock_result
    
    # Create a test file
    test_file_content = b"dummy image data"
    
    # Make the request
    with TestClient(app) as client:
        response = client.post(
            "/process-receipt",
            files={"file": ("test_receipt.jpg", test_file_content, "image/jpeg")}
        )
    
    # Verify the response
    assert response.status_code == 200
    data = response.json()
    assert data["file_name"] == "test_receipt"
    assert len(data["ocr_contents"]["items"]) == 2

def test_calculate_split_endpoint():
    # Create test request data
    request_data = {
        "items": [
            {
                "item_name": "Test Item 1",
                "price": 100.0,
                "contributors": {"Alice": 50.0, "Bob": 50.0}
            },
            {
                "item_name": "Test Item 2",
                "price": 30.0,
                "contributors": {"Alice": 30.0}
            }
        ],
        "persons": ["Alice", "Bob"],
        "receipt_total": 140.0
    }
    
    # Make the request
    response = client.post("/calculate-split", json=request_data)
    
    # Verify the response
    assert response.status_code == 200
    data = response.json()
    assert "breakdown" in data
    assert "extra_amount" in data
    assert "extra_per_person" in data
    assert data["extra_amount"] == 10.0
    assert data["extra_per_person"] == 5.0
    
    # Extract amounts by person
    amounts = {item["person"]: item["amount"] for item in data["breakdown"]}
    assert amounts["Alice"] == 85.0
    assert amounts["Bob"] == 55.0
