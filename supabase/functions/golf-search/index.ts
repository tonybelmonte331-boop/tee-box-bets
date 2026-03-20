// @ts-nocheck
// Supabase Edge Function — Golf Course API Proxy
// Runs on Deno. The @ts-nocheck suppresses VS Code TypeScript errors
// while keeping the function fully functional on Supabase servers.

const GOLF_API_KEY  = "33UQRV2WW57MXB4UKI5XYJ2XL4";
const GOLF_BASE_URL = "https://api.golfcourseapi.com/v1";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const url    = new URL(req.url);
    const action = url.searchParams.get("action");

    // SEARCH: ?action=search&q=pebble+beach
    if (action === "search") {
      const q = url.searchParams.get("q")?.trim();
      if (!q) return json({ error: "Missing query" }, 400);

      const res  = await fetch(
        `${GOLF_BASE_URL}/search?search_query=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Key ${GOLF_API_KEY}` } }
      );
      const data = await res.json();
      return json(data);
    }

    // COURSE DETAIL: ?action=course&id=123
    if (action === "course") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "Missing course id" }, 400);

      const res  = await fetch(
        `${GOLF_BASE_URL}/courses/${id}`,
        { headers: { Authorization: `Key ${GOLF_API_KEY}` } }
      );
      const data = await res.json();
      return json(data);
    }

    return json({ error: "Unknown action" }, 400);

  } catch (err) {
    return json({ error: String(err) }, 500);
  }

});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}