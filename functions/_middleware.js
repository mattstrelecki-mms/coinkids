// Cloudflare Pages middleware — serve platform-appropriate OG image.
//
// Default (in HTML): portrait kid-home framed phone PNG. Renders cleanly
// in iMessage, Slack, Discord, Mail, etc.
//
// For platforms that expect a 1.91:1 landscape card and would crop the
// portrait awkwardly (Twitter/X, Facebook, LinkedIn), rewrite og:image
// and twitter:image to point at the landscape hero card.

const LANDSCAPE_BOTS = /Twitterbot|facebookexternalhit|Facebot|LinkedInBot|Slackbot|Pinterestbot|WhatsApp/i;

const PORTRAIT_IMG = "https://thecoinkids.app/assets/screens/kid-home-framed.png";
const PORTRAIT_W = "1419";
const PORTRAIT_H = "2796";
const LANDSCAPE_IMG = "https://thecoinkids.app/assets/og-image.png";
const LANDSCAPE_W = "1200";
const LANDSCAPE_H = "630";

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Only process HTML page requests (not assets, not API)
  if (
    url.pathname !== "/" &&
    !url.pathname.endsWith("/") &&
    !url.pathname.endsWith(".html") &&
    url.pathname !== ""
  ) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const ua = request.headers.get("User-Agent") || "";
  const isLandscapeBot = LANDSCAPE_BOTS.test(ua);

  // Only rewrite when a landscape-preferring bot is fetching.
  // Default HTML already contains the landscape image (current state),
  // so for everyone else we swap to the portrait image.
  let html = await response.text();

  if (isLandscapeBot) {
    // Bot wants landscape — leave the default landscape image in place.
    return new Response(html, response);
  }

  // Everyone else (iMessage, Slack, browsers, etc.) — swap to portrait.
  html = html
    .replaceAll(`content="${LANDSCAPE_IMG}"`, `content="${PORTRAIT_IMG}"`)
    .replaceAll(
      `og:image:width" content="${LANDSCAPE_W}"`,
      `og:image:width" content="${PORTRAIT_W}"`
    )
    .replaceAll(
      `og:image:height" content="${LANDSCAPE_H}"`,
      `og:image:height" content="${PORTRAIT_H}"`
    );

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
