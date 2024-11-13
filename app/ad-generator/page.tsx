"use client";

import { useState } from "react";

type ToneOption =
  | "Funny"
  | "Professional"
  | "Emotional"
  | "Luxury"
  | "Bold"
  | "Friendly";

type PlatformOption = "Facebook" | "Instagram" | "Google Ads" | "LinkedIn";

export default function AdGeneratorPage() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<ToneOption>("Professional");
  const [platform, setPlatform] = useState<PlatformOption>("Facebook");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | null
    | {
        copies: { headline: string; caption: string }[];
        slogans: string[];
        hashtags: string[];
        bannerPrompt: string;
        imageBase64?: string | null;
        imageNote?: string;
        imageModel?: string;
      }
  >(null);

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Ad Generator</h1>
        <p className="mt-2 text-foreground/70">
          Provide details below and generate ad copy and banner ideas.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
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
                }),
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || `Request failed (${res.status})`);
              }
              const data = await res.json();
              setResult(data);
            } catch (err: any) {
              setError(err?.message || "Something went wrong");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <div className="grid gap-2">
            <label htmlFor="productName" className="text-sm font-medium">
              Product Name
            </label>
            <input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Acme SmartBottle"
              required
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none ring-2 ring-transparent focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="productDescription" className="text-sm font-medium">
              Product Description
            </label>
            <textarea
              id="productDescription"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Self-cleaning bottle that tracks hydration and glows when it's time to drink."
              required
              rows={5}
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none ring-2 ring-transparent focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="targetAudience" className="text-sm font-medium">
              Target Audience
            </label>
            <input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Busy professionals, fitness enthusiasts, students"
              required
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none ring-2 ring-transparent focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="tone" className="text-sm font-medium">
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneOption)}
                className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none ring-2 ring-transparent focus:ring-foreground/20"
              >
                {[
                  "Funny",
                  "Professional",
                  "Emotional",
                  "Luxury",
                  "Bold",
                  "Friendly",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="platform" className="text-sm font-medium">
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformOption)}
                className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none ring-2 ring-transparent focus:ring-foreground/20"
              >
                {["Facebook", "Instagram", "Google Ads", "LinkedIn"].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {isLoading ? "Generating..." : "Generate Ads"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-8 grid gap-4">
            <div className="h-6 w-48 animate-pulse rounded bg-foreground/10" />
            <div className="h-24 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-6 w-32 animate-pulse rounded bg-foreground/10" />
            <div className="h-10 w-40 animate-pulse rounded bg-foreground/10" />
          </div>
        )}

        {result && !isLoading && (
          <section className="mt-10 grid gap-8">
            <div>
              <h2 className="text-xl font-semibold">Ad Copies</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.copies?.map((c, idx) => (
                  <div key={idx} className="rounded-lg border border-foreground/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{c.headline}</h3>
                        <p className="mt-1 text-sm text-foreground/80">{c.caption}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `${c.headline}\n\n${c.caption}`;
                          navigator.clipboard.writeText(text);
                        }}
                        className="rounded border border-foreground/20 px-3 py-1 text-xs hover:bg-foreground/5"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Slogans</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.slogans?.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-foreground/15 px-3 py-1 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Hashtags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.hashtags?.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-foreground/5 px-3 py-1 text-sm"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Banner Idea</h2>
              {result.imageBase64 ? (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Generated banner"
                    className="w-full max-w-2xl rounded border border-foreground/10"
                    src={`data:image/png;base64,${result.imageBase64}`}
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <a
                      download={`${productName.replace(/\s+/g, "-").toLowerCase()}-banner.png`}
                      href={`data:image/png;base64,${result.imageBase64}`}
                      className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
                    >
                      Download Image
                    </a>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(result.bannerPrompt)}
                      className="rounded border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
                    >
                      Copy Prompt
                    </button>
                  </div>
                  {result.imageModel && (
                    <p className="mt-2 text-xs text-foreground/60">Model: {result.imageModel}</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-foreground/10 p-4">
                  <p className="text-sm whitespace-pre-wrap">{result.bannerPrompt}</p>
                  {result.imageNote && (
                    <p className="mt-2 text-xs text-foreground/60">{result.imageNote}</p>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(result.bannerPrompt)}
                      className="rounded border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
                    >
                      Copy Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  // trigger resubmission with same inputs
                  const form = document.querySelector("form");
                  form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                }}
                className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/5"
              >
                Regenerate
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}


