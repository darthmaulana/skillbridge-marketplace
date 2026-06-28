export function toExternalUrl(value: string | null | undefined) {
  const clean = value?.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(clean)) return `https://${clean}`;
  return null;
}
