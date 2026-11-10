from app.providers.llm.base import LLMProvider, GenerationResult


class MockLLMProvider(LLMProvider):
    async def generate(self, prompt: str) -> GenerationResult:
        return GenerationResult(
            text=(
                "Réponse de démonstration. Le fournisseur IA est actuellement "
                "en mode mock : aucune réponse factuelle ne doit être considérée "
                "comme validée tant que le moteur RAG et les citations ne sont pas activés."
            ),
            provider="mock",
            model="deterministic-demo",
        )
