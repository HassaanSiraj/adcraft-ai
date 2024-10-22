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
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
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
        maxOutputTokens: 600,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error: ${res.status} ${text}`);
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

async function callHuggingFaceImage(prompt: string): Promise<string | null> {
  if (!HUGGINGFACE_API_KEY) return null;
  const model = "stabilityai/stable-diffusion-2-1";
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
      Accept: "image/png",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true },
    }),
  });
  if (!res.ok) {
    // return null rather than throw; text results are still useful
    return null;
  }
  const arrayBuf = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString("base64");
  return base64;
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
    const imageBase64 = await callHuggingFaceImage(bannerPrompt);

    return NextResponse.json({
      copies: textData.copies,
      slogans: textData.slogans,
      hashtags: textData.hashtags,
      bannerPrompt,
      imageBase64,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}


