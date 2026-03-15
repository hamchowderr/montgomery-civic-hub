import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding",
  "/portal-redirect",
  "/resident(.*)",
  "/business(.*)",
  "/citystaff(.*)",
  "/researcher(.*)",
  "/executive(.*)",
  "/insights(.*)",
  "/api/copilotkit",
  "/api/chat/(.*)",
  "/api/webhooks/(.*)",
  "/docs(.*)",
  "/_mintlify(.*)",
]);

const PRODUCTION_DOMAIN = "montgomery-civichub.otakusolutions.io";

// Mintlify doc pages that need redirecting to /docs/* prefix
// These match sidebar links that Mintlify generates without the /docs prefix
const MINTLIFY_DOC_ROUTES = /^\/(introduction|getting-started|portals\/|features\/|data\/)(.*)/;

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Redirect Mintlify sidebar links to /docs/* prefix
  if (MINTLIFY_DOC_ROUTES.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/docs${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  // Redirect Vercel deployment URLs to the custom domain
  const host = req.headers.get("host") ?? "";
  if (host.endsWith(".vercel.app") && process.env.VERCEL_ENV === "production") {
    const url = new URL(req.url);
    url.host = PRODUCTION_DOMAIN;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
