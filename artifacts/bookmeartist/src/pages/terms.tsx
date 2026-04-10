import { PageSeo } from "@/components/page-seo";

export default function Terms() {
  return (
    <>
      <PageSeo
        title="Terms of Service"
        description="Read the BookMeArtist Terms of Service — the rules and guidelines governing use of our platform to discover and book creative talent across India."
        canonical="/terms"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-invert prose-base max-w-none
          prose-headings:font-display prose-headings:text-white
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white"
        >
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using BookMeArtist ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
          </p>

          <h2>2. What We Do</h2>
          <p>
            BookMeArtist is a discovery and booking platform that connects clients with independent creative artists across India — including musicians, photographers, dancers, and performers. We facilitate introductions and enquiries; we are not a party to the contract between client and artist.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            Artist accounts are created by BookMeArtist administrators after manual verification. You are responsible for keeping your login credentials secure. You must notify us immediately of any unauthorised use of your account.
          </p>

          <h2>4. Bookings and Payments</h2>
          <p>
            Booking requests submitted through the Platform are enquiries, not confirmed bookings. Final pricing, terms, and payment are agreed directly between the client and the artist. BookMeArtist does not process payments and is not liable for any financial disputes between parties.
          </p>

          <h2>5. Artist Profiles</h2>
          <p>
            Artist profiles are created and maintained by BookMeArtist. If you are an artist and wish to claim, update, or remove your profile, please use the "Request a Review" link on your profile page or contact us directly.
          </p>

          <h2>6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit false or misleading booking requests</li>
            <li>Scrape, copy, or redistribute artist profile data without permission</li>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorised access to any part of the Platform</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            All content on the Platform — including artist profiles, images, and copy — is owned by BookMeArtist or the respective rights holders. You may not reproduce or distribute any content without prior written consent.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            BookMeArtist provides the Platform "as is" and makes no warranties regarding availability or accuracy. To the fullest extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the Platform.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            For any questions regarding these Terms, please contact us at <a href="mailto:hello@bookmeartist.com">hello@bookmeartist.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
