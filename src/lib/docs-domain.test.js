import { describe, expect, test } from "bun:test";
import { docsInputUrl, docsOutputUrl, docsRedirectUrl } from "./docs-domain.ts";

describe("Docs subdomain", () => {
  test("serves Docs at docs.nestarc.xyz without changing the main homepage", () => {
    expect(docsInputUrl(new URL("https://docs.nestarc.xyz/"))?.pathname).toBe("/docs");
    expect(docsInputUrl(new URL("https://nestarc.xyz/"))).toBeUndefined();
  });
  test("replaces the old Docs address while retaining topic links", () => {
    expect(docsRedirectUrl(new URL("https://nestarc.xyz/docs?topic=pay#pay"))).toBe("https://docs.nestarc.xyz/?topic=pay#pay");
    expect(docsRedirectUrl(new URL("https://www.nestarc.xyz/docs/"))).toBe("https://docs.nestarc.xyz/");
    expect(docsRedirectUrl(new URL("http://localhost:8080/docs"))).toBeUndefined();
  });
  test("keeps Docs navigation at the root and sends app links to the main site", () => {
    expect(docsOutputUrl(new URL("https://docs.nestarc.xyz/docs#network"))?.href).toBe("https://docs.nestarc.xyz/#network");
    expect(docsOutputUrl(new URL("https://docs.nestarc.xyz/app"))?.href).toBe("https://nestarc.xyz/app");
  });
});