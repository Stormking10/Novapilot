import { apiFetch, formatApiError } from './errors';

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
  id?: string;
  language: string;
  risk_score: number;
  summary: string;
  vulnerabilities: Vulnerability[];
  created_at?: string;
  filename?: string;
}

export async function scanCode(code: string, language = 'python'): Promise<ScanResult> {
  const response = await apiFetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Scan failed: ${response.status}`));
  }

  return response.json();
}

export async function getHistory(): Promise<{ scans: ScanResult[] }> {
  try {
    const response = await apiFetch(`${API_BASE}/history`);
    if (!response.ok) {
      throw new Error(`History failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.warn('History unavailable (is the backend running?):', error);
    return { scans: [] };
  }
}

export async function chatWithAI(
  code: string,
  vulnerability_details: string,
  user_question: string,
  language: string = "python"
): Promise<{ answer: string }> {
  const response = await apiFetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      vulnerability_details,
      user_question,
      language
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(formatApiError(err.detail, `Chat failed: ${response.status}`));
  }
  return response.json();
}

export async function chatWithAssistant(
  user_question: string,
  include_recent_scans = true,
): Promise<{ answer: string }> {
  try {
    const response = await apiFetch(`${API_BASE}/assistant-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_question, include_recent_scans }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(formatApiError(err.detail, `Assistant chat failed: ${response.status}`));
    }
    return response.json();
  } catch (error) {
    console.error('Error in assistant chat:', error);
    throw error;
  }
}
