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

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Ad Generator</h1>
        <p className="mt-2 text-foreground/70">
          Provide details below and generate ad copy and banner ideas.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            // wired in next task
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
              Generate Ads
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


