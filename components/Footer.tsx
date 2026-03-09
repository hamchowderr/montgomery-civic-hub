import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded bg-accent">
            <span className="text-[0.6rem] font-bold text-accent-foreground">
              MCH
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 City of Montgomery, AL
          </p>
        </div>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl text-center text-sm text-muted-foreground">
        Made with ❤️ by{" "}
        <a
          href="https://otakusolutions.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
        >
          Otaku Solutions
        </a>
      </div>
    </footer>
  );
}
