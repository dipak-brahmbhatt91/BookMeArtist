import express, { type Express } from "express";
import path from "path";
import cors from "cors";
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

async function ensureSeedData() {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM categories`);
    if (parseInt(rows[0].count) > 0) return;

    logger.info("Seeding database with initial data...");

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
      ('Sofia Reyes', 'Award-winning vocalist and songwriter with a soulful jazz-pop fusion sound. Sofia has performed at major venues across North America and Europe, bringing emotion and artistry to every performance.', 1, 'New York, NY', 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=500&q=80', '["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80","https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=800&q=80"]', 500.00, 4.90, 87, true, '["jazz","soul","pop","live performance","weddings"]', '[{"name":"Solo Set","price":500,"duration":"45 min","description":"45-minute acoustic performance, perfect for intimate events"},{"name":"Full Band","price":1500,"duration":"2 hours","description":"2-hour full band performance with sound system"}]', 'available', '{"website":"https://sofiareyes.com","instagram":"@sofiareyesmusic"}'),
      ('Marco Visuals', 'Commercial and editorial photographer with 10+ years of experience capturing life''s most beautiful moments. Specializing in portraits, weddings, and brand campaigns.', 2, 'Los Angeles, CA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', '["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80","https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"]', 800.00, 4.80, 124, true, '["portrait","wedding","editorial","brand","commercial"]', '[{"name":"Portrait Session","price":800,"duration":"2 hours","description":"2-hour portrait session with 30 edited photos"},{"name":"Wedding Day","price":3500,"duration":"8 hours","description":"Full day wedding coverage with 500+ edited photos"}]', 'busy', '{"website":"https://marcovisuals.com","instagram":"@marcovisuals"}'),
      ('Luna Art Studio', 'Contemporary abstract painter known for vibrant, large-scale murals and canvas works. Luna creates one-of-a-kind pieces that transform spaces and tell stories.', 3, 'Miami, FL', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80', '["https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&q=80","https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80"]', 1200.00, 5.00, 43, true, '["abstract","mural","canvas","installation","contemporary"]', '[{"name":"Canvas Piece","price":1200,"duration":"2-3 weeks","description":"Custom painted canvas (24x36 inches), ready to hang"},{"name":"Medium Mural","price":4500,"duration":"3-5 days","description":"Wall mural up to 100 sq ft, includes materials"}]', 'available', '{"website":"https://lunaart.studio","instagram":"@lunaart"}'),
      ('Carlos Rivera', 'Latin and hip-hop dance choreographer and performer with 15 years of stage experience.', 4, 'Chicago, IL', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=500&q=80', '["https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800&q=80"]', 600.00, 4.70, 62, false, '["latin","hip-hop","choreography","corporate events","weddings"]', '[{"name":"Solo Performance","price":600,"duration":"15 min","description":"15-minute solo dance performance"}]', 'available', '{"instagram":"@carlosrivera_dance"}'),
      ('Jade Thompson', 'Stand-up comedian and emcee who brings laughter to corporate events, weddings, and private parties.', 5, 'Austin, TX', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80', '["https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80"]', 750.00, 4.90, 38, false, '["stand-up","emcee","corporate","clean comedy","weddings"]', '[{"name":"Opening Act","price":750,"duration":"20 min","description":"20-minute stand-up set to warm up the crowd"}]', 'available', '{"website":"https://jadethompson.com","instagram":"@jadethompsoncomedy"}'),
      ('DJ Phantom', 'World-class DJ and music producer with residencies at top clubs in Ibiza, Las Vegas, and New York.', 6, 'Las Vegas, NV', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=500&q=80', '["https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80"]', 1000.00, 4.60, 95, true, '["house","techno","commercial","club","wedding DJ","festivals"]', '[{"name":"Club Night","price":1000,"duration":"4 hours","description":"4-hour DJ set with full setup"}]', 'busy', '{"website":"https://djphantom.com","instagram":"@djphantom"}'),
      ('Ink by Maya', 'Professional tattoo artist specializing in fine-line, botanical, and geometric designs.', 7, 'Portland, OR', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&q=80', '["https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80"]', 200.00, 5.00, 156, false, '["fine-line","botanical","geometric","black & grey","custom"]', '[{"name":"Small Piece","price":200,"duration":"1-2 hours","description":"Small tattoo under 3 inches"}]', 'available', '{"website":"https://inkbymaya.art","instagram":"@inkbymaya"}'),
      ('Victor Verse', 'Published poet and spoken word performer whose words ignite emotions and spark conversations.', 8, 'San Francisco, CA', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', '["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"]', 300.00, 4.80, 29, false, '["spoken word","custom poems","weddings","corporate","motivational"]', '[{"name":"Custom Poem","price":300,"duration":"Delivery in 5 days","description":"A personalized written poem for any occasion"}]', 'available', '{"website":"https://victorverse.com","instagram":"@victorverse"}'),
      ('Aria Strings', 'Classically trained violinist and leader of the Aria String Quartet. Educated at Juilliard.', 1, 'Boston, MA', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&q=80', '["https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80"]', 900.00, 4.90, 71, true, '["classical","string quartet","violin","wedding","gala","corporate"]', '[{"name":"Solo Violin","price":900,"duration":"1 hour","description":"Elegant solo violin performance"}]', 'available', '{"website":"https://ariastrings.com","instagram":"@ariastringsquartet"}'),
      ('Zara Flash', 'Cinematic videographer and documentary filmmaker with credits on Netflix and HBO.', 2, 'Brooklyn, NY', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', '["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80"]', 1400.00, 4.80, 53, true, '["cinematography","wedding film","documentary","drone","brand video"]', '[{"name":"Highlight Reel","price":1400,"duration":"Half day","description":"4-hour shoot with a cinematic 3-5 min highlight film"}]', 'available', '{"website":"https://zaraflash.film","instagram":"@zaraflash"}'),
      ('Nadia Bloom', 'Floral installation artist and event designer whose immersive environments have graced magazine covers.', 3, 'Nashville, TN', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&q=80', '["https://images.unsplash.com/photo-1487530811015-780780169993?w=800&q=80"]', 2500.00, 5.00, 28, true, '["floral installation","event design","wedding","luxury","botanicals"]', '[{"name":"Signature Arch","price":2500,"duration":"1 day setup","description":"Custom floral arch or focal piece"}]', 'available', '{"website":"https://nadiabloom.co","instagram":"@nadiabloomdesigns"}')
    `);

    await pool.query(`
      INSERT INTO bookings (artist_id, client_name, client_email, event_date, event_type, package_name, budget, brief, location, status) VALUES
      (1,'Emily Johnson','emily@example.com','2026-04-15','Wedding Reception','Full Band',1500.00,'Looking for a vocalist for our wedding reception. Approximately 80 guests.','The Grand Ballroom, New York, NY','completed'),
      (1,'David Chen','david@example.com','2026-05-02','Corporate Gala','Solo Set',500.00,'Annual company dinner, approx 150 attendees.','Midtown Conference Center, NY','accepted'),
      (2,'Sarah Williams','sarah@example.com','2026-06-20','Wedding','Wedding Day',3500.00,'Outdoor garden wedding, 120 guests.','Rose Garden Estate, Malibu, CA','accepted'),
      (3,'Priya Patel','priya.patel@outlook.com','2026-05-18','Restaurant Opening','Medium Mural',4500.00,'Opening a new Mediterranean restaurant in Miami.','Coral Gables, FL','accepted'),
      (6,'James Okafor','j.okafor@techventures.io','2026-04-28','Company Launch Party','Club Night',1000.00,'Tech startup launching our new product. 300 guests.','Las Vegas, NV','accepted'),
      (4,'Rachel Kim','r.kim@eventpros.co','2026-07-04','Summer Festival','Group Choreography',2500.00,'Cultural festival celebrating Latin heritage.','Chicago, IL','pending'),
      (1,'Natalie Ross','natalie.ross@eventplanning.com','2026-10-05','Charity Gala','Full Band',1500.00,'Annual fundraiser for our children hospital foundation.','New York, NY','pending')
    `);

    logger.info("Database seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
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
    logger.info("Blog posts table ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure blog_posts table");
    throw err; // re-throw so startup fails loudly if table cannot be created
  }
}

await ensureCoreTables();
await ensureSessionTable();
await ensureApplicationsTable();
await ensureSiteContentTable();
await ensureBlogPostsTable();
await ensureSeedData();
await ensureDefaultContent();
await ensureAdminUser();

const PgSession = connectPgSimple(session);

const app: Express = express();

app.set("trust proxy", true);

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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically from the "uploads" directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const isProduction = process.env.NODE_ENV === "production";

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

if (isProduction) {
  const frontendDist = path.join(process.cwd(), "artifacts/bookmeartist/dist");
  const indexHtml = path.join(frontendDist, "index.html");
  app.use(express.static(frontendDist));
  app.use((_req, res, next) => {
    res.sendFile(indexHtml, (err) => { if (err) next(err); });
  });
}

export default app;
