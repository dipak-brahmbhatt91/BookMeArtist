import { db } from "@workspace/db";
import { categoriesTable, artistsTable, bookingsTable } from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  await db.delete(bookingsTable);
  await db.delete(artistsTable);
  await db.delete(categoriesTable);

  const categories = await db
    .insert(categoriesTable)
    .values([
      { name: "Music", slug: "music", icon: "🎵" },
      { name: "Photography", slug: "photography", icon: "📸" },
      { name: "Painting", slug: "painting", icon: "🎨" },
      { name: "Dance", slug: "dance", icon: "💃" },
      { name: "Comedy", slug: "comedy", icon: "🎭" },
      { name: "DJ", slug: "dj", icon: "🎧" },
      { name: "Tattoo", slug: "tattoo", icon: "🖊️" },
      { name: "Poetry", slug: "poetry", icon: "📝" },
    ])
    .returning();

  const musicId = categories.find((c) => c.slug === "music")!.id;
  const photoId = categories.find((c) => c.slug === "photography")!.id;
  const paintId = categories.find((c) => c.slug === "painting")!.id;
  const danceId = categories.find((c) => c.slug === "dance")!.id;
  const comedyId = categories.find((c) => c.slug === "comedy")!.id;
  const djId = categories.find((c) => c.slug === "dj")!.id;
  const tattooId = categories.find((c) => c.slug === "tattoo")!.id;
  const poetryId = categories.find((c) => c.slug === "poetry")!.id;

  const artists = await db
    .insert(artistsTable)
    .values([
      {
        name: "Sofia Reyes",
        bio: "Award-winning vocalist and songwriter with a soulful jazz-pop fusion sound. Sofia has performed at major venues across North America and Europe, bringing emotion and artistry to every performance. Her voice has been described as 'a warm summer evening that lingers long after the last note fades.'",
        categoryId: musicId,
        location: "New York, NY",
        profileImage: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
          "https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=800&q=80",
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
        ],
        basePrice: "500",
        rating: "4.9",
        reviewCount: 87,
        featured: true,
        tags: ["jazz", "soul", "pop", "live performance", "weddings"],
        packages: [
          { name: "Solo Set", description: "45-minute acoustic performance, perfect for intimate events", price: 500, duration: "45 min" },
          { name: "Full Band", description: "2-hour full band performance with sound system", price: 1500, duration: "2 hours" },
          { name: "Private Event", description: "Custom performance package for exclusive events", price: 3000, duration: "3 hours" },
        ],
        availability: "available",
        socialLinks: { instagram: "@sofiareyesmusic", website: "https://sofiaroyes.com" },
      },
      {
        name: "Marco Visuals",
        bio: "Commercial and editorial photographer with 10+ years of experience capturing life's most beautiful moments. Specializing in portraits, weddings, and brand campaigns. Marco's work has appeared in Vogue, National Geographic, and numerous international publications.",
        categoryId: photoId,
        location: "Los Angeles, CA",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
          "https://images.unsplash.com/photo-1537633468014-f89eb67dc685?w=800&q=80",
        ],
        basePrice: "800",
        rating: "4.8",
        reviewCount: 124,
        featured: true,
        tags: ["portrait", "wedding", "editorial", "brand", "commercial"],
        packages: [
          { name: "Portrait Session", description: "2-hour portrait session with 30 edited photos", price: 800, duration: "2 hours" },
          { name: "Wedding Day", description: "Full day wedding coverage with 500+ edited photos", price: 3500, duration: "8 hours" },
          { name: "Brand Campaign", description: "Commercial shoot with licensing and full editing suite", price: 5000, duration: "Full day" },
        ],
        availability: "busy",
        socialLinks: { instagram: "@marcovisuals", website: "https://marcovisuals.com" },
      },
      {
        name: "Luna Art Studio",
        bio: "Contemporary abstract painter known for vibrant, large-scale murals and canvas works. Luna creates one-of-a-kind pieces that transform spaces and tell stories. Her art has been commissioned for hotels, restaurants, corporate offices, and private collectors worldwide.",
        categoryId: paintId,
        location: "Miami, FL",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&q=80",
          "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        ],
        basePrice: "1200",
        rating: "5.0",
        reviewCount: 43,
        featured: true,
        tags: ["abstract", "mural", "canvas", "installation", "contemporary"],
        packages: [
          { name: "Canvas Piece", description: "Custom painted canvas (24x36 inches), ready to hang", price: 1200, duration: "2-3 weeks" },
          { name: "Medium Mural", description: "Wall mural up to 100 sq ft, includes materials", price: 4500, duration: "3-5 days" },
          { name: "Large Installation", description: "Large-scale installation or mural over 100 sq ft", price: 9000, duration: "1-2 weeks" },
        ],
        availability: "available",
        socialLinks: { instagram: "@lunaart", website: "https://lunaart.studio" },
      },
      {
        name: "Carlos Rivera",
        bio: "Latin and hip-hop dance choreographer and performer with 15 years of stage experience. Carlos has choreographed for major music videos, Broadway productions, and corporate events. His energetic performances leave audiences wanting more.",
        categoryId: danceId,
        location: "Chicago, IL",
        profileImage: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800&q=80",
          "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80",
        ],
        basePrice: "600",
        rating: "4.7",
        reviewCount: 62,
        featured: false,
        tags: ["latin", "hip-hop", "choreography", "corporate events", "weddings"],
        packages: [
          { name: "Solo Performance", description: "15-minute solo dance performance", price: 600, duration: "15 min" },
          { name: "Duo Show", description: "30-minute duo performance with a partner", price: 1000, duration: "30 min" },
          { name: "Group Choreography", description: "Full choreography session + performance with ensemble", price: 2500, duration: "3 hours" },
        ],
        availability: "available",
        socialLinks: { instagram: "@carlosrivera_dance", youtube: "carlosriverade" },
      },
      {
        name: "Jade Thompson",
        bio: "Stand-up comedian and emcee who brings laughter to corporate events, weddings, and private parties. Jade's clean, relatable humor works for diverse audiences. She's headlined comedy festivals across the US and appeared on major streaming platforms.",
        categoryId: comedyId,
        location: "Austin, TX",
        profileImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80",
          "https://images.unsplash.com/photo-1551818014-7c75b7d04af2?w=800&q=80",
        ],
        basePrice: "750",
        rating: "4.9",
        reviewCount: 38,
        featured: false,
        tags: ["stand-up", "emcee", "corporate", "clean comedy", "weddings"],
        packages: [
          { name: "Opening Act", description: "20-minute stand-up set to warm up the crowd", price: 750, duration: "20 min" },
          { name: "Headliner", description: "45-minute headliner set with Q&A", price: 1500, duration: "1 hour" },
          { name: "Full Event MC", description: "Full event emceeing and comedy throughout the evening", price: 3000, duration: "4 hours" },
        ],
        availability: "available",
        socialLinks: { instagram: "@jadethompsoncomedy", website: "https://jadethompson.com" },
      },
      {
        name: "DJ Phantom",
        bio: "World-class DJ and music producer with residencies at top clubs in Ibiza, Las Vegas, and New York. DJ Phantom specializes in house, techno, and commercial music, able to read any crowd and keep the energy at peak levels all night long.",
        categoryId: djId,
        location: "Las Vegas, NV",
        profileImage: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80",
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
        ],
        basePrice: "1000",
        rating: "4.6",
        reviewCount: 95,
        featured: true,
        tags: ["house", "techno", "commercial", "club", "wedding DJ", "festivals"],
        packages: [
          { name: "Club Night", description: "4-hour DJ set with full setup", price: 1000, duration: "4 hours" },
          { name: "Wedding Reception", description: "5-hour wedding reception with lighting", price: 2000, duration: "5 hours" },
          { name: "Festival Stage", description: "2-hour festival main-stage performance", price: 5000, duration: "2 hours" },
        ],
        availability: "busy",
        socialLinks: { instagram: "@djphantom", website: "https://djphantom.com" },
      },
      {
        name: "Ink by Maya",
        bio: "Professional tattoo artist specializing in fine-line, botanical, and geometric designs. Maya trained under renowned artists in Tokyo and Berlin, bringing a global perspective to her intricate, detailed work. Every piece is a collaboration between artist and client.",
        categoryId: tattooId,
        location: "Portland, OR",
        profileImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80",
          "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80",
        ],
        basePrice: "200",
        rating: "5.0",
        reviewCount: 156,
        featured: false,
        tags: ["fine-line", "botanical", "geometric", "black & grey", "custom"],
        packages: [
          { name: "Small Piece", description: "Small tattoo under 3 inches", price: 200, duration: "1-2 hours" },
          { name: "Medium Piece", description: "Medium tattoo 3-6 inches", price: 450, duration: "3-4 hours" },
          { name: "Full Sleeve Consultation", description: "Design consultation + first session for sleeve", price: 800, duration: "6 hours" },
        ],
        availability: "available",
        socialLinks: { instagram: "@inkbymaya", website: "https://inkbymaya.art" },
      },
      {
        name: "Victor Verse",
        bio: "Published poet and spoken word performer whose words ignite emotions and spark conversations. Victor has performed at TEDx, literary festivals, and corporate retreats. He crafts custom poems for weddings, anniversaries, and special occasions that become treasured keepsakes.",
        categoryId: poetryId,
        location: "San Francisco, CA",
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80",
        portfolioImages: [
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
          "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80",
        ],
        basePrice: "300",
        rating: "4.8",
        reviewCount: 29,
        featured: false,
        tags: ["spoken word", "custom poems", "weddings", "corporate", "motivational"],
        packages: [
          { name: "Custom Poem", description: "A personalized written poem for any occasion", price: 300, duration: "Delivery in 5 days" },
          { name: "Live Performance", description: "10-minute spoken word performance at your event", price: 600, duration: "10 min" },
          { name: "Workshop", description: "Poetry writing workshop for groups up to 20", price: 1500, duration: "2 hours" },
        ],
        availability: "available",
        socialLinks: { instagram: "@victorverse", website: "https://victorverse.com" },
      },
    ])
    .returning();

  const sofia = artists.find((a) => a.name === "Sofia Reyes")!;
  const marco = artists.find((a) => a.name === "Marco Visuals")!;

  await db.insert(bookingsTable).values([
    {
      artistId: sofia.id,
      clientName: "Emily Johnson",
      clientEmail: "emily@example.com",
      eventDate: "2026-04-15",
      eventType: "Wedding Reception",
      packageName: "Full Band",
      budget: "1500",
      brief: "We're looking for a vocalist for our wedding reception. Approximately 80 guests. We love jazz and soul music.",
      location: "The Grand Ballroom, New York, NY",
      status: "accepted",
    },
    {
      artistId: sofia.id,
      clientName: "David Chen",
      clientEmail: "david@example.com",
      eventDate: "2026-05-02",
      eventType: "Corporate Gala",
      packageName: "Solo Set",
      budget: "500",
      brief: "Annual company dinner, approx 150 attendees. Looking for elegant background music.",
      location: "Midtown Conference Center, NY",
      status: "pending",
    },
    {
      artistId: marco.id,
      clientName: "Sarah Williams",
      clientEmail: "sarah@example.com",
      eventDate: "2026-06-20",
      eventType: "Wedding",
      packageName: "Wedding Day",
      budget: "3500",
      brief: "Outdoor garden wedding, 120 guests. We'd love candid shots that capture the emotion of the day.",
      location: "Rose Garden Estate, Malibu, CA",
      status: "pending",
    },
  ]);

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
