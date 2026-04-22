import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">

      {/* ── Ambient gradient glows (fixed, non-interactive) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-48 -left-48 w-[650px] h-[650px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,200,66,0.07) 0%, transparent 70%)",
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute top-1/2 -right-64 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,200,66,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-black italic text-xl tracking-tight">
          AdCraft <span className="text-accent">AI</span>
        </span>
        <Link
          href="/ad-generator"
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-accent text-background transition-all hover:bg-accent/90 hover:shadow-[0_0_24px_rgba(245,200,66,0.35)]"
        >
          Start Creating
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">

        {/* Badge */}
        <div className="anim-fade-up inline-flex items-center gap-2 border border-foreground/10 rounded-full px-4 py-1.5 text-sm text-muted mb-8">
          <span className="text-accent">✦</span>
          AI-Powered Ad Creation Platform
        </div>

        {/* Headline */}
        <h1
          className="anim-fade-up anim-d1 font-display font-black italic leading-none tracking-tight"
          style={{ fontSize: "clamp(2.8rem, 7.5vw, 6.5rem)", lineHeight: 1.0 }}
        >
          Create Ads<br />
          That <span className="text-accent">Actually</span><br />
          Convert.
        </h1>

        {/* Subtext */}
        <p className="anim-fade-up anim-d2 mt-8 text-muted text-lg max-w-lg leading-relaxed">
          Generate compelling ad copies, punchy slogans, and banner concepts
          tailored to your product, audience, and platform — in seconds.
        </p>

        {/* CTAs */}
        <div className="anim-fade-up anim-d3 flex items-center gap-5 mt-10 flex-wrap">
          <Link
            href="/ad-generator"
            className="inline-flex items-center gap-2.5 bg-accent text-background px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-accent/90 hover:shadow-[0_0_32px_rgba(245,200,66,0.4)]"
          >
            Start for free
            <ArrowRight />
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-muted hover:text-foreground transition-colors font-medium"
          >
            See how it works ↓
          </a>
        </div>

        {/* Stats row */}
        <div className="anim-fade-up anim-d4 mt-14 pt-8 border-t border-foreground/8 flex flex-wrap gap-10">
          {[
            { value: "6", label: "Ad Platforms" },
            { value: "6", label: "Tone Styles" },
            { value: "AI", label: "Banner Generation" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-accent">
                {value}
              </span>
              <span className="text-muted text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-6xl mx-auto px-6 py-20"
      >
        <div className="mb-12">
          <span className="text-xs font-semibold tracking-widest text-muted uppercase">
            How it works
          </span>
          <h2
            className="font-display font-black italic mt-3 leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
          >
            Three steps to your
            <br />
            <span className="text-accent">perfect ad.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              num: "01",
              title: "Describe your product",
              body: "Provide your product name, description, target audience, tone, and marketing goals.",
            },
            {
              num: "02",
              title: "Generate with AI",
              body: "Our AI crafts multiple ad copy variants, catchy slogans, hashtags, and banner concepts.",
            },
            {
              num: "03",
              title: "Use instantly",
              body: "Copy ad text, download generated banner images, or regenerate for more variations.",
            },
          ].map(({ num, title, body }) => (
            <div
              key={num}
              className="group rounded-2xl bg-surface border border-foreground/8 p-7 transition-all hover:border-foreground/16 hover:bg-surface-2"
            >
              <span
                className="font-display font-black italic leading-none block mb-5 transition-colors group-hover:text-accent/40"
                style={{ fontSize: "3.5rem", color: "var(--muted-dim)" }}
              >
                {num}
              </span>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl border border-foreground/8 p-10 sm:p-16 text-center"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.07) 0%, var(--surface) 65%)",
          }}
        >
          <h2
            className="font-display font-black italic leading-tight mb-5"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)" }}
          >
            Ready to create ads
            <br />
            <span className="text-accent">that actually work?</span>
          </h2>
          <p className="text-muted mb-8 max-w-sm mx-auto text-sm leading-relaxed">
            Start generating your first AI-powered ad in under a minute. No
            credit card required.
          </p>
          <Link
            href="/ad-generator"
            className="inline-flex items-center gap-2.5 bg-accent text-background px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-accent/90 hover:shadow-[0_0_40px_rgba(245,200,66,0.45)]"
          >
            Start Creating Now
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-foreground/8 px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between text-sm text-muted flex-wrap gap-4">
          <span className="font-display font-black italic text-foreground">
            AdCraft <span className="text-accent">AI</span>
          </span>
          <span>Built by Hassaan Siraj</span>
        </div>
      </footer>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 7.5h11M9 3.5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
