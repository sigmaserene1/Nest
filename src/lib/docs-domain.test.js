import { describe, expect, test } from "bun:test";
import { docsRedirectUrl } from "./docs-domain.ts";

describe("Docs subdomain", () => {
  test("replaces the old Docs address while retaining topic links", () => {
    expect(docsRedirectUrl(new URL("https://nestarc.xyz/docs?topic=pay#pay"))).toBe("https://docs.nestarc.xyz/?topic=pay#pay");
    expect(docsRedirectUrl(new URL("https://www.nestarc.xyz/docs/"))).toBe("https://docs.nestarc.xyz/");
  });
  test("redirects preview and local Docs addresses to the separate project", () => {
    expect(docsRedirectUrl(new URL("http://localhost:8080/docs"))).toBe("https://docs.nestarc.xyz/");
    expect(docsRedirectUrl(new URL("https://id-preview--96ea8a7a-fdb1-4f39-8c43-82fb861fc17e.lovable.app/docs#network"))).toBe("https://docs.nestarc.xyz/#network");
  });
  test("leaves the homepage and app untouched and does not loop at the Docs root", () => {
    for (const url of ["https://nestarc.xyz/", "https://nestarc.xyz/app", "https://docs.nestarc.xyz/"]) {
      expect(docsRedirectUrl(new URL(url))).toBeUndefined();
    }
  });
});