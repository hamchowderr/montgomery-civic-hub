import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <Image
          src="/montgomery-seal.png"
          alt="City of Montgomery Seal"
          width={20}
          height={20}
          className="rounded"
        />
        <span>&copy; 2026 City of Montgomery, AL</span>
        <span>·</span>
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/terms" className="transition-colors hover:text-foreground">
          Terms
        </Link>
        <span>·</span>
        <Link href="/docs" target="_blank" className="transition-colors hover:text-foreground">
          Docs
        </Link>
        <span>·</span>
        <span>
          Made with ❤️ by{" "}
          <a
            href="https://otakusolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            Otaku Solutions
          </a>
        </span>
      </div>
    </footer>
  );
}
