"""
Image processing utilities for preprocessing uploaded images.
"""
import base64
import io
from PIL import Image, ImageOps
from typing import Tuple, Optional


class ImageProcessor:
    """Utility class for image preprocessing."""
    
    @staticmethod
    def resize_image(
        image_data: bytes,
        max_width: int = 1920,
        max_height: int = 1080,
        quality: int = 85,
        format: str = "JPEG",
    ) -> bytes:
        """
        Resize and compress an image.
        
        Args:
            image_data: Raw image bytes
            max_width: Maximum width
            max_height: Maximum height
            quality: Output quality (1-100)
            format: Output format
            
        Returns:
            Processed image bytes
        """
        image = Image.open(io.BytesIO(image_data))
        
        # Handle EXIF orientation
        image = ImageOps.exif_transpose(image)
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Calculate new size
        width, height = image.size
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save to buffer
        buffer = io.BytesIO()
        image.save(buffer, format=format, quality=quality, optimize=True)
        return buffer.getvalue()
    
    @staticmethod
    def base64_to_bytes(base64_string: str) -> bytes:
        """Convert base64 string to bytes, handling data URI prefix."""
        # Remove data URI prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[-1]
        return base64.b64decode(base64_string)
    
    @staticmethod
    def bytes_to_base64(data: bytes) -> str:
        """Convert bytes to base64 string."""
        return base64.b64encode(data).decode('utf-8')
    
    @staticmethod
    def get_image_info(base64_string: str) -> Tuple[int, int, str]:
        """
        Get image dimensions and format.
        
        Returns:
            Tuple of (width, height, format)
        """
        data = ImageProcessor.base64_to_bytes(base64_string)
        image = Image.open(io.BytesIO(data))
        return image.width, image.height, image.format or "UNKNOWN"
    
    @staticmethod
    def process_base64_image(
        base64_string: str,
        max_width: int = 1920,
        max_height: int = 1080,
        quality: int = 85,
    ) -> str:
        """
        Process a base64-encoded image and return base64.
        
        Args:
            base64_string: Base64-encoded image
            max_width: Maximum width
            max_height: Maximum height
            quality: JPEG quality
            
        Returns:
            Processed base64-encoded image
        """
        image_data = ImageProcessor.base64_to_bytes(base64_string)
        processed = ImageProcessor.resize_image(
            image_data, max_width, max_height, quality
        )
        return ImageProcessor.bytes_to_base64(processed)
