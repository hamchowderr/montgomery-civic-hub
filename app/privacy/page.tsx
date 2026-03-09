import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Montgomery Civic Hub",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center border-b bg-background px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      <main className="flex-1 px-4 py-12">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 8, 2026</p>

          <h2>Introduction</h2>
          <p>
            The City of Montgomery (&quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;) operates the Montgomery Civic Hub platform. This
            Privacy Policy explains how we collect, use, and protect information
            when you use our service.
          </p>

          <h2>Information We Collect</h2>
          <p>When you use the Montgomery Civic Hub, we may collect:</p>
          <ul>
            <li>
              <strong>Chat messages</strong> — Questions and conversations you
              submit through portal chat interfaces.
            </li>
            <li>
              <strong>Usage data</strong> — Pages visited, features used, and
              interaction patterns to improve the platform.
            </li>
            <li>
              <strong>Technical data</strong> — Browser type, device
              information, and IP address for security and performance purposes.
            </li>
          </ul>

          <h2>How We Use Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>
              Respond to your questions with relevant city data and insights.
            </li>
            <li>Improve the accuracy and relevance of AI-powered responses.</li>
            <li>Maintain platform security and prevent abuse.</li>
            <li>Analyze usage patterns to enhance the user experience.</li>
          </ul>

          <h2>AI-Powered Features</h2>
          <p>
            The Montgomery Civic Hub uses artificial intelligence (powered by
            Anthropic&apos;s Claude) to process your questions and provide
            responses. Your chat messages are sent to AI services for
            processing. AI responses are generated based on publicly available
            city data and should not be considered official government decisions
            or legal advice.
          </p>

          <h2>Data Retention</h2>
          <p>
            Chat messages and cached data are retained for operational purposes.
            ArcGIS query results are cached for 15 minutes, and web search
            results are cached for 1 hour. You may request deletion of your chat
            history by contacting us.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            We use the following third-party services to operate this platform:
          </p>
          <ul>
            <li>
              <strong>Anthropic (Claude)</strong> — AI language model for
              processing chat queries and generating responses.
            </li>
            <li>
              <strong>Esri (ArcGIS)</strong> — Geographic information services
              for map data and spatial queries.
            </li>
            <li>
              <strong>Bright Data</strong> — Web data collection for
              supplementary information retrieval.
            </li>
            <li>
              <strong>Convex</strong> — Cloud database for storing chat messages
              and cached query results.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We use essential cookies to maintain your session and theme
            preferences. We do not use third-party tracking or advertising
            cookies.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Request access to your personal data.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Opt out of non-essential data collection.</li>
          </ul>

          <h2>Contact</h2>
          <p>
            For privacy-related questions or data requests, contact the City of
            Montgomery at{" "}
            <a href="mailto:privacy@montgomeryal.gov">
              privacy@montgomeryal.gov
            </a>
            .
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
