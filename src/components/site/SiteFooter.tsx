import { LogoFull } from "@/components/brand/Logo";

const groups = [
  { title: "Product", items: ["Features", "How It Works", "Packages", "Analysis Reports"] },
  { title: "Company", items: ["About", "Contact", "Careers", "Blog"] },
  { title: "Support", items: ["Help Center", "Getting Started", "Account Security", "Status"] },
  { title: "Legal", items: ["Privacy Policy", "Terms", "Refund Policy", "Acceptable Use"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <LogoFull className="h-9" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              AI-powered visual analytics that turns screenshots into clear, structured
              insight reports.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-foreground">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Virtu-IQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}