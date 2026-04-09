const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

/** Absolute URL for SEO / structured data. Set VITE_APP_URL in production. */
export const APP_BASE_URL = (import.meta.env.VITE_APP_URL || "https://www.bookmeartist.com").replace(/\/$/, "");

