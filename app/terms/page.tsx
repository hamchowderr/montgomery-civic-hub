import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | Montgomery Civic Hub",
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: March 8, 2026</p>

          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using the Montgomery Civic Hub (&quot;the
            Service&quot;), you agree to be bound by these Terms of Service. If
            you do not agree to these terms, please do not use the Service.
          </p>

          <h2>Description of Service</h2>
          <p>
            The Montgomery Civic Hub is an AI-powered civic engagement platform
            operated by the City of Montgomery, Alabama. It provides four
            specialized portals — Resident, Business, City Staff, and Researcher
            — offering access to city data, maps, and AI-assisted insights.
          </p>

          <h2>User Responsibilities</h2>
          <p>When using the Service, you agree to:</p>
          <ul>
            <li>Use the platform for lawful purposes only.</li>
            <li>
              Not attempt to disrupt, overload, or compromise the Service.
            </li>
            <li>
              Not submit false, misleading, or malicious content through chat
              interfaces.
            </li>
            <li>
              Not use automated tools to scrape or extract data from the
              platform.
            </li>
          </ul>

          <h2>AI Disclaimer</h2>
          <p>
            The Montgomery Civic Hub uses artificial intelligence to generate
            responses to user queries. AI-generated content is provided for
            informational purposes only and:
          </p>
          <ul>
            <li>
              Does not constitute official government policy, legal advice, or
              binding decisions.
            </li>
            <li>May contain inaccuracies or outdated information.</li>
            <li>
              Should be verified through official city channels for critical
              matters.
            </li>
            <li>
              Is generated from publicly available data and may not reflect the
              most current information.
            </li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            The Montgomery Civic Hub platform, its design, and original content
            are the property of the City of Montgomery. Public data accessed
            through the platform remains in the public domain. AI-generated
            responses are provided without copyright claim.
          </p>

          <h2>Data Sources</h2>
          <p>
            The Service aggregates data from multiple sources including ArcGIS
            FeatureServers, public city records, and web sources. Data accuracy
            depends on the source providers. The City of Montgomery does not
            guarantee the accuracy, completeness, or timeliness of third-party
            data.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any
            kind, express or implied. The City of Montgomery shall not be liable
            for any damages arising from the use or inability to use the
            Service, including but not limited to reliance on AI-generated
            content.
          </p>

          <h2>Service Availability</h2>
          <p>
            We strive to maintain continuous availability but do not guarantee
            uninterrupted access. The Service may be temporarily unavailable due
            to maintenance, updates, or circumstances beyond our control.
          </p>

          <h2>Modifications</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time.
            Continued use of the Service after changes constitutes acceptance of
            the revised terms.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of the State of
            Alabama. Any disputes arising from the use of the Service shall be
            subject to the jurisdiction of the courts in Montgomery County,
            Alabama.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these Terms of Service, contact the City of
            Montgomery at{" "}
            <a href="mailto:legal@montgomeryal.gov">legal@montgomeryal.gov</a>.
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
