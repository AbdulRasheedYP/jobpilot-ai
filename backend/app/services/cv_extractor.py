import io
import json
import logging
from typing import Dict, Any
from pypdf import PdfReader
from backend.app.services.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)

ZERO_HALLUCINATION_CV_PROMPT = """You are a strict, factual CV information extraction system for JobPilot AI.
Extract structured candidate facts strictly and exclusively from the provided CV text.

RULES:
1. Zero Hallucination: NEVER extrapolate, assume, or invent skills, degrees, dates, or experiences.
2. If a fact is not explicitly present in the text, DO NOT include it.
3. Return ONLY a valid JSON object matching the requested schema.

Output Schema:
{
  "status": "pending_review",
  "extracted_skills": ["Skill1", "Skill2"],
  "extracted_education": [
    {
      "institution": "University / College name",
      "degree": "Degree name",
      "graduation_year": 2024
    }
  ],
  "extracted_experience": [
    {
      "company": "Company name",
      "title": "Role title",
      "start_date": "YYYY-MM or string",
      "end_date": "YYYY-MM or Present",
      "description": "Responsibilities and accomplishments"
    }
  ]
}
"""


def extract_text_from_file(file_bytes: bytes, file_type: str) -> str:
    """Extract raw text from PDF, TXT, or MD file bytes."""
    if file_type.lower() == "pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_pages.append(text)
            return "\n".join(text_pages).strip()
        except Exception as e:
            logger.warning(f"Failed to extract PDF text with pypdf: {e}")
            return ""
    else:
        # Fallback to UTF-8 text decoding for txt/md
        try:
            return file_bytes.decode("utf-8", errors="ignore").strip()
        except Exception as e:
            logger.warning(f"Failed to decode text file: {e}")
            return ""


async def extract_facts_with_llm(cv_text: str) -> Dict[str, Any]:
    """Pass CV text to LLM provider for zero-hallucination structured fact extraction."""
    if not cv_text:
        return {
            "status": "pending_review",
            "extracted_skills": [],
            "extracted_education": [],
            "extracted_experience": [],
        }

    user_prompt = f"Extract structured facts from this candidate CV text:\n\n{cv_text[:6000]}"
    llm = get_llm_provider()

    try:
        facts = await llm.generate_json(
            prompt=user_prompt,
            system_prompt=ZERO_HALLUCINATION_CV_PROMPT,
        )
        if isinstance(facts, dict):
            facts.setdefault("status", "pending_review")
            facts.setdefault("extracted_skills", [])
            facts.setdefault("extracted_education", [])
            facts.setdefault("extracted_experience", [])
            return facts
    except Exception as e:
        logger.error(f"LLM CV extraction failed: {e}")

    # Fallback default structure
    return {
        "status": "pending_review",
        "extracted_skills": [],
        "extracted_education": [],
        "extracted_experience": [],
    }
