export function parseJson(text: string): unknown {
  let t = text.trim();

  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    t = fence[1].trim();
  }

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      // fall through to a direct parse attempt below
    }
  }

  try {
    return JSON.parse(t);
  } catch {
    throw new Error("No valid JSON found in AI response.");
  }
}
