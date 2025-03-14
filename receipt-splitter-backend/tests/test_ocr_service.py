import pytest
from unittest.mock import patch, MagicMock
import json
import base64
from fastapi import HTTPException

from app.services.ocr_service import (
    structured_ocr,
    process_with_vision_model
)

class TestOCRService:
    """Test suite for OCR service functions"""

    # Mock base64 image data
    MOCK_IMAGE_DATA = b"test image data"
    MOCK_BASE64_URL = "data:image/jpeg;base64," + base64.b64encode(MOCK_IMAGE_DATA).decode()

    @pytest.mark.asyncio
    @patch("app.services.ocr_service.client")
    async def test_process_with_vision_model_success(self, mock_client):
        """Test successful processing of an image with the vision model"""
        # Arrange
        mock_data = {
            "is_receipt": True,
            "reason": "Valid receipt",
            "file_name": "test",
            "topics": ["Receipt"],
            "languages": ["ENGLISH"],
            "ocr_contents": {
                "items": [
                    {"name": "Item1", "price": 10.0}
                ],
                "total_order_bill_details": {"total_bill": 10.0, "taxes": []}
            }
        }
        
        mock_parsed = MagicMock()
        mock_parsed.json.return_value = json.dumps(mock_data)
        mock_parsed.__getitem__.side_effect = mock_data.__getitem__
        mock_parsed.__contains__.side_effect = mock_data.__contains__
        
        mock_choice = MagicMock()
        mock_choice.message.parsed = mock_parsed
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        mock_client.chat.parse.return_value = mock_response

        # Act
        result = await process_with_vision_model(self.MOCK_BASE64_URL, "test.jpg")

        # Assert
        assert "is_receipt" in result
        assert "topics" in result
        assert "languages" in result
        assert "ocr_contents" in result
        assert "items" in result["ocr_contents"]
        assert "total_order_bill_details" in result["ocr_contents"]
        mock_client.chat.parse.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.services.ocr_service.client")
    async def test_process_with_vision_model_not_receipt(self, mock_client):
        """Test handling of non-receipt images"""
        # Arrange
        mock_data = {
            "is_receipt": False,
            "reason": "The image does not appear to be a receipt",
            "topics": ["Document"],
            "languages": ["ENGLISH"],
            "ocr_contents": {}
        }
        
        mock_parsed = MagicMock()
        mock_parsed.json.return_value = json.dumps(mock_data)
        for key, value in mock_data.items():
            setattr(mock_parsed, key, value)
        
        mock_choice = MagicMock()
        mock_choice.message.parsed = mock_parsed
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        mock_client.chat.parse.return_value = mock_response

        # Act/Assert
        with pytest.raises(HTTPException) as exc_info:
            await process_with_vision_model(self.MOCK_BASE64_URL, "test.jpg")
        
        assert exc_info.value.status_code == 400
        assert "The image does not appear to be a receipt" in exc_info.value.detail
        mock_client.chat.parse.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.services.ocr_service.process_with_vision_model")
    @patch("pathlib.Path.write_bytes")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.unlink")
    async def test_structured_ocr_file_handling(self, mock_unlink, mock_exists, mock_write, mock_process):
        """Test temporary file handling during OCR processing"""
        # Arrange
        mock_process.return_value = {
            "is_receipt": True,
            "reason": "Valid receipt",
            "file_name": "test",
            "topics": ["Receipt"],
            "languages": ["ENGLISH"],
            "ocr_contents": {
                "items": [],
                "total_order_bill_details": {"total_bill": 0.0, "taxes": []}
            }
        }
        mock_exists.return_value = True

        # Act
        await structured_ocr(self.MOCK_IMAGE_DATA, "test.jpg")

        # Assert - verify file is written and then cleaned up
        mock_write.assert_called_once()
        mock_exists.assert_called_once()
        mock_unlink.assert_called_once()
