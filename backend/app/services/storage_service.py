import os
import uuid
import logging
from typing import Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Unified Storage Adapter for candidate resumes & application artifacts.
    Supports Cloudinary raw file storage and local filesystem fallback.
    Credentials are strictly loaded from environment variables / .env.
    """

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
        self._cloudinary_configured = False
        self._init_cloudinary_if_configured()

    def _init_cloudinary_if_configured(self) -> None:
        """Dynamically configures Cloudinary using credentials from environment variables."""
        cloud_name = (settings.CLOUDINARY_CLOUD_NAME or "").strip()
        api_key = (settings.CLOUDINARY_API_KEY or "").strip()
        api_secret = (settings.CLOUDINARY_API_SECRET or "").strip()

        if cloud_name and api_key and api_secret:
            try:
                import cloudinary
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                    secure=True,
                )
                self._cloudinary_configured = True
                logger.info(f"Cloudinary storage initialized for cloud: {cloud_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Cloudinary SDK: {e}. Falling back to local storage.")
                self._cloudinary_configured = False
        else:
            self._cloudinary_configured = False

    def save_file(
        self,
        content: bytes,
        original_filename: str,
        content_type: str = "application/pdf",
    ) -> Dict[str, Any]:
        """
        Saves file bytes:
        1. Always writes a local copy in UPLOAD_DIR for fast text extraction and offline fallback.
        2. If Cloudinary credentials exist, uploads to Cloudinary raw storage and returns HTTPS cloud_url.
        """
        clean_name = os.path.basename(original_filename)
        unique_prefix = uuid.uuid4().hex
        stored_filename = f"{unique_prefix}_{clean_name}"
        local_path = os.path.join(self.upload_dir, stored_filename)

        # Write local copy
        with open(local_path, "wb") as f:
            f.write(content)

        cloud_url: Optional[str] = None
        storage_type = "local"

        if self._cloudinary_configured or (settings.STORAGE_BACKEND == "cloudinary"):
            try:
                import cloudinary.uploader
                folder = getattr(settings, "CLOUDINARY_FOLDER", "jobpilot/resumes")
                public_id = f"{folder}/{unique_prefix}_{os.path.splitext(clean_name)[0]}"

                upload_res = cloudinary.uploader.upload(
                    content,
                    resource_type="raw",
                    public_id=public_id,
                    use_filename=True,
                    unique_filename=True,
                    overwrite=True,
                )
                cloud_url = upload_res.get("secure_url")
                if cloud_url:
                    storage_type = "cloudinary"
                    logger.info(f"File uploaded to Cloudinary: {cloud_url}")
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}. Utilizing local storage copy at {local_path}.")

        return {
            "local_path": local_path,
            "cloud_url": cloud_url,
            "filename": stored_filename,
            "storage_type": storage_type,
            "size_bytes": len(content),
        }


# Global singleton instance
storage_service = StorageService()
