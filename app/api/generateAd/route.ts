import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

type GenerateAdBody = {
  productName: string;
  productDescription: string;
  targetAudience: string;
  tone: string;
  platform: string;
};

type AdCopy = { headline: string; caption: string };

function buildPrompt(input: GenerateAdBody): string {
  const { productName, productDescription, targetAudience, tone, platform } = input;
  return [
    `You are AdCraft AI, an advertising assistant. Given a product and context, generate engaging, platform-aware ad content.`,
    `Product Name: ${productName}`,
    `Description: ${productDescription}`,
    `Target Audience: ${targetAudience}`,
    `Tone: ${tone}`,
    `Platform: ${platform}`,
    `Tasks:`,
    `1) Create 3 short ad copies, each with a "headline" (<= 8 words) and a "caption" (<= 25 words).`,
    `2) Create 3 slogans/taglines (<= 6 words).`,
    `3) Create 5 relevant, platform-appropriate hashtags.`,
    `Guidelines:`,
    `- Adapt to ${platform} best practices (e.g., concise for Google Ads; visual/story for Instagram; professional for LinkedIn; conversational for Facebook).`,
    `- Maintain the specified tone.`,
    `- Avoid emojis unless well-suited to the platform.`,
    `Output strictly in JSON with this schema:`,
    `{"copies":[{"headline":"string","caption":"string"},...],"slogans":["string",...],"hashtags":["#tag",...]}`
  ].join("\n");
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
      const j = (await listRes.json()) as any;
      available = (j?.models || []).map((m: any) => ({
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

  let chosen = available.find(
    (m) => supportsGenerateContent(m) && preference.includes(m.id) && notPreviewOr25(m.id)
  )?.id;
  if (!chosen) {
    chosen = available.find((m) => supportsGenerateContent(m) && notPreviewOr25(m.id))?.id;
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
      },
    }),
  });

  if (!res.ok) {
    // If 429 quota, try a brief retry or suggest upgrade
    if (res.status === 429) {
      let retryMs = 4000;
      try {
        const j = await res.json();
        const details = j?.error?.details || [];
        const retry = details.find((d: any) => d?.["@type"]?.includes("RetryInfo"));
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
      const text2 = data2?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n") || "";
      if (!text2) throw new Error("Empty response from Gemini");
      const firstBrace2 = text2.indexOf("{");
      const lastBrace2 = text2.lastIndexOf("}");
      const jsonSlice2 = firstBrace2 !== -1 && lastBrace2 !== -1 ? text2.slice(firstBrace2, lastBrace2 + 1) : text2;
      return JSON.parse(jsonSlice2);
    }
    const text = await res.text();
    throw new Error(`Gemini error (${chosen}): ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n") || "";
  if (!text) throw new Error("Empty response from Gemini");

  // Try parse JSON; if fenced or with prose, extract first JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  const jsonSlice = firstBrace !== -1 && lastBrace !== -1 ? text.slice(firstBrace, lastBrace + 1) : text;
  let parsed: { copies: AdCopy[]; slogans: string[]; hashtags: string[] };
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (e) {
    throw new Error("Failed to parse Gemini JSON");
  }
  return parsed;
}

type HFImageResult = { base64: string | null; note?: string; modelTried?: string };

async function callHuggingFaceImage(prompt: string): Promise<HFImageResult> {
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
        Accept: "image/png,image/jpeg,image/webp,*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true },
      }),
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      return { base64, modelTried: model };
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateAdBody;
    const { productName, productDescription, targetAudience, tone, platform } = body || {};
    if (!productName || !productDescription || !targetAudience || !tone || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const textData = await callGemini(body);

    const bannerPrompt = `High-quality marketing banner that highlights ${productName}. Style: ${tone}. Platform: ${platform}. Audience: ${targetAudience}. Visual suggestions: ${productDescription}. Clean layout, strong focal product, brand-friendly colors.`;
    let imageBase64: string | null = null;
    let imageNote: string | undefined;
    let imageModel: string | undefined;
    if (!HUGGINGFACE_API_KEY) {
      imageNote = "No HUGGINGFACE_API_KEY configured. Returning a banner prompt instead of an image.";
    } else {
      const hf = await callHuggingFaceImage(bannerPrompt);
      imageBase64 = hf.base64;
      imageNote = hf.note;
      imageModel = hf.modelTried;
    }

    return NextResponse.json({
      copies: textData.copies,
      slogans: textData.slogans,
      hashtags: textData.hashtags,
      bannerPrompt,
      imageBase64,
      imageModel,
      imageNote,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}


