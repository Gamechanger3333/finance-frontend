import { getToken } from "@/hooks/use-auth";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, method: string, body?: unknown) {
  const hasBody = body !== undefined;
  const res = await fetch(path, {
    method,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function apiGet(path: string) {
  return request(path, "GET");
}

export function apiPost(path: string, body: unknown) {
  return request(path, "POST", body);
}

export function apiPut(path: string, body: unknown) {
  return request(path, "PUT", body);
}

export function apiPatch(path: string, body: unknown) {
  return request(path, "PATCH", body);
}

export function apiDelete(path: string) {
  return request(path, "DELETE");
}

// For endpoints that return a file (CSV/PDF export) rather than JSON —
// fetches with the auth header, then triggers a normal browser download.
export async function apiDownload(path: string, filename: string) {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
