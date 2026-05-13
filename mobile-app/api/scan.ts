const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  line: string;
  owasp?: string;
  rule_id?: string;
  explanation: string;
  fix: string;
  cwe?: string;
}

export interface ScanResult {
  scan_id: string;
  language: string;
  risk_score: number;
  summary: string;
  vulnerabilities: Vulnerability[];
}

export async function scanCode(code: string, language = 'python'): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? `Scan failed: ${response.status}`);
  }

  return response.json();
}

export async function getHistory(): Promise<{ scans: ScanResult[] }> {
  const response = await fetch(`${API_BASE}/history`);
  return response.json();
}
