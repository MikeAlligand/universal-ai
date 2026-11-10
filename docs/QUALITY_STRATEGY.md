# Quality strategy

Do not measure answer quality by model agreement alone.

For each evaluation case, store:
- question,
- expected answer or expected abstention,
- allowed source documents,
- expected claim-level evidence,
- risk category,
- expected behavior.

Measure separately:
- retrieval recall/precision,
- groundedness of claims,
- citation correctness,
- answer correctness,
- abstention quality,
- reviewer false acceptance and false rejection,
- latency and cost.

Build a small gold dataset first (20–50 cases), manually reviewed by a human. Expand it as real failure cases appear. Run it on every prompt, model, chunking or retrieval change.

For critical claims, require source evidence and deterministic checks where possible. Reviewer models are fallible and correlated; use different model families where practical, but do not treat diversity as a guarantee.
