import { createFileRoute, redirect } from "@tanstack/react-router";
import { DOCS_URL } from "@/lib/docs-domain";

// Compatibility address only: the documentation content lives in its own project.
export const Route = createFileRoute("/docs")({
  beforeLoad: ({ location }) => {
    const destination = new URL(DOCS_URL);
    destination.search = location.searchStr;
    destination.hash = location.hash;
    throw redirect({ href: destination.href, reloadDocument: true, statusCode: 301 });
  },
});
