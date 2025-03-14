import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

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
            "is_receipt": True,  # Add this missing field
            "reason": "Valid receipt",  # Add this missing field
            "file_name": "test_receipt",
            "topics": ["Receipt", "Transaction"],
            "languages": ["English"],  # Use the enum value, not uppercase
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
        response = self.client.post(
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
    async def test_process_receipt_no_file(self):
        """Test error handling when no file is uploaded"""
        # Act
        response = self.client.post("/process-receipt")

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
        response = self.client.post(
            "/process-receipt",
            files={"file": ("test_receipt.jpg", test_file_content, "image/jpeg")}
        )

        # Assert
        assert response.status_code == 500
        assert "Error processing receipt" in response.json()["detail"]

