import { createFileRoute, redirect } from "@tanstack/react-router";

// The legacy page mixed static trend data with live obligations. Keep old
// bookmarks safe, but send users to the evidence-only V2 overview.
export const Route = createFileRoute("/app/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
