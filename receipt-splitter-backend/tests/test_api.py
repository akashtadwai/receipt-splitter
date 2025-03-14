import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

class TestAPI:
    """Test suite for API endpoints"""
    
    client = TestClient(app)
    
    @pytest.mark.asyncio
    @patch("app.main.structured_ocr")
    async def test_process_receipt_success(self, mock_structured_ocr):
        """Test successful processing of a receipt image"""
        # Arrange
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
        
        # Act
        with TestClient(app) as client:
            response = client.post(
                "/process-receipt",
                files={"file": ("test_receipt.jpg", test_file_content, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["file_name"] == "test_receipt"
        assert len(data["ocr_contents"]["items"]) == 2
        assert data["ocr_contents"]["total_order_bill_details"]["total_bill"] == 30.0
    
    @pytest.mark.asyncio
    @patch("app.main.structured_ocr")
    async def test_process_receipt_no_file(self, mock_structured_ocr):
        """Test error handling when no file is uploaded"""
        # Act
        with TestClient(app) as client:
            response = client.post("/process-receipt")
        
        # Assert
        assert response.status_code == 422  # Validation error for missing required field
    
    @pytest.mark.asyncio
    @patch("app.main.structured_ocr")
    async def test_process_receipt_service_error(self, mock_structured_ocr):
        """Test error handling when OCR service fails"""
        # Arrange
        mock_structured_ocr.side_effect = Exception("Service error")
        test_file_content = b"dummy image data"
        
        # Act
        with TestClient(app) as client:
            response = client.post(
                "/process-receipt",
                files={"file": ("test_receipt.jpg", test_file_content, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 500
        assert "Error processing receipt" in response.json()["detail"]
    
    def test_calculate_split_endpoint(self):
        """Test receipt split calculation with basic scenario"""
        # Arrange
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
        
        # Act
        response = self.client.post("/calculate-split", json=request_data)
        
        # Assert
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
    
    def test_calculate_split_with_discount(self):
        """Test receipt split calculation with a discount"""
        # Arrange
        request_data = {
            "items": [
                {
                    "item_name": "Discounted Item",
                    "price": 100.0,
                    "contributors": {"Alice": 50.0, "Bob": 50.0}
                }
            ],
            "persons": ["Alice", "Bob"],
            "receipt_total": 90.0  # 10.0 discount
        }
        
        # Act
        response = self.client.post("/calculate-split", json=request_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["extra_amount"] == -10.0
        assert data["extra_per_person"] == -5.0
        
        # Each person should pay 45.0 (50 - 5)
        for item in data["breakdown"]:
            assert item["amount"] == 45.0