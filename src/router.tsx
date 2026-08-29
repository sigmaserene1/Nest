import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm route code/data as soon as a user shows intent (hover/focus/touch).
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
