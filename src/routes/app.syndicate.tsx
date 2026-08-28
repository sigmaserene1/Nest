import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/syndicate")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
