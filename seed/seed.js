import bcrypt from "bcryptjs";
import User from "../models/User.js";
import SiteImage from "../models/SiteImage.js";
import SiteText from "../models/SiteText.js";
import Founder from "../models/Founder.js";
import Newsletter from "../models/Newsletter.js";

const DEFAULT_IMAGES = [
  { key: "site_logo", label: "GYSC Logo (Navbar & Footer)", section: "branding", url: "" },
  {
    key: "hero_background",
    label: "Hero Background Image",
    section: "home",
    url: "https://images.unsplash.com/photo-1561489413-985b06da5bee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
  },
  {
    key: "about_image",
    label: "About Section Image",
    section: "home",
    url: "https://images.unsplash.com/photo-1603478804503-dc909c7f5ce5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  },
];

const DEFAULT_TEXTS = [
  { key: "hero_eyebrow", label: "Hero — Top Label", section: "hero", value: "Global Youth Sustainability Council" },
  { key: "hero_line1", label: "Hero — Headline Line 1", section: "hero", value: "Young people." },
  { key: "hero_line2", label: "Hero — Headline Line 2", section: "hero", value: "Real policy." },
  { key: "hero_line3", label: "Hero — Headline Line 3", section: "hero", value: "Global impact." },
  {
    key: "hero_description",
    label: "Hero — Description",
    section: "hero",
    value: "GYSC unites delegates from every continent — turning youth conviction into policies that reach the highest levels of global governance.",
  },
  { key: "about_title", label: "About — Section Title", section: "about", value: "It started with a gathering in Korea." },
  {
    key: "about_quote",
    label: "About — Pull Quote",
    section: "about",
    value: "One shared conviction — youth deserve a permanent seat at the global policy table.",
  },
  {
    key: "about_p1",
    label: "About — Paragraph 1",
    section: "about",
    value: "In 2025, at a youth summit in South Korea, our co-founders joined a larger global cohort for five days of intensive dialogue. Together they helped shape a bold policy document — and laid the foundations for the Global Youth Sustainability Council.",
  },
  {
    key: "about_p2",
    label: "About — Paragraph 2",
    section: "about",
    value: "GYSC co-authored the Eunpyeong Declaration alongside peers from all corners of the world — a framework addressing education, climate, inequality, and institutional reform.",
  },
  {
    key: "about_p3",
    label: "About — Paragraph 3",
    section: "about",
    value: "Registered as a Canadian NGO, GYSC brings together members from different countries around the world — raising awareness, deepening engagement, and amplifying youth voices in global conversations.",
  },
  { key: "stat_1_n", label: "Stats — Founding Members Number", section: "stats", value: "9" },
  { key: "stat_1_label", label: "Stats — Founding Members Label", section: "stats", value: "Founding Members" },
  { key: "stat_2_n", label: "Stats — Countries Number", section: "stats", value: "95" },
  { key: "stat_2_label", label: "Stats — Policy Framework Label", section: "stats", value: "Page Policy Framework" },
  { key: "stat_3_n", label: "Stats — Countries Number", section: "stats", value: "14" },
  { key: "stat_3_label", label: "Stats — Countries Label", section: "stats", value: "Countries" },
  { key: "stat_4_n", label: "Stats — Declaration Number", section: "stats", value: "1" },
  { key: "stat_4_label", label: "Stats — Declaration Label", section: "stats", value: "Official Declaration" },
  { key: "pillars_title", label: "Our Work — Section Title", section: "pillars", value: "What we stand for" },
  { key: "pillars_desc", label: "Our Work — Description", section: "pillars", value: "Three pillars guiding youth-led policy, leadership, and sustainable action worldwide." },
  { key: "pillar_1_title", label: "Pillar 1 — Title (Policy)", section: "pillars", value: "Policy" },
  { key: "pillar_1_body", label: "Pillar 1 — Description", section: "pillars", value: "We advocate for youth-led policy recommendations in international frameworks and governmental processes." },
  { key: "pillar_2_title", label: "Pillar 2 — Title (Leadership)", section: "pillars", value: "Leadership" },
  { key: "pillar_2_body", label: "Pillar 2 — Description", section: "pillars", value: "We build awareness, create spaces for engagement, and empower young people to raise their voices at local, national, and international levels." },
  { key: "pillar_3_title", label: "Pillar 3 — Title (Sustainability)", section: "pillars", value: "Sustainability" },
  { key: "pillar_3_body", label: "Pillar 3 — Description", section: "pillars", value: "All our work aligns with the UN SDGs — connecting youth action to the global frameworks shaping our future." },
  { key: "donate_title", label: "Donate — Title", section: "donate", value: "Help us put more young people in the room where decisions are made." },
  {
    key: "donate_description",
    label: "Donate — Description",
    section: "donate",
    value: "Your contribution funds delegate participation, policy research, and community initiatives across our national offices.",
  },
  { key: "founders_page_title", label: "Founders Page — Title", section: "founders", value: "The people behind GYSC" },
  {
    key: "founders_page_desc",
    label: "Founders Page — Description",
    section: "founders",
    value: "Nine co-founders who gathered in South Korea, authored a landmark policy document, and built the Council to carry it forward.",
  },
  { key: "founders_strip_title", label: "Home — Founders Strip Title", section: "founders", value: "Meet the founders" },
  { key: "newsletter_title", label: "Newsletter — Section Title", section: "newsletter", value: "GYSC Newsletter" },
  {
    key: "newsletter_desc",
    label: "Newsletter — Section Description",
    section: "newsletter",
    value: "Policy briefs, forum recaps, and updates from our global youth delegates.",
  },
  { key: "footer_tagline", label: "Footer — Tagline", section: "footer", value: "Empowering young people to shape global policy on sustainable development — from every corner of the world." },
  { key: "gov_title", label: "Governance — Section Title", section: "governance", value: "How GYSC is Structured" },
  { key: "gov_desc", label: "Governance — Description", section: "governance", value: "A four-tier structure designed for democratic participation at every level — from community projects to international policy." },
  { key: "gov_stat", label: "Governance — Stat Label", section: "governance", value: "4 levels of governance" },
];

const DEFAULT_NEWSLETTERS = [
  {
    issue: "Vol. 01",
    date: "September 2025",
    title: "Inaugural Edition — The Council Is Here",
    excerpt: "A message from the co-founders on the birth of GYSC, our mission, and what comes next for youth in global policy.",
    color: "#0f9f6f",
  },
  {
    issue: "Vol. 02",
    date: "October 2025",
    title: "First Policy Forum Recap",
    excerpt: "Over 200 delegates joined our inaugural virtual policy forum. Here's what we discussed, what was resolved, and what it means.",
    color: "#4287F5",
  },
  {
    issue: "Vol. 03",
    date: "November 2025",
    title: "Growing Our Global Network",
    excerpt: "New National Councils are taking shape across Africa, Asia, and the Americas. Meet the leads driving our global expansion.",
    color: "#A21942",
  },
];

export async function seedDatabase() {
  const superEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@gysc.ca").toLowerCase();
  const superPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "gyscc123";

  let superAdmin = await User.findOne({ email: superEmail });
  if (!superAdmin) {
    const hash = await bcrypt.hash(superPassword, 12);
    superAdmin = await User.create({
      firstName: "GYSC",
      lastName: "Admin",
      name: "GYSC Admin",
      email: superEmail,
      password: hash,
      role: "super_admin",
      status: "active",
      country: "Canada",
    });
    console.log("Super admin seeded:", superEmail);
  } else if (superAdmin.role !== "super_admin") {
    superAdmin.role = "super_admin";
    await superAdmin.save();
  }

  for (const img of DEFAULT_IMAGES) {
    await SiteImage.findOneAndUpdate({ key: img.key }, { $setOnInsert: img }, { upsert: true, new: true });
  }

  for (const txt of DEFAULT_TEXTS) {
    await SiteText.findOneAndUpdate({ key: txt.key }, { $setOnInsert: txt }, { upsert: true, new: true });
  }

  const founderCount = await Founder.countDocuments();
  if (founderCount === 0) {
    await Founder.insertMany(
      Array.from({ length: 9 }, (_, i) => ({
        name: "Founder Name",
        role: "Co-Founder · Policy Lead",
        country: "Country",
        message: "This space holds the founder's personal message to the world — to be filled by the founder.",
        order: i,
      })),
    );
  }

  const newsletterCount = await Newsletter.countDocuments();
  if (newsletterCount === 0) {
    await Newsletter.insertMany(DEFAULT_NEWSLETTERS);
  }

  console.log("Database seed complete");
}
