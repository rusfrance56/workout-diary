/** Чинит абсолютные /exercises/... под GitHub Pages base (/workout-diary/). */
export function resolveAssetUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('data:') || /^https?:\/\//i.test(url)) {
    return url;
  }

  const base = import.meta.env.BASE_URL || '/';
  if (url.startsWith(base)) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${base}${url.slice(1)}`;
  }

  return `${base}${url}`;
}
