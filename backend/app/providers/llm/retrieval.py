"""Project-scoped hybrid retrieval for the Knowledge Hub.

Uses Ollama embeddings when available and falls back to transparent lexical
ranking. Embeddings are cached in-process by source content hash.
"""
from __future__ import annotations

import hashlib
import logging
import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)
_EMBED_CACHE: dict[tuple[str, str, str], list[list[float]]] = {}
_CACHE_MAX_ENTRIES = 256
_STOP_WORDS = {
    "avec", "dans", "pour", "quel", "quelle", "quels", "quelles", "est", "sont", "une", "des", "les", "la", "le", "du", "de", "et", "ou", "un", "sur", "par", "qui", "que", "quoi", "comment", "combien", "peux", "vous", "nous", "moi", "mon", "ma", "mes", "ton", "ta", "tes", "ce", "cet", "cette", "ces", "the", "and", "for", "with", "what", "which", "when", "where", "from", "that", "this", "are", "was", "were", "have", "has",
}


@dataclass
class RetrievedChunk:
    source_id: str
    source_name: str
    origin: str
    chunk_index: int
    score: float
    content: str


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def _tokens(value: str) -> list[str]:
    return [token for token in _normalize(value).split() if len(token) >= 2 and token not in _STOP_WORDS]


def split_into_chunks(content: str, max_chars: int = 1100, overlap: int = 160) -> list[str]:
    """Split extracted text into bounded chunks, keeping paragraph boundaries where possible."""
    text = content.replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9])", text) if p.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        while len(paragraph) > max_chars:
            head, paragraph = paragraph[:max_chars], paragraph[max_chars - overlap:]
            if current:
                chunks.append(current)
                current = ""
            chunks.append(head.strip())
        candidate = f"{current}\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            carry = current[-overlap:] if current else ""
            current = f"{carry} {paragraph}".strip()
            if len(current) > max_chars:
                current = current[:max_chars]
    if current:
        chunks.append(current)
    return chunks or ([text[:max_chars]] if text.strip() else [])


def _lexical_score(question: str, chunk: str) -> float:
    query = set(_tokens(question))
    if not query:
        return 0.0
    tokens = _tokens(chunk)
    if not tokens:
        return 0.0
    token_set = set(tokens)
    coverage = len(query & token_set) / len(query)
    frequency = sum(min(tokens.count(term), 3) for term in query) / max(1, len(tokens))
    phrase_bonus = 0.15 if _normalize(question) and _normalize(question) in _normalize(chunk) else 0.0
    return min(1.0, coverage * 0.78 + frequency * 2.0 + phrase_bonus)


def _cosine(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    return dot / (left_norm * right_norm) if left_norm and right_norm else 0.0


async def _ollama_embeddings(texts: list[str]) -> list[list[float]]:
    model = settings.ollama_embedding_model
    base = settings.ollama_base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=4.0)) as client:
        response = await client.post(f"{base}/api/embed", json={"model": model, "input": texts})
        response.raise_for_status()
        payload = response.json()
    vectors = payload.get("embeddings")
    if not isinstance(vectors, list) or len(vectors) != len(texts):
        raise ValueError("Réponse d'embeddings Ollama invalide")
    return vectors


async def retrieve_relevant_chunks(question: str, sources: Iterable[object], *, top_k: int = 5) -> tuple[list[RetrievedChunk], str]:
    """Return top project-authorized chunks and the retrieval method used."""
    candidates: list[tuple[object, int, str]] = []
    for source in sources:
        for index, chunk in enumerate(split_into_chunks(getattr(source, "content", ""))):
            candidates.append((source, index, chunk))
    if not candidates:
        return [], "none"

    lexical = [_lexical_score(question, chunk) for _, _, chunk in candidates]
    scores = lexical
    method = "lexical"

    if (settings.llm_mode or "").strip().lower() == "local" and settings.ollama_embedding_model:
        try:
            model = settings.ollama_embedding_model
            vectors_by_candidate: list[list[float] | None] = [None] * len(candidates)
            missing_indices: list[int] = []
            missing_texts: list[str] = []
            for idx, (source, chunk_index, chunk) in enumerate(candidates):
                digest = hashlib.sha256(getattr(source, "content", "").encode("utf-8")).hexdigest()
                key = (str(getattr(source, "id", "")), digest, model)
                cached = _EMBED_CACHE.get(key)
                if cached and chunk_index < len(cached):
                    vectors_by_candidate[idx] = cached[chunk_index]
                else:
                    missing_indices.append(idx)
                    missing_texts.append(chunk)
            if missing_texts:
                fresh_vectors = await _ollama_embeddings(missing_texts)
                for idx, vector in zip(missing_indices, fresh_vectors):
                    vectors_by_candidate[idx] = vector
                # Rebuild complete source vectors for subsequent requests.
                by_source: dict[tuple[str, str, str], list[tuple[int, list[float]]]] = {}
                for idx, (source, chunk_index, _) in enumerate(candidates):
                    vector = vectors_by_candidate[idx]
                    if vector is None:
                        continue
                    digest = hashlib.sha256(getattr(source, "content", "").encode("utf-8")).hexdigest()
                    key = (str(getattr(source, "id", "")), digest, model)
                    by_source.setdefault(key, []).append((chunk_index, vector))
                for key, entries in by_source.items():
                    ordered = [vector for _, vector in sorted(entries)]
                    if len(_EMBED_CACHE) >= _CACHE_MAX_ENTRIES:
                        _EMBED_CACHE.pop(next(iter(_EMBED_CACHE)))
                    _EMBED_CACHE[key] = ordered
            query_vector = (await _ollama_embeddings([question]))[0]
            semantic = [_cosine(query_vector, vector or []) for vector in vectors_by_candidate]
            scores = [0.65 * sem + 0.35 * lex for sem, lex in zip(semantic, lexical)]
            method = "hybrid"
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            logger.info("Ollama embeddings unavailable; lexical retrieval used: %s", exc)

    ranked = sorted(enumerate(scores), key=lambda pair: pair[1], reverse=True)
    selected: list[RetrievedChunk] = []
    seen_sources_chunks: set[tuple[str, int]] = set()
    for idx, score in ranked:
        if score < (0.22 if method == "hybrid" else 0.12):
            continue
        source, chunk_index, chunk = candidates[idx]
        key = (str(getattr(source, "id", "")), chunk_index)
        if key in seen_sources_chunks:
            continue
        seen_sources_chunks.add(key)
        selected.append(RetrievedChunk(
            source_id=str(getattr(source, "id", "")),
            source_name=str(getattr(source, "name", "Document")),
            origin=str(getattr(source, "origin", "")),
            chunk_index=chunk_index,
            score=round(float(score), 4),
            content=chunk,
        ))
        if len(selected) >= top_k:
            break
    return selected, method
