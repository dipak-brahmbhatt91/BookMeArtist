import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Layers, Save, RefreshCw, Globe, Zap, Star, Cog, Megaphone } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

type ContentRow = {
  key: string;
  label: string;
  section: string;
  type: string;
  value: unknown;
  updatedAt: string;
};

type StepValue = { num: string; title: string; desc: string };

function useAllContent() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/cms/all`, { credentials: "include" });
      const data = await res.json();
      setRows(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  return { rows, loading, reload: load };
}

async function saveKeys(updates: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api/cms`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Save failed");
}

function SectionCard({
  icon: Icon,
  title,
  accentColor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-gradient-to-r ${accentColor}`}>
        <Icon className="w-5 h-5 text-white" />
        <h2 className="font-display font-bold text-white text-lg">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "textarea";
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="bg-[#13131f] border-white/10 text-white text-sm resize-none focus-visible:ring-primary/50"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-[#13131f] border-white/10 text-white text-sm focus-visible:ring-primary/50"
        />
      )}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="pt-2 border-t border-white/5 flex justify-end">
      <Button onClick={onClick} disabled={saving} className="bg-primary hover:bg-primary/90 text-white gap-2">
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Section"}
      </Button>
    </div>
  );
}

export default function AdminContent() {
  const { rows, loading, reload } = useAllContent();
  const { toast } = useToast();

  const getVal = (key: string): string => {
    const row = rows.find((r) => r.key === key);
    if (!row) return "";
    const v = row.value;
    return typeof v === "string" ? v : "";
  };

  const getBrands = (): string => {
    const row = rows.find((r) => r.key === "trusted_by.brands");
    if (!row || !Array.isArray(row.value)) return "";
    return (row.value as string[]).join("\n");
  };

  const getStep = (key: string): StepValue => {
    const row = rows.find((r) => r.key === key);
    if (!row || typeof row.value !== "object" || row.value === null) {
      return { num: "", title: "", desc: "" };
    }
    return row.value as StepValue;
  };

  // Site Info
  const [siteName, setSiteName] = useState("");
  const [siteTagline, setSiteTagline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [footerText, setFooterText] = useState("");
  const [savingSite, setSavingSite] = useState(false);

  // Hero
  const [badgeText, setBadgeText] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [savingHero, setSavingHero] = useState(false);

  // Trusted By
  const [trustedLabel, setTrustedLabel] = useState("");
  const [brandsText, setBrandsText] = useState("");
  const [savingTrusted, setSavingTrusted] = useState(false);

  // How It Works
  const [howHeading, setHowHeading] = useState("");
  const [howSubheading, setHowSubheading] = useState("");
  const [step1, setStep1] = useState<StepValue>({ num: "01", title: "", desc: "" });
  const [step2, setStep2] = useState<StepValue>({ num: "02", title: "", desc: "" });
  const [step3, setStep3] = useState<StepValue>({ num: "03", title: "", desc: "" });
  const [savingHow, setSavingHow] = useState(false);

  // Artist CTA
  const [ctaHeading, setCtaHeading] = useState("");
  const [ctaDesc, setCtaDesc] = useState("");
  const [ctaBtn, setCtaBtn] = useState("");
  const [savingCta, setSavingCta] = useState(false);

  useEffect(() => {
    if (rows.length === 0) return;
    setSiteName(getVal("site.name"));
    setSiteTagline(getVal("site.tagline"));
    setContactEmail(getVal("site.contact_email"));
    setFooterText(getVal("site.footer_text"));
    setBadgeText(getVal("hero.badge_text"));
    setHeadline(getVal("hero.headline"));
    setSubtitle(getVal("hero.subtitle"));
    setSearchPlaceholder(getVal("hero.search_placeholder"));
    setCtaText(getVal("hero.cta_text"));
    setTrustedLabel(getVal("trusted_by.label"));
    setBrandsText(getBrands());
    setHowHeading(getVal("how_it_works.heading"));
    setHowSubheading(getVal("how_it_works.subheading"));
    setStep1(getStep("how_it_works.step_1"));
    setStep2(getStep("how_it_works.step_2"));
    setStep3(getStep("how_it_works.step_3"));
    setCtaHeading(getVal("artist_cta.heading"));
    setCtaDesc(getVal("artist_cta.description"));
    setCtaBtn(getVal("artist_cta.button_text"));
  }, [rows]);

  async function handleSave(
    setter: (v: boolean) => void,
    updates: Record<string, unknown>
  ) {
    setter(true);
    try {
      await saveKeys(updates);
      await reload();
      toast({ title: "Section saved successfully" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save section" });
    } finally {
      setter(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Layers className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-white">Content Management</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Edit all public-facing website copy. Changes appear instantly on the live site.
            </p>
          </div>
        </div>

        {/* Site Info */}
        <SectionCard icon={Globe} title="Site Info" accentColor="from-slate-900 to-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site Name" value={siteName} onChange={setSiteName} placeholder="BookMeArtist" />
            <Field label="Contact Email" value={contactEmail} onChange={setContactEmail} placeholder="hello@bookmeartist.com" />
          </div>
          <Field label="Tagline" value={siteTagline} onChange={setSiteTagline} placeholder="The new standard for creative bookings" />
          <Field label="Footer Copyright Text" value={footerText} onChange={setFooterText} placeholder="© 2026 BookMeArtist. All rights reserved." />
          <SaveButton saving={savingSite} onClick={() => handleSave(setSavingSite, {
            "site.name": siteName,
            "site.tagline": siteTagline,
            "site.contact_email": contactEmail,
            "site.footer_text": footerText,
          })} />
        </SectionCard>

        {/* Hero Section */}
        <SectionCard icon={Zap} title="Hero Section" accentColor="from-indigo-950 to-indigo-900">
          <Field label="Badge Text (top pill)" value={badgeText} onChange={setBadgeText} placeholder="The new standard for creative bookings" />
          <Field label="Main Headline" value={headline} onChange={setHeadline} placeholder="Book the World's Best Creators" />
          <Field label="Subtitle" value={subtitle} onChange={setSubtitle} type="textarea" placeholder="Skip the agency fees…" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Search Placeholder" value={searchPlaceholder} onChange={setSearchPlaceholder} placeholder="E.g. 'Wedding Photographer in NYC'" />
            <Field label="CTA Button Text" value={ctaText} onChange={setCtaText} placeholder="Explore Now" />
          </div>
          <SaveButton saving={savingHero} onClick={() => handleSave(setSavingHero, {
            "hero.badge_text": badgeText,
            "hero.headline": headline,
            "hero.subtitle": subtitle,
            "hero.search_placeholder": searchPlaceholder,
            "hero.cta_text": ctaText,
          })} />
        </SectionCard>

        {/* Trusted By */}
        <SectionCard icon={Star} title="Trusted By Strip" accentColor="from-amber-950 to-amber-900">
          <Field label="Strip Label Text" value={trustedLabel} onChange={setTrustedLabel} placeholder="Trusted by innovative creators at" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Brand Names <span className="text-white/30">(one per line)</span></label>
            <Textarea
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              rows={5}
              placeholder={"Spotify\nNetflix\nVogue\nSXSW\nRedBull"}
              className="bg-[#13131f] border-white/10 text-white text-sm resize-none focus-visible:ring-primary/50 font-mono"
            />
            <p className="text-xs text-muted-foreground">Each line becomes one brand name in the strip.</p>
          </div>
          <SaveButton saving={savingTrusted} onClick={() => handleSave(setSavingTrusted, {
            "trusted_by.label": trustedLabel,
            "trusted_by.brands": brandsText.split("\n").map((b) => b.trim()).filter(Boolean),
          })} />
        </SectionCard>

        {/* How It Works */}
        <SectionCard icon={Cog} title="How It Works" accentColor="from-purple-950 to-purple-900">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Section Heading" value={howHeading} onChange={setHowHeading} placeholder="How It Works" />
            <Field label="Section Subheading" value={howSubheading} onChange={setHowSubheading} placeholder="From initial spark to final applause…" />
          </div>
          {[
            { step: step1, setStep: setStep1, num: "01" },
            { step: step2, setStep: setStep2, num: "02" },
            { step: step3, setStep: setStep3, num: "03" },
          ].map(({ step, setStep, num }, i) => (
            <div key={num} className="rounded-xl border border-white/5 p-4 space-y-3 bg-white/2">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Step {num}</p>
              <Field
                label="Step Title"
                value={step.title}
                onChange={(v) => setStep((s) => ({ ...s, title: v }))}
                placeholder={["Find the Vibe", "Send the Brief", "Make Magic"][i]}
              />
              <Field
                label="Step Description"
                value={step.desc}
                onChange={(v) => setStep((s) => ({ ...s, desc: v }))}
                type="textarea"
                placeholder="Describe this step…"
              />
            </div>
          ))}
          <SaveButton saving={savingHow} onClick={() => handleSave(setSavingHow, {
            "how_it_works.heading": howHeading,
            "how_it_works.subheading": howSubheading,
            "how_it_works.step_1": { ...step1, num: "01" },
            "how_it_works.step_2": { ...step2, num: "02" },
            "how_it_works.step_3": { ...step3, num: "03" },
          })} />
        </SectionCard>

        {/* Artist CTA */}
        <SectionCard icon={Megaphone} title="Creator CTA Section" accentColor="from-rose-950 to-rose-900">
          <Field label="Heading" value={ctaHeading} onChange={setCtaHeading} placeholder="Are you a creator?" />
          <Field label="Description" value={ctaDesc} onChange={setCtaDesc} type="textarea" placeholder="Join thousands of artists…" />
          <Field label="Button Text" value={ctaBtn} onChange={setCtaBtn} placeholder="Apply as Artist" />
          <SaveButton saving={savingCta} onClick={() => handleSave(setSavingCta, {
            "artist_cta.heading": ctaHeading,
            "artist_cta.description": ctaDesc,
            "artist_cta.button_text": ctaBtn,
          })} />
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
