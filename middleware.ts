import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected: everything under /app and all API routes except public ones
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/api/meta(.*)",
  "/api/agents(.*)",
  "/api/batch(.*)",
  "/api/patterns(.*)",
  "/api/conversations(.*)",
  "/api/upload(.*)",
  "/api/rules(.*)",
  "/api/pdf/agent(.*)",
  "/api/scope(.*)",
  "/api/dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
