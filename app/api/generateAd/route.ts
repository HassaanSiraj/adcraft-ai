import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "bytedance-seed/seedream-4.5";
const OPENROUTER_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "";

type GenerateAdBody = {
  productName: string;
  productDescription: string;
  targetAudience: string;
  tone: string;
  platform: string;
  marketingGoal?: string;
  emotion?: string;
  brandStyle?: string;
};

type AdCopy = { headline: string; caption: string };

function buildPrompt(input: GenerateAdBody): string {
  const { productName, productDescription, targetAudience, tone, platform, marketingGoal, emotion, brandStyle } = input;
  return [
    `You are AdCraft AI, an advertising assistant. Given a product and context, generate engaging, platform-aware ad content.`,
    `Product Name: ${productName}`,
    `Description: ${productDescription}`,
    `Target Audience: ${targetAudience}`,
    `Tone: ${tone}`,
    `Platform: ${platform}`,
    marketingGoal ? `Primary Marketing Goal: ${marketingGoal}` : undefined,
    brandStyle ? `Brand Style: ${brandStyle}` : undefined,
    emotion ? `Desired Emotion: ${emotion}` : undefined,
    `Tasks:`,
    `1) Create 3 short ad copies, each with a "headline" (<= 8 words) and a "caption" (<= 25 words).`,
    `2) Create 3 slogans/taglines (<= 6 words).`,
    `3) Create 5 relevant, platform-appropriate hashtags.`,
    `Guidelines:`,
    `- Adapt to ${platform} best practices (e.g., concise for Google Ads; visual/story for Instagram; professional for LinkedIn; conversational for Facebook).`,
    `- Maintain the specified tone${brandStyle ? ` in a ${brandStyle} style` : ""}.`,
    emotion ? `- Aim to evoke: ${emotion}.` : undefined,
    marketingGoal ? `- Optimize to: ${marketingGoal}.` : undefined,
    `- Avoid emojis unless well-suited to the platform.`,
    `Output strictly in JSON with this schema:`,
    `{"copies":[{"headline":"string","caption":"string"},...],"slogans":["string",...],"hashtags":["#tag",...]}`
  ].filter(Boolean).join("\n");
}

async function callGemini(input: GenerateAdBody) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const prompt = buildPrompt(input);
  // Discover available models for this key/region and pick the best available
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  let available: { id: string; methods: string[] }[] = [];
  try {
    const listRes = await fetch(listUrl, { method: "GET" });
    if (listRes.ok) {
      const j = (await listRes.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
      available = (j?.models || []).map((m) => ({
        id: String(m?.name || "").split("/").pop() || "",
        methods: Array.isArray(m?.supportedGenerationMethods)
          ? m.supportedGenerationMethods
          : [],
      }));
    }
  } catch {}

  // Allow user to force a specific model via env
  const forced = (process.env.GEMINI_MODEL || "").trim();
  if (forced) {
    available = [{ id: forced, methods: ["generateContent"] }];
  }

  const preference = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.0-pro",
  ];
  const supportsGenerateContent = (m: { id: string; methods: string[] }) =>
    m.id && m.methods.includes("generateContent");
  const notPreviewOr25 = (id: string) =>
    !/^gemini-2/i.test(id) && !/preview|exp/i.test(id);
  const isGemini = (id: string) => /^gemini-/i.test(id);

  let chosen = available.find(
    (m) => supportsGenerateContent(m) && isGemini(m.id) && preference.includes(m.id) && notPreviewOr25(m.id)
  )?.id;
  if (!chosen) {
    chosen = available.find((m) => supportsGenerateContent(m) && isGemini(m.id) && notPreviewOr25(m.id))?.id;
  }
  // Final fallback to a safe default if listing failed
  if (!chosen) chosen = "gemini-1.5-flash";

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${chosen}:generateContent?key=` +
    GEMINI_API_KEY;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            copies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  caption: { type: "string" },
                },
                required: ["headline", "caption"],
              },
            },
            slogans: { type: "array", items: { type: "string" } },
            hashtags: { type: "array", items: { type: "string" } },
          },
          required: ["copies", "slogans", "hashtags"],
        },
      },
    }),
  });

  if (!res.ok) {
    // If 429 quota, try a brief retry or suggest upgrade
    if (res.status === 429) {
      let retryMs = 4000;
      try {
        const j = await res.json();
        const details: { "@type"?: string; retryDelay?: string }[] = j?.error?.details || [];
        const retry = details.find((d) => d?.["@type"]?.includes("RetryInfo"));
        const delay = retry?.retryDelay || ""; // e.g., "4s"
        const m = String(delay).match(/(\d+(?:\.\d+)?)s/);
        if (m) retryMs = Math.ceil(parseFloat(m[1]) * 1000);
      } catch {}
      await new Promise((r) => setTimeout(r, retryMs));
      const res2 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: prompt }] },
          ],
          generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 400 },
        }),
      });
      if (!res2.ok) {
        const text2 = await res2.text();
        throw new Error(
          `Gemini quota exceeded. Consider enabling billing or using a free-tier model (e.g., gemini-1.5-flash). Error (${chosen}): ${res2.status} ${text2}`
        );
      }
      const data2 = await res2.json();
      const text2 = data2?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text).join("\n") || "";
      if (!text2) throw new Error("Empty response from Gemini");
      const firstBrace2 = text2.indexOf("{");
      const lastBrace2 = text2.lastIndexOf("}");
      const jsonSlice2 = firstBrace2 !== -1 && lastBrace2 !== -1 ? text2.slice(firstBrace2, lastBrace2 + 1) : text2;
      return JSON.parse(jsonSlice2);
    }
    const text = await res.text();
    throw new Error(`Gemini error (${chosen}): ${res.status} ${text}`);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  let text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("\n") || "";
  if (!text) {
    const block = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
    if (block && String(block).toLowerCase().includes("safety")) {
      throw new Error(`Gemini blocked the response due to safety filters (${block}). Try adjusting inputs/tone.`);
    }
    // Fallback: try the same call without responseSchema/responseMimeType
    const resLoose = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [ { role: "user", parts: [{ text: prompt + "\n\nReturn ONLY raw JSON with keys copies,slogans,hashtags. No code fences, no extra text." }] } ],
        generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 400 },
      }),
    });
    if (!resLoose.ok) {
      const looseTxt = await resLoose.text();
      throw new Error(`Gemini error (fallback) ${resLoose.status}: ${looseTxt}`);
    }
    const looseData = await resLoose.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    text = looseData?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("\n") || "";
    if (!text) {
      // As a last resort, synthesize reasonable defaults so UI can proceed
      const synth = synthesizeAds(input);
      return synth;
    }
    // continue to parse below
  }

  // With responseMimeType set, 'text' should already be pure JSON
  try {
    const parsed = JSON.parse(text);
    return parsed as { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
  } catch {
    // Fallback: extract first JSON object from text
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    const jsonSlice = firstBrace !== -1 && lastBrace !== -1 ? text.slice(firstBrace, lastBrace + 1) : text;
    try {
      const parsed2 = JSON.parse(jsonSlice);
      return parsed2 as { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
    } catch {
      throw new Error("Failed to parse Gemini JSON");
    }
  }
}

async function callGroq(input: GenerateAdBody) {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }
  const prompt = buildPrompt(input);
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are AdCraft AI. Return ONLY compact JSON with keys copies,slogans,hashtags. No extra text.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq error: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string }; delta?: { content?: string } }[] };
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.delta?.content ||
    "";
  if (!text) throw new Error("Empty response from Groq");
  try {
    return JSON.parse(text) as { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Failed to parse Groq JSON");
  }
}

async function callOpenRouter(input: GenerateAdBody) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  const prompt = buildPrompt(input);
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AdCraft AI",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are AdCraft AI. Return ONLY compact JSON with keys copies,slogans,hashtags. No extra text.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string }; delta?: { content?: string } }[] };
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.delta?.content ||
    "";
  if (!text) throw new Error("Empty response from OpenRouter");
  try {
    return JSON.parse(text) as { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Failed to parse OpenRouter JSON");
  }
}

function sanitizeHashtagFragment(fragment: string): string {
  return fragment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function synthesizeAds(input: GenerateAdBody): { copies: AdCopy[]; slogans: string[]; hashtags: string[] } {
  const { productName, productDescription, targetAudience, tone = "Professional", platform = "Facebook" } = input;
  const baseHeadline = `${productName}`.slice(0, 48);
  const benefit = productDescription.split(/[,.;\n]/)[0]?.trim() || "quality you can trust";
  const audience = targetAudience.split(/[,;]/)[0]?.trim() || "your audience";

  const copies: AdCopy[] = [
    {
      headline: `${baseHeadline}: Made for ${audience}`,
      caption: `${benefit}. ${tone} tone crafted for ${platform}. Shop now.`,
    },
    {
      headline: `${baseHeadline} — Elevate Your Day`,
      caption: `Designed for ${audience}. ${benefit}. Try it today.`,
    },
    {
      headline: `${baseHeadline} You’ll Love`,
      caption: `${benefit}. Built for ${audience}. Discover more.`,
    },
  ];

  const slogans = [
    `${productName} — Built for You`,
    `Own Your ${platform}`,
    `Everyday ${benefit.split(" ")[0] || "Wins"}`,
  ];

  const tagSeeds = [productName, audience, platform, tone, benefit];
  const hashtags = Array.from(
    new Set(
      tagSeeds
        .map((s) => `#${sanitizeHashtagFragment(String(s || ""))}`)
        .filter((t) => t.length > 3)
    )
  ).slice(0, 5);

  return { copies, slogans, hashtags };
}

type HFImageResult = { base64: string | null; note?: string; modelTried?: string };

async function callHuggingFaceImage(
  prompt: string,
  opts?: { width?: number; height?: number }
): Promise<HFImageResult> {
  if (!HUGGINGFACE_API_KEY) return { base64: null, note: "No HUGGINGFACE_API_KEY configured." };
  const candidates = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-2-1",
  ];

  for (const model of candidates) {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          // Many image models accept width/height via parameters
          ...(opts?.width ? { width: opts.width } : {}),
          ...(opts?.height ? { height: opts.height } : {}),
        },
        options: { wait_for_model: true },
      }),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) {
        const arrayBuf = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString("base64");
        return { base64, modelTried: model };
      }
      // Router returns JSON envelope; try to extract base64 image
      const json = await res.json().catch(() => null) as unknown;
      if (json) {
        const stack: unknown[] = [json];
        const b64Regex = /^[A-Za-z0-9+/=\n\r]+$/;
        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;
          if (typeof node === "string" && node.length > 100 && b64Regex.test(node)) {
            return { base64: node.replace(/\n|\r/g, ""), modelTried: model };
          }
          if (Array.isArray(node)) stack.push(...(node as unknown[]));
          else if (typeof node === "object") stack.push(...Object.values(node as Record<string, unknown>));
        }
        return { base64: null, modelTried: model, note: "HF router returned JSON without an image payload. Ensure this model supports text-to-image at the router endpoint." };
      }
      return { base64: null, modelTried: model, note: "HF router returned unexpected response." };
    }
    const text = await res.text().catch(() => "");
    // Provide a helpful note for common cases
    if (res.status === 401) {
      return { base64: null, modelTried: model, note: "Invalid Hugging Face token (401). Regenerate a token and set HUGGINGFACE_API_KEY." };
    }
    if (res.status === 403) {
      return {
        base64: null,
        modelTried: model,
        note: `Access to ${model} is gated. Visit the model page on Hugging Face and accept the terms, or choose a different model. (${text.slice(0, 200)}...)`,
      };
    }
    if (res.status === 429) {
      return { base64: null, modelTried: model, note: "Hugging Face rate limit (429). Wait a minute and try again." };
    }
    if (res.status === 503) {
      // Model loading or unavailable; try next candidate
      continue;
    }
    // Other error; try next but keep note
    return { base64: null, modelTried: model, note: `HF ${model} error ${res.status}: ${text.slice(0, 200)}...` };
  }
  return { base64: null, note: "No available HF model responded successfully." };
}

type ORImageResult = { base64: string | null; note?: string; modelTried?: string };
async function callOpenRouterImage(
  prompt: string,
  aspectRatio: "4:5" | "16:9"
): Promise<ORImageResult> {
  if (!OPENROUTER_API_KEY || !OPENROUTER_IMAGE_MODEL) {
    return { base64: null, note: "OpenRouter image model not configured." };
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AdCraft AI",
    },
    body: JSON.stringify({
      model: OPENROUTER_IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      stream: false,
      image_config: {
        aspect_ratio: aspectRatio,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      return { base64: null, modelTried: OPENROUTER_IMAGE_MODEL, note: `OpenRouter auth or access error ${res.status}. ${t.slice(0, 180)}...` };
    }
    return { base64: null, modelTried: OPENROUTER_IMAGE_MODEL, note: `OpenRouter image error ${res.status}: ${t.slice(0, 180)}...` };
  }
  const data = await res.json().catch(() => null) as { choices?: { message?: { images?: { image_url?: { url?: string }; imageUrl?: { url?: string } }[] } }[] } | null;
  const msg = data?.choices?.[0]?.message;
  const img = msg?.images?.[0]?.image_url?.url || msg?.images?.[0]?.imageUrl?.url;
  if (typeof img === "string" && img.startsWith("data:image/")) {
    // Strip header and keep base64 to match existing UI
    const base64 = img.split(",")[1] || "";
    return { base64: base64 || null, modelTried: OPENROUTER_IMAGE_MODEL };
  }
  return { base64: null, modelTried: OPENROUTER_IMAGE_MODEL, note: "OpenRouter did not return an image payload." };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateAdBody;
    const { productName, productDescription, targetAudience, tone, platform, marketingGoal, emotion, brandStyle } = body || {};
    if (!productName || !productDescription || !targetAudience || !tone || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let textData: { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
    // Preference: OpenRouter (user requested) -> Gemini -> Groq -> synthesize
    if (OPENROUTER_API_KEY) {
      try {
        textData = await callOpenRouter(body);
      } catch {
        try {
          textData = await callGemini(body);
        } catch {
          if (GROQ_API_KEY) {
            try {
              textData = await callGroq(body);
            } catch {
              textData = synthesizeAds(body);
            }
          } else {
            textData = synthesizeAds(body);
          }
        }
      }
    } else {
      try {
        textData = await callGemini(body);
      } catch {
        if (GROQ_API_KEY) {
          try {
            textData = await callGroq(body);
          } catch {
            textData = synthesizeAds(body);
          }
        } else {
          textData = synthesizeAds(body);
        }
      }
    }

    const bannerPrompt = [
      `Create a visually stunning marketing banner for "${productName}".`,
      `Goal: ${marketingGoal || "capture attention and increase engagement"}.`,
      `Style: ${tone}${brandStyle ? ` and ${brandStyle}` : ""}.`,
      `Platform: ${platform}.`,
      `Target Audience: ${targetAudience}.`,
      `Focus: ${productDescription}.`,
      `Include strong visual hierarchy, bold typography, and balanced composition.`,
      `Incorporate brand-friendly colors and dynamic lighting${emotion ? ` that evoke ${emotion}` : ""}.`,
      `Make the design look professional, scroll-stopping, and ad-ready.`,
    ].join("\n");
    let imageBase64: string | null = null;
    let imageNote: string | undefined;
    let imageModel: string | undefined;
    let imageLandscapeBase64: string | null = null;
    let imageLandscapeModel: string | undefined;
    let imageLandscapeNote: string | undefined;
    // Try OpenRouter image first if configured, otherwise use HF
    if (OPENROUTER_API_KEY && OPENROUTER_IMAGE_MODEL) {
      const orPortrait = await callOpenRouterImage(bannerPrompt + "\nAspect ratio: Portrait 4:5.", "4:5");
      imageBase64 = orPortrait.base64;
      imageNote = orPortrait.note;
      imageModel = orPortrait.modelTried;
      const orLandscape = await callOpenRouterImage(bannerPrompt + "\nAspect ratio: Landscape 16:9.", "16:9");
      imageLandscapeBase64 = orLandscape.base64;
      imageLandscapeNote = orLandscape.note;
      imageLandscapeModel = orLandscape.modelTried;
      // If OpenRouter fails, fall back to HF
      if (!imageBase64 || !imageLandscapeBase64) {
        const hfPortrait = await callHuggingFaceImage(bannerPrompt + "\nAspect ratio: Portrait 4:5.", { width: 1024, height: 1280 });
        imageBase64 = imageBase64 || hfPortrait.base64;
        imageNote = imageNote || hfPortrait.note;
        imageModel = imageModel || hfPortrait.modelTried;
        const hfLandscape = await callHuggingFaceImage(bannerPrompt + "\nAspect ratio: Landscape 16:9.", { width: 1280, height: 720 });
        imageLandscapeBase64 = imageLandscapeBase64 || hfLandscape.base64;
        imageLandscapeNote = imageLandscapeNote || hfLandscape.note;
        imageLandscapeModel = imageLandscapeModel || hfLandscape.modelTried;
      }
    } else if (HUGGINGFACE_API_KEY) {
      const hf = await callHuggingFaceImage(bannerPrompt + "\nAspect ratio: Portrait 4:5.", { width: 1024, height: 1280 });
      imageBase64 = hf.base64;
      imageNote = hf.note;
      imageModel = hf.modelTried;
      const hfL = await callHuggingFaceImage(bannerPrompt + "\nAspect ratio: Landscape 16:9.", { width: 1280, height: 720 });
      imageLandscapeBase64 = hfL.base64;
      imageLandscapeNote = hfL.note;
      imageLandscapeModel = hfL.modelTried;
    } else {
      imageNote = "No image provider configured (set OPENROUTER_IMAGE_MODEL+OPENROUTER_API_KEY or HUGGINGFACE_API_KEY). Showing banner prompt only.";
    }

    return NextResponse.json({
      copies: textData.copies,
      slogans: textData.slogans,
      hashtags: textData.hashtags,
      bannerPrompt,
      imageBase64,
      imageModel,
      imageNote,
      imageLandscapeBase64,
      imageLandscapeModel,
      imageLandscapeNote,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


