// supabase/functions/instagram-feed/index.ts
//
// Fetches the business's latest Instagram posts/reels server-side, using the
// Instagram Graph API, so the long-lived access token never has to be
// shipped in the client-side bundle.
//
// ---- One-time setup (do this in the Meta / Instagram dashboard, not code) ----
// 1. The Instagram account must be a Business or Creator account, linked to
//    a Facebook Page (Instagram profile → Settings → Account type).
// 2. Create a Meta app at developers.facebook.com (App type: Business).
// 3. Add the "Instagram Graph API" product to the app.
// 4. Generate a long-lived Page Access Token for the linked Facebook Page
//    (Graph API Explorer → select the app + page → generate token → then
//    exchange it for a long-lived token, which lasts ~60 days and can be
//    refreshed before it expires).
// 5. Get the Instagram Business Account ID (via
//    GET /me/accounts?fields=instagram_business_account then
//    GET /{page-id}?fields=instagram_business_account).
// 6. Set the secrets below via the Supabase CLI:
//      supabase secrets set INSTAGRAM_ACCESS_TOKEN=<the long-lived token>
//      supabase secrets set INSTAGRAM_BUSINESS_ACCOUNT_ID=<the ig business account id>
//
// Until both secrets are set, this function returns { posts: [], configured:
// false } and the homepage section below hides itself — nothing breaks.
//
// NOTE: the long-lived token expires roughly every 60 days and needs
// refreshing (Meta allows refreshing it via a GET call before expiry) or the
// feed will silently stop updating and show the last cached posts.
//
// This version has CORS_HEADERS inlined (instead of importing from
// ../_shared/supabase-admin.ts) so it can be deployed as a single
// self-contained file — e.g. via the Supabase Dashboard's paste-in editor,
// which does not bundle sibling/shared files. If you deploy via the
// Supabase CLI from the project root instead, the original shared-import
// version works fine too.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const accessToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
  const igAccountId = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID");

  if (!accessToken || !igAccountId) {
    return new Response(JSON.stringify({ posts: [], configured: false }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.facebook.com/v20.0/${igAccountId}/media?fields=${fields}&limit=8&access_token=${accessToken}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error("[instagram-feed] Graph API error", res.status, text);
      return new Response(JSON.stringify({ posts: [], configured: true, error: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const posts = (data.data ?? [])
      .filter((p: any) => p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM" || p.media_type === "VIDEO")
      .slice(0, 6)
      .map((p: any) => ({
        id: p.id,
        caption: (p.caption ?? "").slice(0, 140),
        mediaType: p.media_type,
        // Videos/reels don't expose media_url reliably for the cover image — use thumbnail_url instead.
        imageUrl: p.media_type === "VIDEO" ? p.thumbnail_url ?? p.media_url : p.media_url,
        permalink: p.permalink,
        timestamp: p.timestamp,
      }));

    return new Response(JSON.stringify({ posts, configured: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[instagram-feed]", err);
    return new Response(JSON.stringify({ posts: [], configured: true, error: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
