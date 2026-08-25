export function renderErrorPage(_error?: unknown): string {
  // Never show raw errors to users — present a branded recovery screen
  // that auto-reloads after 2 seconds to silently recover from transient SSR failures.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Virtu-IQ</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 24rem; width: 100%; text-align: center; padding: 2rem; }
      .logo { width: 56px; height: 56px; margin: 0 auto 1.5rem; animation: pulse 1.6s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
      p { color: #9ca3af; margin: 0 0 1.5rem; font-size: 0.875rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; font-size: 0.875rem; }
      .primary { background: #fff; color: #111; }
      .secondary { background: transparent; color: #fafafa; border-color: #333; }
    </style>
  </head>
  <body>
    <div class="card">
      <img src="/virtu-iq-symbol.png" alt="" class="logo" />
      <h1>Loading Virtu-IQ…</h1>
      <p>Please wait while we connect.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Refresh</button>
        <a class="secondary" href="/">Home</a>
      </div>
    </div>
    <script>setTimeout(function(){location.reload()},2000)</script>
  </body>
</html>`;
}
