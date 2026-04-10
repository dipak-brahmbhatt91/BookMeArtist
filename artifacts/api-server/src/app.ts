import express, { type Express } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import bcrypt from "bcryptjs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool, db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function ensureCoreTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "icon" text NOT NULL DEFAULT '',
        "created_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "artists" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "bio" text NOT NULL,
        "category_id" integer NOT NULL REFERENCES "categories"("id"),
        "location" text NOT NULL,
        "profile_image" text NOT NULL DEFAULT '',
        "portfolio_images" jsonb NOT NULL DEFAULT '[]',
        "base_price" numeric(10,2) NOT NULL,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "review_count" integer NOT NULL DEFAULT 0,
        "featured" boolean NOT NULL DEFAULT false,
        "tags" jsonb NOT NULL DEFAULT '[]',
        "packages" jsonb NOT NULL DEFAULT '[]',
        "availability" text NOT NULL DEFAULT 'available',
        "social_links" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'artist',
        "artist_id" integer REFERENCES "artists"("id") ON DELETE SET NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" serial PRIMARY KEY,
        "artist_id" integer NOT NULL REFERENCES "artists"("id") ON DELETE CASCADE,
        "client_name" text NOT NULL,
        "client_email" text NOT NULL,
        "event_date" text NOT NULL,
        "event_type" text NOT NULL,
        "package_name" text NOT NULL DEFAULT '',
        "budget" numeric(10,2) NOT NULL,
        "brief" text NOT NULL DEFAULT '',
        "location" text NOT NULL DEFAULT '',
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    // Defensive column additions
    await pool.query(`
      ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL DEFAULT '';
    `);

    // Indexes for foreign keys and frequent query columns
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_artists_category_id ON artists(category_id);
      CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
      CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON bookings(artist_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    logger.info("Core tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure core tables");
  }
}

async function ensureSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure session table");
  }
}

async function ensureAdminUser() {
  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, "admin"))
      .limit(1);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("admin123", 12);
      await db.insert(usersTable).values({
        username: "admin",
        passwordHash,
        role: "superadmin",
        artistId: null,
      });
      logger.info("Admin user created");
    } else {
      // Migrate: if the seeded admin account is still "admin" role, promote to superadmin
      await pool.query(`
        UPDATE "users" SET "role" = 'superadmin' WHERE "username" = 'admin' AND "role" = 'admin'
      `);
    }
  } catch (err) {
    logger.error({ err }, "Failed to ensure admin user");
  }
}

async function ensureApplicationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "applications" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "specialty" text NOT NULL,
        "category_id" integer REFERENCES "categories"("id") ON DELETE SET NULL,
        "location" text NOT NULL DEFAULT '',
        "bio" text NOT NULL,
        "instagram" text NOT NULL DEFAULT '',
        "message" text NOT NULL DEFAULT '',
        "application_type" text NOT NULL DEFAULT 'new_artist',
        "claimed_artist_id" integer REFERENCES "artists"("id") ON DELETE SET NULL,
        "linked_artist_id" integer REFERENCES "artists"("id") ON DELETE SET NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "category_id" integer REFERENCES "categories"("id") ON DELETE SET NULL;
      ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "application_type" text NOT NULL DEFAULT 'new_artist';
      ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "claimed_artist_id" integer REFERENCES "artists"("id") ON DELETE SET NULL;
      ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "linked_artist_id" integer REFERENCES "artists"("id") ON DELETE SET NULL;
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure applications table");
  }
}

async function ensureSiteContentTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "site_content" (
        "key" text PRIMARY KEY,
        "label" text NOT NULL,
        "section" text NOT NULL,
        "type" text NOT NULL DEFAULT 'text',
        "value" jsonb NOT NULL DEFAULT '""',
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure site_content table");
  }
}

async function ensureDefaultContent() {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM site_content`);
    if (parseInt(rows[0].count) > 0) return;

    const defaults = [
      { key: "site.name",           label: "Site Name",                      section: "site_info",     type: "text",       value: JSON.stringify("BookMeArtist") },
      { key: "site.tagline",        label: "Tagline",                        section: "site_info",     type: "text",       value: JSON.stringify("The new standard for creative bookings") },
      { key: "site.contact_email",  label: "Contact Email",                  section: "site_info",     type: "text",       value: JSON.stringify("hello@bookmeartist.com") },
      { key: "site.footer_text",    label: "Footer Copyright Text",          section: "site_info",     type: "text",       value: JSON.stringify("© 2026 BookMeArtist. All rights reserved.") },
      { key: "hero.badge_text",          label: "Hero Badge Text",           section: "hero",          type: "text",       value: JSON.stringify("The new standard for creative bookings") },
      { key: "hero.headline",            label: "Hero Headline",             section: "hero",          type: "text",       value: JSON.stringify("Book the World's Best Creators") },
      { key: "hero.subtitle",            label: "Hero Subtitle",             section: "hero",          type: "textarea",   value: JSON.stringify("Skip the agency fees. Connect directly with verified musicians, photographers, and performers for your next masterpiece.") },
      { key: "hero.search_placeholder",  label: "Search Placeholder Text",  section: "hero",          type: "text",       value: JSON.stringify("E.g. 'Wedding Photographer in NYC'") },
      { key: "hero.cta_text",            label: "Hero CTA Button Text",     section: "hero",          type: "text",       value: JSON.stringify("Explore Now") },
      { key: "trusted_by.label",    label: "Trusted By Strip Label",         section: "trusted_by",    type: "text",       value: JSON.stringify("Trusted by innovative creators at") },
      { key: "trusted_by.brands",   label: "Brand Names (one per line)",     section: "trusted_by",    type: "json_brands",value: JSON.stringify(["Spotify","Netflix","Vogue","SXSW","RedBull"]) },
      { key: "how_it_works.heading",    label: "Section Heading",            section: "how_it_works",  type: "text",       value: JSON.stringify("How It Works") },
      { key: "how_it_works.subheading", label: "Section Subheading",        section: "how_it_works",  type: "text",       value: JSON.stringify("From initial spark to final applause in three simple steps.") },
      { key: "how_it_works.step_1", label: "Step 1",                         section: "how_it_works",  type: "json_step",  value: JSON.stringify({ num: "01", title: "Find the Vibe",   desc: "Search portfolios, compare transparent pricing, and read verified reviews." }) },
      { key: "how_it_works.step_2", label: "Step 2",                         section: "how_it_works",  type: "json_step",  value: JSON.stringify({ num: "02", title: "Send the Brief",  desc: "Outline your vision, budget, and dates directly to the artist's dashboard." }) },
      { key: "how_it_works.step_3", label: "Step 3",                         section: "how_it_works",  type: "json_step",  value: JSON.stringify({ num: "03", title: "Make Magic",      desc: "Once accepted, collaborate closely and watch your creative project come to life." }) },
      { key: "artist_cta.heading",     label: "CTA Heading",                 section: "artist_cta",    type: "text",       value: JSON.stringify("Are you a creator?") },
      { key: "artist_cta.description", label: "CTA Description",            section: "artist_cta",    type: "textarea",   value: JSON.stringify("Join thousands of artists managing their bookings, payments, and client relationships all in one place.") },
      { key: "artist_cta.button_text", label: "CTA Button Text",            section: "artist_cta",    type: "text",       value: JSON.stringify("Apply as Artist") },
    ];

    for (const item of defaults) {
      await pool.query(
        `INSERT INTO site_content (key, label, section, type, value) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (key) DO NOTHING`,
        [item.key, item.label, item.section, item.type, item.value]
      );
    }
    logger.info("Default site content seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed default content");
  }
}

// ---------------------------------------------------------------------------
// Versioned migration system
// Each migration runs exactly once. Version numbers are permanent — never
// renumber or delete a migration. To change data, add a new migration.
// ---------------------------------------------------------------------------

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version   integer PRIMARY KEY,
      description text NOT NULL,
      applied_at  timestamp NOT NULL DEFAULT now()
    )
  `);
  // Bootstrap: if categories already exist but no migration is recorded,
  // the old ensureSeedData already ran — mark v1 as applied so it doesn't re-run.
  const { rows: cats } = await pool.query(`SELECT COUNT(*) FROM categories`);
  if (parseInt(cats[0].count) > 0) {
    await pool.query(`
      INSERT INTO schema_migrations (version, description)
      VALUES (1, 'Initial seed data (bootstrapped from pre-migration deployment)')
      ON CONFLICT (version) DO NOTHING
    `);
  }
}

async function migration001InitialSeed() {
  await pool.query(`
    INSERT INTO categories (name, slug, icon) VALUES
    ('Music', 'music', '🎵'),
    ('Photography', 'photography', '📸'),
    ('Painting', 'painting', '🎨'),
    ('Dance', 'dance', '💃'),
    ('Comedy', 'comedy', '🎭'),
    ('DJ', 'dj', '🎧'),
    ('Tattoo', 'tattoo', '🖊️'),
    ('Poetry', 'poetry', '📝')
  `);

  await pool.query(`
    INSERT INTO artists (name, bio, category_id, location, profile_image, portfolio_images, base_price, rating, review_count, featured, tags, packages, availability, social_links) VALUES
    ('Priya Sharma', 'Award-winning vocalist with a soulful Bollywood-classical fusion sound. Priya has performed at major venues across India and Southeast Asia, bringing emotion and artistry to every performance.', 1, 'Mumbai, Maharashtra', 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=500&q=80', '["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80","https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=800&q=80"]', 42000.00, 4.90, 87, true, '["bollywood","classical","ghazal","live performance","weddings"]', '[{"name":"Solo Set","price":42000,"duration":"45 min","description":"45-minute acoustic performance, perfect for intimate events"},{"name":"Full Band","price":125000,"duration":"2 hours","description":"2-hour full band performance with sound system"}]', 'available', '{"website":"https://priyasharmamusic.in","instagram":"@priyasharmamusic"}'),
    ('Rahul Kapoor', 'Commercial and editorial photographer with 10+ years of experience capturing life''s most beautiful moments. Specialising in portraits, weddings, and brand campaigns across India.', 2, 'Bengaluru, Karnataka', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', '["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80","https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"]', 67000.00, 4.80, 124, true, '["portrait","wedding","editorial","brand","commercial"]', '[{"name":"Portrait Session","price":67000,"duration":"2 hours","description":"2-hour portrait session with 30 edited photos"},{"name":"Wedding Day","price":291000,"duration":"8 hours","description":"Full day wedding coverage with 500+ edited photos"}]', 'busy', '{"website":"https://rahulkapoor.in","instagram":"@rahulkapoorvisuals"}'),
    ('Meera Arts Studio', 'Contemporary abstract painter known for vibrant, large-scale murals and canvas works. Meera creates one-of-a-kind pieces that transform spaces and tell stories.', 3, 'Delhi, NCR', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80', '["https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&q=80","https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80"]', 100000.00, 5.00, 43, true, '["abstract","mural","canvas","installation","contemporary"]', '[{"name":"Canvas Piece","price":100000,"duration":"2-3 weeks","description":"Custom painted canvas (24x36 inches), ready to hang"},{"name":"Medium Mural","price":374000,"duration":"3-5 days","description":"Wall mural up to 100 sq ft, includes materials"}]', 'available', '{"website":"https://meeraarts.in","instagram":"@meeraartsstudio"}'),
    ('Arjun Nair', 'Bharatanatyam and Bollywood dance choreographer and performer with 15 years of stage experience.', 4, 'Chennai, Tamil Nadu', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=500&q=80', '["https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800&q=80"]', 50000.00, 4.70, 62, false, '["bharatanatyam","bollywood","choreography","corporate events","weddings"]', '[{"name":"Solo Performance","price":50000,"duration":"15 min","description":"15-minute solo dance performance"}]', 'available', '{"instagram":"@arjunnair_dance"}'),
    ('Sapna Mehta', 'Stand-up comedian and emcee who brings laughter to corporate events, weddings, and private parties across India.', 5, 'Pune, Maharashtra', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80', '["https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80"]', 62500.00, 4.90, 38, false, '["stand-up","emcee","corporate","clean comedy","weddings"]', '[{"name":"Opening Act","price":62500,"duration":"20 min","description":"20-minute stand-up set to warm up the crowd"}]', 'available', '{"website":"https://sapnamehta.in","instagram":"@sapnamehta_comedy"}'),
    ('DJ Dhruv', 'World-class DJ and music producer with residencies at top venues in Goa, Mumbai, and Dubai.', 6, 'Goa', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=500&q=80', '["https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80"]', 83000.00, 4.60, 95, true, '["house","techno","commercial","club","wedding DJ","festivals"]', '[{"name":"Club Night","price":83000,"duration":"4 hours","description":"4-hour DJ set with full setup"}]', 'busy', '{"website":"https://djdhruv.in","instagram":"@djdhruv"}'),
    ('Ink by Kavya', 'Professional tattoo artist specialising in fine-line, botanical, and geometric designs.', 7, 'Bengaluru, Karnataka', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&q=80', '["https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80"]', 17000.00, 5.00, 156, false, '["fine-line","botanical","geometric","black & grey","custom"]', '[{"name":"Small Piece","price":17000,"duration":"1-2 hours","description":"Small tattoo under 3 inches"}]', 'available', '{"website":"https://inkbykavya.in","instagram":"@inkbykavya"}'),
    ('Vivek Verse', 'Published poet and spoken word performer whose words ignite emotions and spark conversations.', 8, 'Kolkata, West Bengal', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', '["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"]', 25000.00, 4.80, 29, false, '["spoken word","custom poems","weddings","corporate","motivational"]', '[{"name":"Custom Poem","price":25000,"duration":"Delivery in 5 days","description":"A personalised written poem for any occasion"}]', 'available', '{"website":"https://vivekverse.in","instagram":"@vivekverse"}'),
    ('Raaga Strings', 'Classically trained violinist and leader of the Raaga String Quartet. Trained at the Shanmukhananda Music Academy, Mumbai.', 1, 'Mumbai, Maharashtra', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&q=80', '["https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80"]', 75000.00, 4.90, 71, true, '["classical","string quartet","violin","wedding","gala","corporate"]', '[{"name":"Solo Violin","price":75000,"duration":"1 hour","description":"Elegant solo violin performance"}]', 'available', '{"website":"https://raagastrings.in","instagram":"@raagastrings"}'),
    ('Asha Lens', 'Cinematic videographer and documentary filmmaker with credits on Netflix and Amazon Prime India.', 2, 'Hyderabad, Telangana', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', '["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80"]', 116000.00, 4.80, 53, true, '["cinematography","wedding film","documentary","drone","brand video"]', '[{"name":"Highlight Reel","price":116000,"duration":"Half day","description":"4-hour shoot with a cinematic 3-5 min highlight film"}]', 'available', '{"website":"https://ashalens.in","instagram":"@ashalens"}'),
    ('Nisha Bloom', 'Floral installation artist and event designer whose immersive environments have graced magazine covers across India.', 3, 'Jaipur, Rajasthan', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&q=80', '["https://images.unsplash.com/photo-1487530811015-780780169993?w=800&q=80"]', 208000.00, 5.00, 28, true, '["floral installation","event design","wedding","luxury","botanicals"]', '[{"name":"Signature Arch","price":208000,"duration":"1 day setup","description":"Custom floral arch or focal piece"}]', 'available', '{"website":"https://nishabloom.in","instagram":"@nishabloomdesigns"}')
  `);

  await pool.query(`
    INSERT INTO bookings (artist_id, client_name, client_email, event_date, event_type, package_name, budget, brief, location, status) VALUES
    (1,'Ananya Singh','ananya.singh@gmail.com','2026-04-15','Wedding Reception','Full Band',125000.00,'Looking for a vocalist for our wedding reception. Approximately 80 guests.','The Leela Palace, New Delhi','completed'),
    (1,'Vikram Mehta','vikram.mehta@gmail.com','2026-05-02','Corporate Gala','Solo Set',41500.00,'Annual company dinner, approx 150 attendees.','ITC Grand Bharat, Gurugram','accepted'),
    (2,'Riya Sharma','riya.sharma@gmail.com','2026-06-20','Wedding','Wedding Day',291000.00,'Outdoor garden wedding, 120 guests.','Taj Falaknuma Palace, Hyderabad','accepted'),
    (3,'Priya Patel','priya.patel@outlook.com','2026-05-18','Restaurant Opening','Medium Mural',374000.00,'Opening a new Indian fusion restaurant in Bandra.','Bandra West, Mumbai','accepted'),
    (6,'Nikhil Joshi','n.joshi@techventures.io','2026-04-28','Company Launch Party','Club Night',83000.00,'Tech startup launching our new product. 300 guests.','KTPO Convention Centre, Bengaluru','accepted'),
    (4,'Pooja Nair','p.nair@eventpros.co','2026-07-04','Summer Festival','Solo Performance',208000.00,'Cultural festival celebrating Indian classical heritage.','Music Academy, Chennai','pending'),
    (1,'Shruti Patel','shruti.patel@eventplanning.com','2026-10-05','Charity Gala','Full Band',125000.00,'Annual fundraiser for our children''s hospital foundation.','Taj Lands End, Mumbai','pending')
  `);
}

// Add future migrations below — never edit or renumber existing ones.

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function migration002GenerateSlugs() {
  const { rows } = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM artists WHERE slug = '' ORDER BY id`
  );
  for (const artist of rows) {
    let slug = toSlug(artist.name);
    // ensure uniqueness — append id if slug already taken
    const { rows: existing } = await pool.query(
      `SELECT 1 FROM artists WHERE slug = $1 AND id != $2`,
      [slug, artist.id]
    );
    if (existing.length > 0) slug = `${slug}-${artist.id}`;
    await pool.query(`UPDATE artists SET slug = $1 WHERE id = $2`, [slug, artist.id]);
  }
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const migrations: Array<{ version: number; description: string; run: () => Promise<void> }> = [
      { version: 1, description: 'Initial seed data',              run: migration001InitialSeed },
      { version: 2, description: 'Generate slugs for all artists', run: migration002GenerateSlugs },
    ];

    for (const m of migrations) {
      const { rows } = await pool.query(
        `SELECT 1 FROM schema_migrations WHERE version = $1`, [m.version]
      );
      if (rows.length > 0) continue; // already applied — skip
      logger.info(`Applying migration ${m.version}: ${m.description}`);
      await m.run();
      await pool.query(
        `INSERT INTO schema_migrations (version, description) VALUES ($1, $2)`,
        [m.version, m.description]
      );
      logger.info(`Migration ${m.version} applied`);
    }
  } catch (err) {
    logger.error({ err }, "Migration runner failed");
  }
}

async function ensureBlogPostsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "excerpt" text NOT NULL DEFAULT '',
        "content" text NOT NULL DEFAULT '',
        "featured_image" text NOT NULL DEFAULT '',
        "author" text NOT NULL DEFAULT 'BookMeArtist Team',
        "author_bio" text NOT NULL DEFAULT '',
        "category" text NOT NULL DEFAULT 'general',
        "tags" jsonb NOT NULL DEFAULT '[]',
        "status" text NOT NULL DEFAULT 'draft',
        "meta_title" text NOT NULL DEFAULT '',
        "meta_description" text NOT NULL DEFAULT '',
        "og_image" text NOT NULL DEFAULT '',
        "canonical_url" text NOT NULL DEFAULT '',
        "noindex" boolean NOT NULL DEFAULT false,
        "reading_time" integer NOT NULL DEFAULT 0,
        "published_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    // Defensive: add any columns that may be missing if table already existed
    await pool.query(`
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "excerpt" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "content" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "featured_image" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author" text NOT NULL DEFAULT 'BookMeArtist Team';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author_bio" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT 'general';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "tags" jsonb NOT NULL DEFAULT '[]';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'draft';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_title" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_description" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "og_image" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "canonical_url" text NOT NULL DEFAULT '';
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "noindex" boolean NOT NULL DEFAULT false;
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "reading_time" integer NOT NULL DEFAULT 0;
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "published_at" timestamp;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
    `);

    logger.info("Blog posts table ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure blog_posts table");
    throw err; // re-throw so startup fails loudly if table cannot be created
  }
}

async function withRetry<T>(fn: () => Promise<T>, name: string, maxAttempts = 8, delayMs = 5000): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkErr = err?.code === "EAI_AGAIN" || err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT";
      if (isNetworkErr && attempt < maxAttempts) {
        logger.warn({ attempt, name }, `DB not reachable, retrying in ${delayMs / 1000}s...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error(`${name} failed after ${maxAttempts} attempts`);
}

await withRetry(ensureCoreTables, "ensureCoreTables");
await withRetry(ensureSessionTable, "ensureSessionTable");
await withRetry(ensureApplicationsTable, "ensureApplicationsTable");
await withRetry(ensureSiteContentTable, "ensureSiteContentTable");
await withRetry(ensureBlogPostsTable, "ensureBlogPostsTable");
await withRetry(runMigrations, "runMigrations");
await withRetry(ensureDefaultContent, "ensureDefaultContent");
await withRetry(ensureAdminUser, "ensureAdminUser");

const PgSession = connectPgSimple(session);

const app: Express = express();

app.set("trust proxy", true);

app.use(helmet({
  contentSecurityPolicy: false,      // CSP would break inline scripts/styles in the SPA
  crossOriginEmbedderPolicy: false,  // needed for Unsplash images and external assets
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set in production");
}
const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-local-only";
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";

app.use(cors({
  origin: isProduction ? allowedOrigin : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically from the "uploads" directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  session({
    proxy: true,
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    name: "bma.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
  }),
);

app.use("/api", router);

// Global error handler — catches unhandled errors from all routes
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled request error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

if (isProduction) {
  const frontendDist = path.join(process.cwd(), "artifacts/bookmeartist/dist/public");
  const indexHtml = path.join(frontendDist, "index.html");
  logger.info({ frontendDist, cwd: process.cwd() }, "Serving frontend static files");
  app.use(express.static(frontendDist));
  app.use((_req, res, next) => {
    res.sendFile(indexHtml, (err) => { if (err) next(err); });
  });
}

export default app;
