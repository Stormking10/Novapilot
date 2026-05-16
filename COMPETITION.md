# Novapilot Competition Demo Guide

## 30-Second Pitch

Novapilot is an AI security copilot for developers. It scans code, explains vulnerabilities in OWASP language, suggests secure rewrites, creates attack walkthroughs, exports reports, and teaches secure coding through an OWASP learning path.

## Judge Demo Flow

1. Open the mobile app and go to **Scanner**.
2. Tap **Run** in the Competition Demo panel.
3. Show the risk score, detailed findings, OWASP/CWE mapping, and secure fixes.
4. Tap **Rewrite** to show the original code beside the secure rewrite.
5. Tap **Attack** to show the educational exploitation walkthrough.
6. Tap **Report** to generate a Markdown security report.
7. Open the **Chat** tab and ask: `What should I fix first from my recent scans?`
8. Open **Learn** to show the OWASP training path.

## Strongest Features To Mention

- Instant demo mode for judges and testers.
- Static analysis plus AI explanations.
- AI Security Copilot with recent scan context.
- Dependency scanning with OSV.dev.
- GitHub repository scanning for Python projects.
- Persisted scan history and dashboard trend views.
- Exportable security reports.
- Deploy-ready FastAPI backend.

## Hosted Backend

The backend can be deployed to Render using `render.yaml`.

After deployment, set the mobile app environment variable:

```text
EXPO_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
```

Optional backend environment variables:

```text
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

The app still has fallback behavior without an AI key, but live AI chat and stronger rewrite quality need one configured.
