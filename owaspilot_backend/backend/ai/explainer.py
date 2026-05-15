"""
ai/explainer.py
Uses an LLM to explain vulnerabilities and generate secure fixes.
Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env
"""
import os
import json
import httpx
import logging
from typing import Optional, List
from pydantic import ValidationError
from models.scan import Vulnerability, Severity, Language

# Setup logging
logger = logging.getLogger("novapilot.ai")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are Novapilot, a world-class security researcher and secure-code reviewer.
Your goal is to perform a deep analysis of the provided source code and Semgrep findings.

### MISSION:
1. Identify all security vulnerabilities, including those Semgrep might have missed.
2. For each vulnerability, provide a clear, technical explanation of the root cause and the potential impact.
3. Provide a production-ready, secure code fix that follows best practices for the specific language.
4. Assign an overall Risk Score (0-100) based on the most critical findings.

### RESPONSE FORMAT:
You MUST respond with valid JSON only. Do not include any conversational text, markdown, or backticks outside the JSON.
Follow this schema:
{
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "title": "Short descriptive title",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "line": "line number or range",
      "owasp": "OWASP category e.g. A03:2021",
      "explanation": "Detailed technical explanation",
      "fix": "Corrected code snippet"
    }
  ],
  "risk_score": 85,
  "summary": "One-line high-level summary of the security state"
}"""

# Language-specific security contexts to guide the LLM
SECURITY_CONTEXTS = {
    "python": "Focus on: SQL injection in f-strings, insecure deserialization (pickle), hardcoded secrets, and unsafe subprocess calls.",
    "javascript": "Focus on: DOM-based XSS, prototype pollution, insecure dependencies, and hardcoded JWT secrets.",
    "typescript": "Focus on: Type-safety bypasses, XSS in React/Angular components, and insecure API handling.",
    "go": "Focus on: Proper error handling in security-critical paths, goroutine leaks, and SQL injection in database/sql.",
    "java": "Focus on: Log4Shell-style injection, XML External Entity (XXE), and insecure Spring Security configurations.",
    "csharp": "Focus on: ASP.NET Core security misconfigurations, insecure deserialization, and SQL injection in Entity Framework."
}

async def explain_vulnerabilities(
    code: str,
    semgrep_findings: List[dict],
    language: str = "python",
) -> dict:
    """
    Calls the LLM and returns a parsed and validated dict.
    """
    context = SECURITY_CONTEXTS.get(language, "General security audit.")
    user_content = _build_user_message(code, semgrep_findings, language, context)

    try:
        if ANTHROPIC_API_KEY:
            raw_response = await _call_anthropic(user_content)
        elif OPENAI_API_KEY:
            raw_response = await _call_openai(user_content)
        else:
            return _fallback_response(semgrep_findings)

        # Basic JSON parsing
        data = _parse_llm_response(raw_response)
        
        # Validation (Optional: we could validate individual vulns here)
        return data

    except Exception as e:
        logger.error(f"AI Analysis failed: {str(e)}")
        return _fallback_response(semgrep_findings, error=str(e))


def _build_user_message(code: str, findings: List[dict], language: str, context: str) -> str:
    findings_block = json.dumps(findings, indent=2) if findings else "[]"
    return (
        f"Language: {language}\n"
        f"Security Context: {context}\n\n"
        f"Semgrep Findings:\n{findings_block}\n\n"
        f"Source Code:\n```{language}\n{code}\n```"
    )


async def _call_anthropic(user_content: str) -> str:
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-3-5-sonnet-20240620", # Updated to a known stable model
                "max_tokens": 4096,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_content}],
                "temperature": 0,
            },
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


async def _call_openai(user_content: str) -> str:
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_content},
                ],
                "max_tokens": 4096,
                "temperature": 0,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


def _parse_llm_response(text: str) -> dict:
    """Robust JSON extraction."""
    # Attempt to find JSON block if LLM included conversational text
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end+1]
    
    return json.loads(text)


def _fallback_response(findings: List[dict], error: str = None) -> dict:
    """Used when LLM fails or no key is configured."""
    vulns = []
    for i, f in enumerate(findings):
        vulns.append({
            "id": f"vuln-{i+1}",
            "title": f.get("rule_id", "Security Finding"),
            "severity": f.get("severity", "INFO"),
            "line": f.get("line", "?"),
            "owasp": f.get("owasp"),
            "explanation": f.get("message", "AI analysis unavailable."),
            "fix": "# Configure API key for AI-generated fixes.",
        })
    
    summary = "Semgrep analysis complete."
    if error:
        summary = f"AI analysis failed: {error[:50]}..."
    elif not ANTHROPIC_API_KEY and not OPENAI_API_KEY:
        summary = "No AI key configured. Using static analysis only."

    return {
        "vulnerabilities": vulns,
        "risk_score": len(findings) * 10 if findings else 0,
        "summary": summary
    }

async def chat_about_vulnerability(
    code: str,
    vulnerability_details: str,
    user_question: str,
    language: str = "python"
) -> str:
    """
    Handles conversational follow-ups about a specific vulnerability.
    """
    system_prompt = (
        "You are Novapilot, an expert security mentor. "
        "A user is asking a question about a security vulnerability found in their code. "
        "Be technical, clear, and educational. Help them understand the risk and the solution."
    )
    
    user_content = (
        f"Context (Original Code):\n```{language}\n{code}\n```\n\n"
        f"Vulnerability being discussed:\n{vulnerability_details}\n\n"
        f"User Question: {user_question}"
    )

    try:
        if ANTHROPIC_API_KEY:
            async with httpx.AsyncClient(timeout=45) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-sonnet-20240620",
                        "max_tokens": 1024,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_content}],
                    },
                )
                resp.raise_for_status()
                return resp.json()["content"][0]["text"]
        elif OPENAI_API_KEY:
            async with httpx.AsyncClient(timeout=45) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                    json={
                        "model": "gpt-4o",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user",   "content": user_content},
                        ],
                        "max_tokens": 1024,
                    },
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        else:
            return "AI Chat is unavailable. Please configure an API key in the backend environment."

    except Exception as e:
        logger.error(f"AI Chat failed: {str(e)}")
        return f"I'm sorry, I encountered an error while trying to process your request: {str(e)}"

