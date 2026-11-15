/**
 * Google Gemini API helper using the official Generative Language generateContent REST endpoint.
 * Tested and verified with Google AI Studio active models:
 * gemini-3.5-flash -> gemini-3.5-flash-lite -> gemini-3.6-flash -> gemini-3.1-flash-lite -> gemini-3-flash-preview
 */

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

export async function callGeminiJson<T = unknown>({
  apiKey,
  prompt,
  schema,
  preferredModel,
  inlinePdfBase64,
}: {
  apiKey: string;
  prompt: string;
  schema?: Record<string, unknown>;
  preferredModel?: string;
  inlinePdfBase64?: string;
}): Promise<T> {
  const modelsToTry: string[] = [];
  if (preferredModel && !modelsToTry.includes(preferredModel)) {
    modelsToTry.push(preferredModel);
  }
  for (const m of FALLBACK_MODELS) {
    if (!modelsToTry.includes(m)) modelsToTry.push(m);
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    // Try with schema first if provided, then fallback to prompt-only JSON if schema gets 400
    const attempts = schema ? [true, false] : [false];

    for (const useSchema of attempts) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (inlinePdfBase64) {
          parts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: inlinePdfBase64,
            },
          });
        }
        parts.push({
          text: useSchema
            ? prompt
            : `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested fields, with no other commentary.`,
        });

        const generationConfig: Record<string, unknown> = {
          temperature: 0.2,
          maxOutputTokens: 2500,
          responseMimeType: "application/json",
        };
        if (useSchema && schema) {
          generationConfig.responseSchema = schema;
        }

        const requestBody = {
          contents: [{ role: "user", parts }],
          generationConfig,
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          cache: "no-store",
          signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.warn(`Gemini model ${model} (schema=${useSchema}) returned ${res.status}: ${errorText.slice(0, 160)}`);

          if (res.status === 400 && useSchema) {
            // Schema mismatch or unsupported type, retry without responseSchema on this model
            continue;
          }

          if (res.status === 404 || res.status === 503 || res.status === 429) {
            // Model deprecated, high demand, or rate-limited; cascade immediately to next model
            lastError = new Error(`Gemini ${model} unavailable (${res.status}). Cascading to next model.`);
            break;
          }

          if (res.status === 401 || res.status === 403) {
            throw new Error("Gemini rejected the API key. Please check your GEMINI_API_KEY.");
          }

          lastError = new Error(`Gemini error (${res.status}): ${errorText.slice(0, 140)}`);
          break;
        }

        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText || typeof rawText !== "string") {
          throw new Error("Gemini returned an empty response.");
        }

        // Clean markdown code blocks if model wrapped JSON in ```json ... ```
        const cleaned = rawText
          .replace(/^\s*```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        const parsed = JSON.parse(cleaned) as T;
        return parsed;
      } catch (err) {
        if (err instanceof Error && (err.message.includes("API key") || err.name === "AbortError")) {
          // If aborted due to timeout, try next model
          lastError = err;
          break;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  throw lastError ?? new Error("Could not reach Gemini with any available models.");
}
