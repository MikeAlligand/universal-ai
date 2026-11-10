import httpx
from fastapi import HTTPException
from app.core.config import settings


def _generate_demo_reply(*, system_prompt: str, messages: list[dict[str, str]]) -> str:
    """Useful deterministic demo response; never claims to be real inference."""
    latest = next((m.get("content", "").strip() for m in reversed(messages) if m.get("role") == "user"), "")
    if not latest:
        return "Je n’ai pas reçu de message. Pouvez-vous préciser votre demande ?"
    normalized = latest.casefold()
    previous = [m.get("content", "").strip() for m in messages[:-1] if m.get("role") == "user" and m.get("content", "").strip()]
    role = (system_prompt or "").strip()
    if any(x in normalized for x in ("bonjour", "salut", "hello", "bonsoir", "coucou")):
        answer = "Bonjour ! Je suis prêt à vous aider. Je fonctionne actuellement en mode démonstration. Dites-moi ce que vous souhaitez explorer."
    elif any(x in normalized for x in ("qui es-tu", "présente", "presente", "ton rôle", "ton role")):
        answer = f"Je suis votre assistant configuré dans Universal AI Platform. {role[:300]}\n\nCette réponse illustre le contexte configuré ; la compréhension générative sera activée avec un fournisseur IA ultérieurement."
    elif any(x in normalized for x in ("aide", "que peux-tu", "que peux tu", "fonctionnal", "comment utiliser")):
        answer = "Voici ce que vous pouvez tester :\n\n- **Conversation** : envoyer plusieurs messages.\n- **Historique** : retrouver les discussions précédentes.\n- **Contexte** : poursuivre un échange.\n- **Configuration** : consulter les paramètres de l’assistant.\n\nLe mode démo simule le parcours sans appeler de modèle IA externe."
    elif any(x in normalized for x in ("résume", "resume", "synthèse", "synthese")):
        answer = "Je peux illustrer le format d’une synthèse. Le mode démo ne réalise pas encore d’analyse générative.\n\n**Structure proposée**\n1. Contexte et objectif\n2. Informations essentielles\n3. Points d’attention\n4. Recommandations et prochaines actions"
    else:
        answer = f"Votre message a bien été reçu et enregistré.\n\n**Aperçu de votre demande**\n> {latest[:700]}\n\nLe parcours de conversation fonctionne en mode démonstration. Cette version fonctionne sans aucun modèle IA externe : elle simule les réponses pour valider le parcours. Le raisonnement génératif sera activé lorsque vous configurerez un fournisseur IA."
    if previous:
        answer += f"\n\nJe garde le fil de votre échange précédent : « {previous[-1][:180]} »."
    return answer


async def generate_reply(*, provider: str, model: str, system_prompt: str, temperature: float, messages: list[dict[str, str]]) -> str:
    """Provider-agnostic LLM gateway. Mock mode works without external credentials."""
    if (settings.llm_mode or "mock").strip().lower() in {"mock", "demo", "demonstration"}:
        return _generate_demo_reply(system_prompt=system_prompt, messages=messages)

    if provider in {"openai", "mistral", "ollama"}:
        if provider == "openai":
            api_key = settings.openai_api_key
            base_url = "https://api.openai.com/v1"
        elif provider == "mistral":
            api_key = settings.mistral_api_key
            base_url = "https://api.mistral.ai/v1"
        else:
            api_key = "ollama"
            base_url = settings.ollama_base_url.rstrip("/") + "/v1"
        if not api_key:
            raise HTTPException(status_code=503, detail=f"Clé API manquante pour le fournisseur {provider}. Configurez-la dans le fichier .env du backend.")
        payload = {"model": model, "messages": ([{"role": "system", "content": system_prompt}] if system_prompt.strip() else []) + messages, "temperature": temperature}
        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(90.0, connect=15.0)) as client:
                response = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
            return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Le fournisseur IA n'a pas répondu dans le délai imparti.") from exc
        except httpx.ConnectError as exc:
            if provider == "ollama":
                raise HTTPException(status_code=503, detail="Ollama n'est pas joignable. Démarrez l'application Ollama sur la machine qui héberge le backend.") from exc
            raise HTTPException(status_code=502, detail="Impossible de joindre le fournisseur IA configuré.") from exc
        except httpx.HTTPStatusError as exc:
            detail = "Erreur renvoyée par le fournisseur IA. Vérifiez la clé API, le modèle et vos droits d'accès."
            try:
                detail = exc.response.json().get("error", {}).get("message", detail)
            except Exception:
                pass
            raise HTTPException(status_code=502, detail=detail) from exc
        except (httpx.HTTPError, KeyError, IndexError, TypeError) as exc:
            raise HTTPException(status_code=502, detail="Impossible de communiquer avec le fournisseur IA.") from exc

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise HTTPException(status_code=503, detail="Clé API manquante pour Anthropic. Configurez ANTHROPIC_API_KEY dans le fichier .env du backend.")
        payload = {"model": model, "max_tokens": 2048, "temperature": temperature, "system": system_prompt, "messages": messages}
        headers = {"x-api-key": settings.anthropic_api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(90.0, connect=15.0)) as client:
                response = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
            return "\n".join(block.get("text", "") for block in data.get("content", []) if block.get("type") == "text")
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Anthropic n'a pas répondu dans le délai imparti.") from exc
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail="Erreur renvoyée par Anthropic. Vérifiez la clé API et le modèle.") from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Impossible de communiquer avec Anthropic.") from exc

    raise HTTPException(status_code=400, detail=f"Fournisseur non pris en charge : {provider}")
