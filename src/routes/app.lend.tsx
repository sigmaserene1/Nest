import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/lend")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
