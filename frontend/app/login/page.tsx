"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch(`${API}/api/v1/auth/setup-status`).then(r => r.json()).then(v => setSetup(v.setup_required)).catch(() => setError("API indisponible. Démarre le backend.")); }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/api/v1/auth/${setup ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Connexion impossible");
      saveSession(data.access_token, data.email); router.replace("/");
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur de connexion"); }
    finally { setBusy(false); }
  }
  return <main className="shell"><section className="content" style={{ maxWidth: 520, margin: "10vh auto" }}><div className="page-heading"><div><p className="eyebrow">UNIVERSAL AI PLATFORM</p><h1>{setup ? "Créer le compte administrateur" : "Connexion"}</h1><p className="subtitle">{setup ? "Configure le premier compte qui protégera cet environnement local." : "Connecte-toi pour accéder à ton espace de travail."}</p></div></div><section className="panel"><form onSubmit={submit}><label htmlFor="email">Adresse e-mail</label><input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /><label htmlFor="password">Mot de passe</label><input id="password" type="password" autoComplete={setup ? "new-password" : "current-password"} minLength={12} value={password} onChange={e => setPassword(e.target.value)} required /><small>12 caractères minimum.</small><button disabled={busy || setup === null}>{busy ? "Patiente..." : setup ? "Créer le compte" : "Se connecter"} <span>→</span></button></form>{error && <p className="error">{error}</p>}</section></section></main>;
}
