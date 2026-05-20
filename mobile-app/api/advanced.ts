import { apiFetch, formatApiError } from './errors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ── Attack simulation ─────────────────────────────────────────────────────

export interface AttackStep {
  number: number;
  title: string;
  description: string;
  payload?: string;
}

export interface AttackSimulation {
  attack_name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  steps: AttackStep[];
  impact: string;
  mitigations: string[];
}

export async function simulateAttack(vulnerability: object): Promise<AttackSimulation> {
  const res = await apiFetch(`${API_BASE}/attack-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vulnerability }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Attack sim failed: ${res.status}`));
  }
  return res.json();
}


// ── Repo scan (SSE) ───────────────────────────────────────────────────────

export interface RepoScanResult {
  files_scanned: number;
  files_with_issues: number;
  total_vulnerabilities: number;
  average_risk_score: number;
  results: Array<{ file: string; vulnerabilities: object[]; risk_score: number }>;
}

export async function scanRepo(
  githubUrl: string,
  onProgress: (pct: number, message: string) => void,
): Promise<RepoScanResult> {
  const res = await apiFetch(`${API_BASE}/repo-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github_url: githubUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Repo scan failed: ${res.status}`));
  }

  if (!res.body || !(res.body as any).getReader) {
    const text = await res.text();
    const events = text.split('\n\n').filter(line => line.startsWith('data: '));
    for (const event of events) {
      const data = JSON.parse(event.slice(6));
      if (data.pct !== undefined) onProgress(data.pct, data.message);
      if (data.result) return data.result;
    }
    throw new Error('Repo scan response did not include a result');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = JSON.parse(line.slice(6));
      if (data.result) return data.result;
      if (data.pct !== undefined) onProgress(data.pct, data.message);
    }
  }
  throw new Error('Repo scan stream ended without result');
}


// ── Dependency scan ───────────────────────────────────────────────────────

export interface DepVuln {
  cve: string;
  summary: string;
  severity: string;
  cvss_score: number | null;
  fixed_version: string | null;
}

export interface Dependency {
  name: string;
  version: string | null;
  status: 'safe' | 'vulnerable';
  severity?: string;
  vulns: DepVuln[];
}

export interface DepScanResult {
  total: number;
  vulnerable_count: number;
  dependencies: Dependency[];
}

export async function scanDependencies(
  content: string,
  filename = 'requirements.txt',
): Promise<DepScanResult> {
  const res = await apiFetch(`${API_BASE}/dep-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Dep scan failed: ${res.status}`));
  }
  return res.json();
}


// ── Secure rewrite ────────────────────────────────────────────────────────

export interface RewriteResult {
  rewritten_code: string;
  changes: Array<{ type: string; description: string }>;
  security_score_before: number;
  security_score_after: number;
}

export async function rewriteSecure(
  code: string,
  vulnerabilities: object[],
): Promise<RewriteResult> {
  const res = await apiFetch(`${API_BASE}/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, vulnerabilities }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Rewrite failed: ${res.status}`));
  }
  return res.json();
}

export async function exportMarkdownReport(result: object): Promise<string> {
  const res = await apiFetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Report export failed: ${res.status}`));
  }
  return res.text();
}
