import { PageSeo } from "@/components/page-seo";

export default function Privacy() {
  return (
    <>
      <PageSeo
        title="Privacy Policy"
        description="Learn how BookMeArtist collects, uses, and protects your personal data in accordance with applicable Indian privacy laws."
        canonical="/privacy"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-invert prose-base max-w-none
          prose-headings:font-display prose-headings:text-white
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white"
        >
          <h2>1. Who We Are</h2>
          <p>
            BookMeArtist ("we", "us") operates the website <strong>www.bookmeartist.com</strong>, a platform to discover and book creative talent across India.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          <ul>
            <li><strong>Booking enquiries</strong> — name, email, event details, and message you provide when submitting a booking request.</li>
            <li><strong>Artist applications and profile claims</strong> — name, email, social profile links, and any supporting information you submit.</li>
            <li><strong>Account data</strong> — username and hashed password for artist accounts created by us.</li>
            <li><strong>Usage data</strong> — standard server logs (IP address, browser type, pages visited) for security and analytics.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To facilitate booking enquiries between clients and artists</li>
            <li>To review and process artist profile claim requests</li>
            <li>To send transactional emails related to your enquiry</li>
            <li>To maintain and improve the Platform</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>4. Cookies</h2>
          <p>
            We use a single session cookie (<code>bma.sid</code>) to keep you logged in if you have an artist account. This cookie is essential for the service and is deleted when your session ends. We do not use advertising or tracking cookies.
          </p>

          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with:
          </p>
          <ul>
            <li><strong>Artists</strong> — your booking enquiry details are shared with the artist you contact.</li>
            <li><strong>Service providers</strong> — our hosting and database providers (Render, Neon) who process data on our behalf under strict data protection agreements.</li>
            <li><strong>Legal authorities</strong> — where required by law.</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            Booking enquiry data is retained for up to 2 years. Account data is retained while the account is active. You may request deletion at any time.
          </p>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:hello@bookmeartist.com">hello@bookmeartist.com</a>.</p>

          <h2>8. Security</h2>
          <p>
            We use HTTPS encryption, secure session cookies, and hashed passwords to protect your data. No system is 100% secure, but we take reasonable precautions to safeguard your information.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. The "last updated" date at the top of this page will reflect any changes.
          </p>

          <h2>10. Contact</h2>
          <p>
            For any privacy-related questions, contact us at <a href="mailto:hello@bookmeartist.com">hello@bookmeartist.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
