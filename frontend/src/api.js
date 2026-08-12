const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function startProcess(source, language) {
  return request("/api/process", {
    method: "POST",
    body: JSON.stringify({ source, language }),
  });
}

export function getStatus(jobId) {
  return request(`/api/status/${jobId}`);
}

export function sendChat(sessionId, question) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, question }),
  });
}
