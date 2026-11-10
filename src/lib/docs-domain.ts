export const DOCS_URL = "https://docs.nestarc.xyz/";
export const SITE_URL = "https://nestarc.xyz/";

export function docsInputUrl(url: URL) {
  if (url.hostname !== "docs.nestarc.xyz" || url.pathname !== "/") return;
  const result = new URL(url);
  result.pathname = "/docs";
  return result;
}

export function docsOutputUrl(url: URL) {
  if (url.hostname !== "docs.nestarc.xyz") return;
  const result = new URL(url);
  if (url.pathname === "/docs") result.pathname = "/";
  else result.hostname = "nestarc.xyz";
  return result;
}

export function docsRedirectUrl(url: URL) {
  const productionHosts = ["nestarc.xyz", "www.nestarc.xyz", "arc-wonder-creator.lovable.app", "docs.nestarc.xyz"];
  if (!productionHosts.includes(url.hostname)) return;
  if (url.pathname === "/docs" || url.pathname === "/docs/") {
    const result = new URL(DOCS_URL);
    result.search = url.search;
    result.hash = url.hash;
    return result.href;
  }
}