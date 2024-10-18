## AdCraft AI

Generate catchy ad copies and banner ideas with AI.

### Tech
- Next.js 15 (App Router) + TypeScript + TailwindCSS
- API Routes (serverless) for AI calls
- Gemini API (text) + Hugging Face Inference (image)

### Quick Start
1) Copy environment file:

```bash
cp env.example .env.local
```

2) Fill in API keys in `.env.local`:
- `GEMINI_API_KEY` — get one at Google AI Studio
- `HUGGINGFACE_API_KEY` — create a token at Hugging Face

3) Run dev server:

```bash
npm run dev
```

Open http://localhost:3000

### Pages
- `/` — Home with hero & CTA
- `/ad-generator` — Form for product inputs, generates:
  - 3 ad copies (headline + caption)
  - 3 slogans
  - 5 hashtags
  - Banner image (if HF key) or banner prompt

### API
`POST /api/generateAd`

Request body:
```json
{
  "productName": "string",
  "productDescription": "string",
  "targetAudience": "string",
  "tone": "Funny|Professional|Emotional|Luxury|Bold|Friendly",
  "platform": "Facebook|Instagram|Google Ads|LinkedIn"
}
```

Response:
```json
{
  "copies": [{ "headline": "string", "caption": "string" }],
  "slogans": ["string"],
  "hashtags": ["#tag"],
  "bannerPrompt": "string",
  "imageBase64": "base64?"
}
```

### Free API Options (recommended)
- Gemini: Free tier available — create an API key in Google AI Studio (region dependent)
- Hugging Face Inference: Free tier for hosted models — create a token and use model `stabilityai/stable-diffusion-2-1`

If you prefer a different image provider (e.g., Fal.ai, Replicate, Stability AI), we can switch the route to that — provide an API key and model name.

### Deployment
- Frontend + API routes: Vercel (zero-config for Next.js)
- Add environment variables in Vercel Project Settings → Environment Variables

### Notes
- We intentionally call Gemini via REST (no extra SDK) to keep dependencies minimal.
- If no `HUGGINGFACE_API_KEY` is set, the API returns a banner prompt instead of an image.
