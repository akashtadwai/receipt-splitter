import pytest
from unittest.mock import patch, MagicMock
import json
import base64
from pathlib import Path
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
        mock_response = MagicMock()
        mock_parsed_message = MagicMock()
        mock_parsed_message.json.return_value = json.dumps({
            "is_receipt": True,
            "topics": ["Receipt"],
            "languages": ["English"],
            "ocr_contents": {
                "items": [
                    {"name": "Item1", "price": 10.0}
                ],
                "total_order_bill_details": {"total_bill": 10.0, "taxes": []}
            }
        })
        mock_client.chat.parse.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(parsed=mock_parsed_message))]
        )
        
        # Act
        result = await process_with_vision_model(self.MOCK_BASE64_URL, "test.jpg")
        
        # Assert
        assert "file_name" in result
        assert "topics" in result
        assert "languages" in result
        assert "ocr_contents" in result
        assert "items" in result["ocr_contents"]
        assert "total_order_bill_details" in result["ocr_contents"]
        assert result["file_name"] == "test"
        mock_client.chat.parse.assert_called_once()
    
    @pytest.mark.asyncio
    @patch("app.services.ocr_service.client")
    async def test_process_with_vision_model_not_receipt(self, mock_client):
        """Test handling of non-receipt images"""
        # Arrange
        mock_response = MagicMock()
        mock_parsed_message = MagicMock()
        mock_parsed_message.json.return_value = json.dumps({
            "is_receipt": False,
            "reason": "The image does not appear to be a receipt",
            "topics": ["Document"],
            "languages": ["English"],
            "ocr_contents": {}
        })
        mock_client.chat.parse.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(parsed=mock_parsed_message))]
        )
        
        # Act/Assert
        with pytest.raises(HTTPException) as exc_info:
            await process_with_vision_model(self.MOCK_BASE64_URL, "test.jpg")
        
        assert exc_info.value.status_code == 400
        assert "The image does not appear to be a receipt" in str(exc_info.value.detail)
        mock_client.chat.parse.assert_called_once()
    
    @pytest.mark.asyncio
    @patch("app.services.ocr_service.client")
    @patch("app.services.ocr_service.time.sleep")
    async def test_process_with_vision_model_retry_logic(self, mock_sleep, mock_client):
        """Test retry logic when API rate limits are hit"""
        # Arrange
        import httpx
        error_response = httpx.RemoteProtocolError("Rate limit exceeded", request=MagicMock())
        error_response.status_code = 429
        
        success_response = MagicMock()
        mock_parsed_message = MagicMock()
        mock_parsed_message.json.return_value = json.dumps({
            "is_receipt": True,
            "topics": ["Receipt"],
            "languages": ["English"],
            "ocr_contents": {
                "items": [],
                "total_order_bill_details": {"total_bill": 0.0, "taxes": []}
            }
        })
        
        # Setup mock to fail twice then succeed
        mock_client.chat.parse.side_effect = [
            error_response,
            error_response,
            MagicMock(choices=[MagicMock(message=MagicMock(parsed=mock_parsed_message))])
        ]
        
        # Act
        result = await process_with_vision_model(self.MOCK_BASE64_URL, "test.jpg")
        
        # Assert
        assert mock_client.chat.parse.call_count == 3
        assert mock_sleep.call_count == 2
        assert result["file_name"] == "test"
    
    @pytest.mark.asyncio
    @patch("app.services.ocr_service.process_with_vision_model")
    @patch("pathlib.Path.write_bytes")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.unlink")
    async def test_structured_ocr_file_handling(self, mock_unlink, mock_exists, mock_write, mock_process):
        """Test temporary file handling during OCR processing"""
        # Arrange
        mock_process.return_value = {
            "file_name": "test",
            "topics": ["Receipt"],
            "languages": ["English"],
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
