const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").trim();

function resolveApiUrl(path: string): string {
  let url: URL;
  try {
    if (/^https?:\/\//i.test(path)) {
      url = new URL(path);
    } else {
      const base = new URL(API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`);
      url = new URL(path.replace(/^\/+/, ""), base);
    }
  } catch {
    throw new Error("URL API invalide. Vérifie NEXT_PUBLIC_API_BASE_URL dans frontend/.env.local.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("L'API doit utiliser une URL HTTP ou HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("L'URL API ne doit pas contenir d'identifiants.");
  }
  return url.toString();
}

export function saveSession(token: string, email: string) {
  localStorage.setItem("uai_access_token", token);
  localStorage.setItem("uai_email", email);
}

export function clearSession() {
  localStorage.removeItem("uai_access_token");
  localStorage.removeItem("uai_email");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("uai_access_token") : null;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/v1/auth/")) {
    clearSession();
    window.location.assign("/login");
  }
  return response;
}
