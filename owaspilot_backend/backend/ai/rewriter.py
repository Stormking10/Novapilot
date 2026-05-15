"""
ai/rewriter.py
Takes vulnerable Python code + vulnerability list and returns a fully
rewritten, secure version with a diff-style explanation.
"""
import os, json, httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM = """You are an expert Python security engineer.
Given vulnerable Python code and a list of vulnerabilities, rewrite the ENTIRE code
to be secure. Apply all fixes simultaneously — don't just patch one thing.

Rules:
- Preserve all original functionality
- Add type annotations where helpful
- Add a short docstring noting what was fixed
- Do NOT change the function signatures unless required for security

Respond ONLY with valid JSON (no backticks):
{
  "rewritten_code": "full secure Python code here",
  "changes": [
    {
      "type": "Fixed|Added|Removed|Replaced",
      "description": "What changed and why (one sentence)"
    }
  ],
  "security_score_before": 0-100,
  "security_score_after": 0-100
}"""


async def rewrite_secure(code: str, vulnerabilities: list[dict]) -> dict:
    """
    Returns rewritten code + explanation of changes.
    """
    if not ANTHROPIC_API_KEY:
        score = max(0, 100 - len(vulnerabilities) * 20)
        return {
            "rewritten_code": code,
            "changes": [
                {
                    "type": "Added",
                    "description": "Configure ANTHROPIC_API_KEY to generate an AI secure rewrite.",
                }
            ],
            "security_score_before": score,
            "security_score_after": score,
        }

    vuln_summary = json.dumps(
        [{"title": v.get("title"), "severity": v.get("severity"), "line": v.get("line")}
         for v in vulnerabilities],
        indent=2,
    )

    user = (
        f"Vulnerabilities to fix:\n{vuln_summary}\n\n"
        f"Original code:\n```python\n{code}\n```"
    )

    async with httpx.AsyncClient(timeout=40) as client:
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
                "system": SYSTEM,
                "messages": [{"role": "user", "content": user}],
            },
        )
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"]
        return json.loads(text.replace("```json", "").replace("```", "").strip())
