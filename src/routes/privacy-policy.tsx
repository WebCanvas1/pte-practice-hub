import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/layout/LegalPage";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${siteConfig.name}` },
      {
        name: "description",
        content: `How ${siteConfig.name} collects, stores and protects student data, including test responses and audio recordings.`,
      },
      { property: "og:title", content: `Privacy Policy — ${siteConfig.name}` },
      { property: "og:description", content: "How we handle your personal data and test responses." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="4 August 2026">
      <section>
        <h2>Overview</h2>
        <p>
          {siteConfig.company.legalName} operates {siteConfig.name}. This policy explains what
          personal information we collect, why we collect it, and how it is stored and shared. This
          document is a template and should be reviewed by a qualified legal adviser before launch.
        </p>
      </section>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email address and target score.</li>
          <li>Test data: responses, audio recordings for Speaking tasks, scores and timing.</li>
          <li>Purchase records: items bought, amounts and payment status.</li>
          <li>Technical data: device, browser and log information used to keep the service secure.</li>
        </ul>
      </section>
      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>To deliver practice tests and generate scores, feedback and progress reports.</li>
          <li>To provide customer support and respond to enquiries.</li>
          <li>To detect misuse and protect platform integrity.</li>
          <li>To improve question quality and scoring accuracy.</li>
        </ul>
      </section>
      <section>
        <h2>Automated processing</h2>
        <p>
          Responses may be processed by automated scoring systems and third-party AI services to
          generate scores and feedback. Automated results are indicative practice estimates and are
          not official PTE results.
        </p>
      </section>
      <section>
        <h2>Data storage and retention</h2>
        <p>
          Data is stored on infrastructure operated by our hosting provider. Test responses and
          recordings are retained while your account is active so that progress tracking remains
          accurate. You may request deletion of your account and associated data at any time.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal information by
          contacting {siteConfig.supportEmail}. We will respond within a reasonable period.
        </p>
      </section>
    </LegalPage>
  );
}
