"use client";

import { useState } from "react";
import Link from "next/link";

type ToneOption =
  | "Funny"
  | "Professional"
  | "Emotional"
  | "Luxury"
  | "Bold"
  | "Friendly";

type PlatformOption = "Facebook" | "Instagram" | "Google Ads" | "LinkedIn";

const TONES: ToneOption[] = [
  "Funny",
  "Professional",
  "Emotional",
  "Luxury",
  "Bold",
  "Friendly",
];
const PLATFORMS: PlatformOption[] = [
  "Facebook",
  "Instagram",
  "Google Ads",
  "LinkedIn",
];

type AdResult = {
  copies: { headline: string; caption: string }[];
  slogans: string[];
  hashtags: string[];
  bannerPrompt: string;
  imageBase64?: string | null;
  imageNote?: string;
  imageModel?: string;
  imageLandscapeBase64?: string | null;
  imageLandscapeModel?: string;
  imageLandscapeNote?: string;
};

export default function AdGeneratorPage() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<ToneOption>("Professional");
  const [platform, setPlatform] = useState<PlatformOption>("Facebook");
  const [marketingGoal, setMarketingGoal] = useState(
    "capture attention and increase engagement"
  );
  const [emotion, setEmotion] = useState("trust and excitement");
  const [brandStyle, setBrandStyle] = useState("modern, professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generateAd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productDescription,
          targetAudience,
          tone,
          platform,
          marketingGoal,
          emotion,
          brandStyle,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-foreground/8 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
          <span className="font-display font-black italic text-xl tracking-tight">
            AdCraft <span className="text-accent">AI</span>
          </span>
          <div className="w-14" aria-hidden="true" />
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:grid lg:grid-cols-[400px_1fr] lg:gap-8 lg:items-start">

        {/* ── LEFT: Form (sticky on desktop) ── */}
        <div className="lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-73px)] lg:overflow-y-auto pb-4">
          <div className="mb-6">
            <h1 className="font-display font-black italic text-3xl leading-tight">
              Generate Your Ad
            </h1>
            <p className="text-muted text-sm mt-1.5">
              Fill in the details and let AI craft your campaign.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col gap-5"
          >
            <Field
              id="productName"
              label="Product Name"
              required
            >
              <input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Acme SmartBottle"
                required
                className={inputCls}
              />
            </Field>

            <Field id="productDescription" label="Product Description" required>
              <textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Self-cleaning bottle that tracks hydration and glows when it's time to drink."
                required
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field id="targetAudience" label="Target Audience" required>
              <input
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Busy professionals, fitness enthusiasts, students"
                required
                className={inputCls}
              />
            </Field>

            <Field id="marketingGoal" label="Marketing Goal">
              <input
                id="marketingGoal"
                value={marketingGoal}
                onChange={(e) => setMarketingGoal(e.target.value)}
                placeholder="capture attention and increase engagement"
                className={inputCls}
              />
            </Field>

            <Field id="emotion" label="Emotion to Evoke">
              <input
                id="emotion"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                placeholder="trust and excitement"
                className={inputCls}
              />
            </Field>

            <Field id="brandStyle" label="Brand Style">
              <input
                id="brandStyle"
                value={brandStyle}
                onChange={(e) => setBrandStyle(e.target.value)}
                placeholder="modern, professional"
                className={inputCls}
              />
            </Field>

            {/* Tone pills */}
            <Field id="tone" label="Tone">
              <div className="flex flex-wrap gap-2 pt-0.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tone === t
                        ? "bg-accent text-background"
                        : "bg-surface border border-foreground/10 text-muted hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            {/* Platform pills */}
            <Field id="platform" label="Platform">
              <div className="flex flex-wrap gap-2 pt-0.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      platform === p
                        ? "bg-accent text-background"
                        : "bg-surface border border-foreground/10 text-muted hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full py-3.5 rounded-xl bg-accent text-background font-semibold text-sm transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                isLoading
                  ? {}
                  : { boxShadow: "0 0 22px rgba(245,200,66,0.25)" }
              }
            >
              {isLoading ? "Generating…" : "Generate Ads →"}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="mt-8 lg:mt-0">

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="flex flex-col gap-5">
              <div className="skeleton h-6 w-40" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="skeleton h-36 w-full" />
                <div className="skeleton h-36 w-full" />
              </div>
              <div className="skeleton h-6 w-28 mt-2" />
              <div className="flex gap-2 flex-wrap">
                <div className="skeleton h-8 w-28" />
                <div className="skeleton h-8 w-24" />
                <div className="skeleton h-8 w-32" />
              </div>
              <div className="skeleton h-6 w-28 mt-2" />
              <div className="flex gap-2 flex-wrap">
                <div className="skeleton h-8 w-20" />
                <div className="skeleton h-8 w-24" />
                <div className="skeleton h-8 w-20" />
              </div>
            </div>
          )}

          {/* Empty state (desktop only when nothing is loading/shown) */}
          {!result && !isLoading && !error && (
            <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/10 p-14 text-center h-80">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-4 text-accent text-lg"
                style={{ background: "var(--accent-dim)" }}
              >
                ✦
              </div>
              <p className="text-foreground font-medium text-sm mb-1">
                Your ads will appear here
              </p>
              <p className="text-muted text-xs">
                Fill in the form and hit Generate Ads
              </p>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="flex flex-col gap-10">

              {/* Ad Copies */}
              {result.copies?.length > 0 && (
                <div>
                  <SectionLabel>Ad Copies</SectionLabel>
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    {result.copies.map((c, idx) => (
                      <div
                        key={idx}
                        className="group rounded-2xl bg-surface border border-foreground/8 p-5 flex flex-col gap-3 hover:border-foreground/14 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-foreground leading-snug">
                            {c.headline}
                          </h3>
                          <CopyButton
                            onClick={() =>
                              handleCopy(
                                `${c.headline}\n\n${c.caption}`,
                                `copy-${idx}`
                              )
                            }
                            copied={copiedKey === `copy-${idx}`}
                          />
                        </div>
                        <p className="text-sm text-muted leading-relaxed">
                          {c.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slogans */}
              {result.slogans?.length > 0 && (
                <div>
                  <SectionLabel>Slogans</SectionLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.slogans.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleCopy(s, `slogan-${i}`)}
                        className="rounded-lg border border-foreground/10 px-3.5 py-1.5 text-sm text-foreground hover:border-accent/40 hover:text-accent transition-all"
                        title="Click to copy"
                      >
                        {copiedKey === `slogan-${i}` ? "Copied!" : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {result.hashtags?.length > 0 && (
                <div>
                  <SectionLabel>Hashtags</SectionLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.hashtags.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleCopy(h, `hash-${i}`)}
                        className="rounded-lg bg-surface-2 px-3.5 py-1.5 text-sm text-muted hover:text-accent hover:bg-accent-dim transition-all font-mono"
                        title="Click to copy"
                      >
                        {copiedKey === `hash-${i}` ? "Copied!" : h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner */}
              <div>
                <SectionLabel>Banner</SectionLabel>
                {result.imageBase64 ? (
                  <div className="mt-4 flex flex-col gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Generated banner"
                      className="w-full max-w-2xl rounded-2xl border border-foreground/10"
                      src={`data:image/png;base64,${result.imageBase64}`}
                    />
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        download={`${productName
                          .replace(/\s+/g, "-")
                          .toLowerCase()}-banner.png`}
                        href={`data:image/png;base64,${result.imageBase64}`}
                        className="inline-flex items-center gap-2 bg-accent text-background px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all"
                      >
                        Download Image
                      </a>
                      <CopyButton
                        label="Copy Prompt"
                        onClick={() =>
                          handleCopy(result.bannerPrompt, "banner-prompt")
                        }
                        copied={copiedKey === "banner-prompt"}
                      />
                    </div>
                    {result.imageModel && (
                      <p className="text-xs text-muted">
                        Model: {result.imageModel}
                      </p>
                    )}

                    {/* Landscape variant */}
                    {result.imageLandscapeBase64 && (
                      <div className="flex flex-col gap-4 mt-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="Generated landscape banner"
                          className="w-full max-w-3xl rounded-2xl border border-foreground/10"
                          src={`data:image/png;base64,${result.imageLandscapeBase64}`}
                        />
                        <a
                          download={`${productName
                            .replace(/\s+/g, "-")
                            .toLowerCase()}-banner-landscape.png`}
                          href={`data:image/png;base64,${result.imageLandscapeBase64}`}
                          className="inline-flex items-center gap-2 bg-accent text-background px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all w-fit"
                        >
                          Download Landscape
                        </a>
                        {result.imageLandscapeModel && (
                          <p className="text-xs text-muted">
                            Model: {result.imageLandscapeModel}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-surface border border-foreground/8 p-5">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {result.bannerPrompt}
                    </p>
                    {result.imageNote && (
                      <p className="mt-2 text-xs text-muted">
                        {result.imageNote}
                      </p>
                    )}
                    <div className="mt-4">
                      <CopyButton
                        label="Copy Prompt"
                        onClick={() =>
                          handleCopy(result.bannerPrompt, "banner-prompt")
                        }
                        copied={copiedKey === "banner-prompt"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Regenerate */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 border border-foreground/12 px-5 py-2.5 rounded-xl text-sm font-semibold text-muted hover:text-foreground hover:border-foreground/22 hover:bg-surface transition-all disabled:opacity-50"
                >
                  ↻ Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small shared components ── */

const inputCls =
  "w-full rounded-xl border border-foreground/10 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-all focus:border-accent/60 focus:ring-2 focus:ring-accent/[0.12]";

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest text-muted"
      >
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-bold italic text-xl text-foreground">
      {children}
    </h2>
  );
}

function CopyButton({
  onClick,
  copied,
  label = "Copy",
}: {
  onClick: () => void;
  copied: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        copied
          ? "border-accent/40 bg-accent-dim text-accent"
          : "border-foreground/12 text-muted hover:border-foreground/22 hover:text-foreground"
      }`}
    >
      {copied ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="4"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
