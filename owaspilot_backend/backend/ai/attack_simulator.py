"""
ai/attack_simulator.py
Generates a step-by-step attacker walkthrough for a given vulnerability.
"""
import os, json, httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM = """You are a senior penetration tester writing educational attack walkthroughs.
Given a vulnerability, produce a step-by-step explanation of how a real attacker would exploit it.
Keep it educational — no actual malware, just enough detail to help developers understand the risk.

Respond ONLY with valid JSON (no backticks):
{
  "attack_name": "Short name e.g. SQL injection bypass",
  "difficulty": "Easy|Medium|Hard",
  "steps": [
    {
      "number": 1,
      "title": "Reconnaissance",
      "description": "What the attacker does and why",
      "payload": "Optional: example payload or command"
    }
  ],
  "impact": "One sentence on what the attacker gains",
  "mitigations": ["Fix 1", "Fix 2"]
}"""


async def simulate_attack(vulnerability: dict) -> dict:
    """
    vulnerability: dict with keys title, severity, explanation, owasp, fix
    """
    user = f"Vulnerability:\n{json.dumps(vulnerability, indent=2)}"

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
                "max_tokens": 1024,
                "system": SYSTEM,
                "messages": [{"role": "user", "content": user}],
            },
        )
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"]
        return json.loads(text.replace("```json","").replace("```","").strip())
