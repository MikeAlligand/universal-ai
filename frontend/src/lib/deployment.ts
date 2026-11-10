export function chatbotEndpoint(apiUrl: string, slug: string): string {
  const base = apiUrl.trim().replace(/\/+$/, "");
  if (!base || !slug.trim()) throw new Error("API URL and deployment slug are required");
  return `${base}/b/${encodeURIComponent(slug)}/chat`;
}
