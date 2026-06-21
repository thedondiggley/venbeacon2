// Converts a handle (with or without @, with or without full URL pasted in)
// into a clean, full social media URL. If the person pastes a full URL,
// we respect it as-is rather than trying to be clever about it.

export function handleToUrl(platform: "instagram" | "tiktok" | "facebook", input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If they pasted a full URL, just use it directly — don't second-guess it.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Strip a leading @ and any stray slashes/spaces
  const handle = trimmed.replace(/^@+/, "").replace(/^\/+|\/+$/g, "").trim();
  if (!handle) return null;

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
  }
}

// Converts a stored full URL back into just the handle, for display in the
// input field. If we can't confidently extract a handle, we fall back to
// showing the raw stored value so nothing is ever silently lost.
export function urlToHandle(platform: "instagram" | "tiktok" | "facebook", url: string | null): string {
  if (!url) return "";

  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return url;

    if (platform === "tiktok") {
      return path.startsWith("@") ? path.slice(1) : path;
    }
    return path;
  } catch {
    // Not a valid URL (legacy data might just be a bare handle already)
    return url.replace(/^@+/, "");
  }
}
