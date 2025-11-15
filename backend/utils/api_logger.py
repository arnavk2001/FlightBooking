"""API Logger utility to log all API calls"""
import os
import json
from datetime import datetime
from typing import Dict, Optional
import requests


class APILogger:
    """Log API calls to a folder"""
    
    def __init__(self, log_folder: str = "api_logs"):
        """
        Initialize API logger
        
        Args:
            log_folder: Folder name to store logs (will be created if doesn't exist)
        """
        self.log_folder = log_folder
        self._ensure_log_folder()
    
    def _ensure_log_folder(self):
        """Create log folder if it doesn't exist"""
        if not os.path.exists(self.log_folder):
            os.makedirs(self.log_folder)
    
    def _get_log_filename(self) -> str:
        """Generate log filename with timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d")
        return os.path.join(self.log_folder, f"api_calls_{timestamp}.log")
    
    def log_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict] = None,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        response: Optional[requests.Response] = None,
        error: Optional[str] = None
    ):
        """
        Log an API request and response
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            headers: Request headers (will filter sensitive data)
            params: Query parameters
            data: Request body data
            json_data: Request JSON data
            response: Response object
            error: Error message if request failed
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "url": url,
            "request": {
                "headers": self._sanitize_headers(headers or {}),
                "params": params,
                "data": data,
                "json": json_data
            },
            "response": None,
            "error": error
        }
        
        if response:
            try:
                log_entry["response"] = {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "body": response.text[:5000] if response.text else None  # Limit body size
                }
            except Exception as e:
                log_entry["response"] = {"error": str(e)}
        
        # Write to log file
        log_file = self._get_log_filename()
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, indent=2) + "\n" + "="*80 + "\n")
        except Exception as e:
            print(f"Error writing to log file: {e}")
    
    def _sanitize_headers(self, headers: Dict) -> Dict:
        """Remove sensitive information from headers"""
        sanitized = headers.copy()
        sensitive_keys = ['authorization', 'api-key', 'api_secret', 'client_secret', 'token']
        
        for key in sanitized:
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                sanitized[key] = "***REDACTED***"
        
        return sanitized

