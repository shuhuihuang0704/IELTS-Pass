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
    const body = await response.text();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch {
    return Response.json({ message: "Dictionary timeout" }, { status: 504 });
  }
}
