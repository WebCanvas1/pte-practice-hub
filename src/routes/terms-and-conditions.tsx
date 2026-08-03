import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/layout/LegalPage";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: `Terms and Conditions — ${siteConfig.name}` },
      {
        name: "description",
        content: `The terms that apply when you create an account, purchase practice tests or use scoring and feedback on ${siteConfig.name}.`,
      },
      { property: "og:title", content: `Terms and Conditions — ${siteConfig.name}` },
      { property: "og:description", content: "Account, purchase and acceptable use terms." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updated="4 August 2026">
      <section>
        <h2>Agreement</h2>
        <p>
          By creating an account on {siteConfig.name} you agree to these terms with{" "}
          {siteConfig.company.legalName}. This document is a template and should be reviewed by a
          qualified legal adviser before launch.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You must provide accurate registration details and keep your password secure.</li>
          <li>Accounts are for individual use and may not be shared or resold.</li>
          <li>We may suspend accounts that breach these terms or platform integrity rules.</li>
        </ul>
      </section>
      <section>
        <h2>Purchases and pricing</h2>
        <ul>
          <li>
            Individual module tests are {formatPrice(pricingConfig.modulePrice)} and complete mock
            tests are {formatPrice(pricingConfig.fullMockPrice)}.
          </li>
          <li>{pricingConfig.labels.taxNote}</li>
          <li>Prices may change; the price shown at checkout applies to that purchase.</li>
        </ul>
      </section>
      <section>
        <h2>Refunds</h2>
        <p>
          Where a purchased test cannot be delivered due to a technical fault on our side, we will
          restore the credit or refund the purchase. Refunds are not generally available for tests
          that have been started or completed.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not copy, record, redistribute or publish question content.</li>
          <li>Do not attempt to reverse engineer scoring systems or bypass access controls.</li>
          <li>Do not use automated tools to submit responses.</li>
        </ul>
      </section>
      <section>
        <h2>Intellectual property</h2>
        <p>
          All question content, scoring rubrics, software and branding remain the property of{" "}
          {siteConfig.company.legalName}.
        </p>
      </section>
      <section>
        <h2>Limitation of liability</h2>
        <p>
          The platform is provided for practice purposes. To the extent permitted by law, our
          liability is limited to the amount paid for the affected test.
        </p>
      </section>
    </LegalPage>
  );
}
