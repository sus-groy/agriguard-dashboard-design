"""Simple test stub for GeminiDiagnosticClient using a mocked genai client.

This creates a temporary image, injects a fake `client` on the
`GeminiDiagnosticClient` instance that returns predictable text, and
asserts that `analyze_image` parses the JSON portion correctly.

Run directly:
    python app/tests/test_gemini_client.py
"""

import json
import tempfile
import os
from pathlib import Path

from PIL import Image

from app.services.gemini import GeminiDiagnosticClient


class FakeResponse:
    def __init__(self, text: str):
        self.text = text


class FakeGenAI:
    def generate_content(self, messages, generation_config=None):
        # return predictable text containing JSON in the middle
        payload = {
            "diagnosis": {"label": "Test Pest", "raw_confidence": 0.75},
            "meta": {"note": "fake response"}
        }
        return FakeResponse("BEGIN\n" + json.dumps(payload) + "\nEND")


def run_test():
    # create a tiny temporary JPEG image
    fd, path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    try:
        img = Image.new("RGB", (8, 8), color=(73, 109, 137))
        img.save(path, format="JPEG")

        client = GeminiDiagnosticClient(api_key=None)
        # inject fake genai client
        client.client = FakeGenAI()

        result, meta = client.analyze_image(path, crop_type="tomato")

        assert isinstance(result, dict), "Result should be a dict"
        assert result.get("diagnosis", {}).get("label") == "Test Pest"
        print("✓ test_gemini_client: passed")
    finally:
        try:
            Path(path).unlink()
        except Exception:
            pass


if __name__ == "__main__":
    run_test()
