export function resolveImage(url: string): string {
  if (!url) return "/images/placeholder.png";

  // já é absoluta
  if (url.startsWith("http")) return url;

  // imagens locais
  if (url.startsWith("/images")) return url;

  const base = process.env.NEXT_PUBLIC_API_URL;

  // garante / no começo
  const normalized = url.startsWith("/") ? url : `/${url}`;

  return `${base}${normalized}`;
}