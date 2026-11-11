export const DOCS_URL = "https://docs.nestarc.xyz/";

export function docsRedirectUrl(url: URL) {
  if (url.pathname === "/docs" || url.pathname === "/docs/") {
    const result = new URL(DOCS_URL);
    result.search = url.search;
    result.hash = url.hash;
    return result.href;
  }
}