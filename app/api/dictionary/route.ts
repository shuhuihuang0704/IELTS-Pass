export async function GET(request: Request) {
  const url = new URL(request.url);
  const word = (url.searchParams.get("word") ?? "").trim().toLowerCase();
  if (!word || !/^[a-z][a-z '-]{0,79}$/.test(word)) return Response.json({ message: "Invalid word" }, { status: 400 });

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return Response.json([], { status: 404 });
    if (!response.ok) return Response.json({ message: "Dictionary unavailable" }, { status: 502 });
    const entries = await response.json() as Array<{
      word: string;
      meanings?: Array<{ definitions?: Array<{ definition?: string }> }>;
      [key: string]: unknown;
    }>;
    let chineseMeaning = "";
    try {
      const translationResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en%7Czh-CN`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (translationResponse.ok) {
        const translation = await translationResponse.json() as { responseData?: { translatedText?: string } };
        chineseMeaning = (translation.responseData?.translatedText ?? "").trim();
      }
      if (!chineseMeaning || chineseMeaning.toLowerCase() === word) {
        const firstDefinition = entries[0]?.meanings?.[0]?.definitions?.[0]?.definition?.trim();
        if (firstDefinition) {
          const fallbackResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(firstDefinition)}&langpair=en%7Czh-CN`, {
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          });
          if (fallbackResponse.ok) {
            const fallback = await fallbackResponse.json() as { responseData?: { translatedText?: string } };
            chineseMeaning = (fallback.responseData?.translatedText ?? "").trim();
          }
        }
      }
    } catch {
      chineseMeaning = "";
    }
    return Response.json(entries.map((entry) => ({ ...entry, chineseMeaning: chineseMeaning || null })), {
      headers: { "cache-control": "public, max-age=86400, s-maxage=604800" },
    });
  } catch {
    return Response.json({ message: "Dictionary timeout" }, { status: 504 });
  }
}
