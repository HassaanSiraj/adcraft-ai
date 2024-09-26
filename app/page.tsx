import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AdCraft AI
          </h1>
          <p className="mt-6 text-lg leading-8 text-foreground/80">
            Generate catchy ad copies and banner ideas with AI. Tailored to your
            product, audience, tone, and platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/ad-generator"
              className="rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Start Creating
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold leading-6 hover:underline"
            >
              Learn more →
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-foreground/10 p-6">
            <h3 className="font-semibold">Describe your product</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Provide name, description, audience, tone, and platform.
            </p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-6">
            <h3 className="font-semibold">Generate with AI</h3>
            <p className="mt-2 text-sm text-foreground/70">
              We craft ad copy, slogans, hashtags, and banner ideas.
            </p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-6">
            <h3 className="font-semibold">Use instantly</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Copy text, download images, or regenerate variations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
