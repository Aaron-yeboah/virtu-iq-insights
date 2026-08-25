import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Component, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SplashScreen } from "../components/SplashScreen";
import { Toaster } from "../components/ui/sonner";
import { supabase } from "../integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src="/virtu-iq-symbol.png" alt="" className="mx-auto h-14 w-auto animate-pulse mb-6" />
        <h2 className="text-lg font-semibold text-foreground">Taking you home…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Redirecting you automatically.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home now
          </Link>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `setTimeout(function(){window.location.href='/'},2000)` }} />
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    // Auto-retry once after 1.5 seconds to silently recover from transient SSR errors
    const timer = setTimeout(() => {
      void router.invalidate().then(() => reset());
    }, 1500);
    return () => clearTimeout(timer);
  }, [error, router, reset]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src="/virtu-iq-symbol.png" alt="" className="mx-auto h-14 w-auto animate-pulse mb-6" />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Loading Virtu-IQ…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reconnecting to the server. This should only take a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Refresh
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Virtu-IQ — AI Visual Analytics" },
      {
        name: "description",
        content:
          "Virtu-IQ turns screenshots into intelligent, structured insight reports using AI image analysis.",
      },
      { name: "author", content: "Virtu-IQ" },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "Virtu-IQ — AI Visual Analytics" },
      {
        property: "og:description",
        content: "Upload visual information and let Virtu-IQ's AI analyze and explain what it sees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Virtu-IQ",
              url: "https://virtu-iq.lovable.app",
              logo: "https://virtu-iq.lovable.app/icon-512.png",
            },
            {
              "@type": "WebSite",
              name: "Virtu-IQ",
              url: "https://virtu-iq.lovable.app",
            },
          ],
        }),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "any" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/icon-192.png", sizes: "192x192" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppErrorBoundary>
        <Outlet />
      </AppErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}

// Last-resort boundary: router boundaries ignore falsy thrown values (e.g. `throw undefined`),
// which loops into a blank screen. This catches anything and always renders a recovery screen.
class AppErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  override state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("App error boundary:", error);
    reportLovableError(error, { boundary: "app_root_boundary" });
    // Auto-reload after 2s to silently recover
    setTimeout(() => window.location.reload(), 2000);
  }

  override render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <img src="/virtu-iq-symbol.png" alt="" className="mx-auto h-14 w-auto animate-pulse mb-6" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Loading Virtu-IQ…
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we reconnect.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Refresh now
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
