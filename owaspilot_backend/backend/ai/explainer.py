"""
ai/explainer.py
Uses an LLM to explain vulnerabilities and generate secure fixes.
Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env
"""
import os
import json
import httpx
from typing import Optional

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are OWASPilot, an expert secure-code reviewer.
Given Python source code and optional Semgrep findings, you:
1. Identify ALL security vulnerabilities (SQLi, XSS, RCE, SSRF, hardcoded secrets, insecure deserialization, path traversal, weak crypto, etc.)
2. Explain each risk clearly and concisely for a developer audience
3. Provide a corrected Python code snippet for each finding
4. Score overall risk 0–100

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "title": "SQL Injection via f-string",
      "severity": "CRITICAL",
      "line": "7",
      "owasp": "A03:2021",
      "explanation": "...",
      "fix": "..."
    }
  ],
  "risk_score": 85,
  "summary": "One-line summary"
}"""


async def explain_vulnerabilities(
    code: str,
    semgrep_findings: list[dict],
    language: str = "python",
) -> dict:
    """
    Calls the LLM and returns a parsed dict with vulnerabilities list.
    Falls back gracefully if no API key is set.
    """
    user_content = _build_user_message(code, semgrep_findings, language)

    if ANTHROPIC_API_KEY:
        return await _call_anthropic(user_content)
    elif OPENAI_API_KEY:
        return await _call_openai(user_content)
    else:
        return _fallback_response(semgrep_findings)


def _build_user_message(code: str, findings: list[dict], language: str) -> str:
    findings_block = json.dumps(findings, indent=2) if findings else "[]"
    return (
        f"Language: {language}\n\n"
        f"Semgrep findings:\n{findings_block}\n\n"
        f"Source code:\n```{language}\n{code}\n```"
    )


async def _call_anthropic(user_content: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 2048,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_content}],
            },
        )
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"]
        return _parse_llm_response(text)


async def _call_openai(user_content: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_content},
                ],
                "max_tokens": 2048,
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"]
        return _parse_llm_response(text)


def _parse_llm_response(text: str) -> dict:
    clean = text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(clean)


def _fallback_response(findings: list[dict]) -> dict:
    """Used when no LLM key is configured."""
    vulns = [
        {
            "id": f"vuln-{i+1}",
            "title": f.get("rule_id", "Unknown finding"),
            "severity": f.get("severity", "INFO"),
            "line": f.get("line", "?"),
            "owasp": f.get("owasp"),
            "explanation": f.get("message", "Set ANTHROPIC_API_KEY for AI explanations."),
            "fix": "# Set ANTHROPIC_API_KEY or OPENAI_API_KEY to get AI-generated fixes.",
        }
        for i, f in enumerate(findings)
    ]
    return {
        "vulnerabilities": vulns,
        "risk_score": len(findings) * 10,
        "summary": f"{len(findings)} finding(s) from Semgrep (no AI key configured).",
    }
