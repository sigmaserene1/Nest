import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { docsRedirectUrl } from "./lib/docs-domain";

const docsDomainMiddleware = createMiddleware().server(async ({ next, request }) => {
  const destination = docsRedirectUrl(new URL(request.url));
  if (destination && (request.method === "GET" || request.method === "HEAD")) {
    return Response.redirect(destination, 301);
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, docsDomainMiddleware],
}));
