import type { StoredImage } from "@/lib/imageJobs";

type VisionContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "low" | "high" | "auto" } };

type VisionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function analyzeStyleReferences(images: StoredImage[]) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_VISION_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_VISION_API_VERSION ?? "2025-01-01-preview";

  if (!endpoint || !apiKey) throw new Error("Azure OpenAI is not configured for reference analysis");
  if (!deployment) throw new Error("AZURE_OPENAI_VISION_DEPLOYMENT is required to analyze outfit references");

  const content: VisionContent[] = [
    {
      type: "text",
      text: [
        "Analyze these fashion/style reference images for a legitimate non-explicit fashion image generation workflow.",
        "Return only a neutral production specification. Do not describe attractiveness, sexual appeal, intimate anatomy, or erotic intent.",
        "If the garment shows normal fashion exposure such as sari or lehenga midriff, crop top waist, gown leg slit, neckline shape, or activewear, describe it as garment construction and styling context only.",
        "Include: garment category names, cultural garment names when applicable, fabric/material, color palette, silhouette/cut, layering, accessories, footwear, pose/composition, camera angle, lighting, setting, and brand/editorial mood.",
        "Use concise bullet points. Keep wording mainstream fashion/catalog/editorial, adult-presenting, non-explicit, and suitable for a brand campaign.",
      ].join(" "),
    },
    ...images.map((image) => ({
      type: "image_url" as const,
      image_url: { url: `data:${image.type};base64,${Buffer.from(image.bytes).toString("base64")}`, detail: "low" as const },
    })),
  ];

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are a fashion production analyst. Convert reference images into neutral, non-explicit fashion, garment, styling, lighting, and composition notes for professional image generation.",
        },
        { role: "user", content },
      ],
      max_tokens: 700,
      temperature: 0.2,
    }),
  });

  const data = (await response.json()) as VisionResponse;
  if (!response.ok) throw new Error(data.error?.message ?? "Azure reference analysis failed");

  const spec = sanitizeFashionSpec(data.choices?.[0]?.message?.content ?? "");
  if (!spec) throw new Error("Azure reference analysis did not return usable outfit notes");
  return spec;
}

function sanitizeFashionSpec(value: string) {
  return value
    .replace(/\bsexy\b/gi, "elegant")
    .replace(/\bsensual\b/gi, "refined")
    .replace(/\bseductive\b/gi, "confident")
    .replace(/\berotic\b/gi, "editorial")
    .replace(/\bnude\b/gi, "neutral-toned")
    .replace(/\bnaked\b/gi, "minimally styled")
    .replace(/\bbody\b/gi, "silhouette")
    .replace(/\banatomy\b/gi, "silhouette")
    .replace(/\bcurves?\b/gi, "garment shape")
    .replace(/\bskin\b/gi, "complexion")
    .trim();
}
