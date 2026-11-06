// Catálogo y reproductor de Devoracine.
export const BASE_URL = "https://devoracine.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Referer: `${BASE_URL}/`,
  "Accept-Language": "es-ES,es;q=0.9",
};

export async function fetchHtml(url, options = {}) {
  if (typeof kino === "undefined" || typeof kino.fetch !== "function")
    throw Error("Kino fetch no disponible");
  const r = await kino.fetch(url, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!r.ok) throw Error(`HTTP ${r.status} al solicitar ${url}`);
  return r.text();
}

/* ── helpers ── */

const strip = (x) =>
  String(x || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/\s+/g, " ")
    .trim();

function slugToTitle(slug) {
  let s = slug
    .replace(/\/+$/, "")
    .replace(/-(serie|la-pelicula|pelicula|movie|film)$/i, "")
    .replace(/-(\d{4})$/, " ($1)")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(
      /\b(De|Del|La|El|Los|Las|Un|Una|En|Y|A|Al|Con|Por|Para|Sin|Que|Su|Se)\b/g,
      (w) => w.toLowerCase()
    )
    .replace(/^./, (c) => c.toUpperCase());
  // Restore known compound names
  s = s.replace(/\bSpider Man\b/g, "Spider-Man");
  s = s.replace(/\bX Men\b/g, "X-Men");
  s = s.replace(/\bAnt Man\b/g, "Ant-Man");
  s = s.replace(/\bIron Man\b/g, "Iron Man");
  return s;
}

/* ── parseCards ── */

const SKIP_SLUGS =
  /^(wp-|category|tag|author|feed|contacto|politica|terminos|privacy|cookie|page\/)/;

export function parseCards(html, kind = "movie") {
  const out = [];
  const seen = new Set();
  const re =
    /<a\b[^>]*href=["'](https:\/\/devoracine\.com\/([^"'#?]+)\/?)\s*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const ref = m[1];
    const rawSlug = m[2].replace(/\/+$/, "");
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
    const inner = m[3];

    if (!slug || seen.has(slug) || SKIP_SLUGS.test(slug)) continue;

    // Must contain an <img> to be a content card
    const imgMatch = inner.match(/<img\b[^>]*src=["']([^"']+)/i);
    if (!imgMatch) continue;

    seen.add(slug);

    // Title: prefer non-empty alt/title from <img>, else derive from slug
    const altAttr = (inner.match(/<img\b[^>]*\balt=["']([^"']+)/i) || [])[1];
    const titleAttr = (inner.match(/<img\b[^>]*\btitle=["']([^"']+)/i) || [])[1];
    const rawTitle = strip(altAttr || titleAttr || "");
    const title = rawTitle.length > 2 ? rawTitle : slugToTitle(rawSlug);

    const poster = imgMatch[1];

    out.push({
      id: slug,
      ref,
      title,
      kind,
      type: kind,
      poster,
      art: poster,
      overview: undefined,
    });
  }
  return out;
}

export function parseHeroSlides(html) {
  return parseCards(html).slice(0, 6);
}

export async function catalog(path = "", kind = "movie") {
  return parseCards(await fetchHtml(`${BASE_URL}${path}`), kind);
}

/* ── details ── */

export async function details(ref, kinoApi) {
  const html = await fetchHtml(ref);

  const rawH1 = strip(
    (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]
  );
  const rawMeta = strip(
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
  );
  const rawTitle = rawH1 || rawMeta;
  const title = rawTitle
    .replace(/\s*[|–-]\s*(?:Ver )?(?:Película|Serie|Peliculas|Series|Devoracine|DevoraCine).*$/i, "")
    .trim();

  const overview = strip(
    (
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description/i) ||
      []
    )[1]
  );

  const poster =
    (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)/i) ||
      [])[1] || "";

  let base = {
    title,
    overview,
    description: overview,
    poster,
    art: poster,
    backdrop: poster,
    kind: "movie",
    type: "movie",
    ref,
  };

  try {
    if (kinoApi?.meta?.byTitle) {
      const m = await kinoApi.meta({ title, kind: "movie" });
      if (m) base = { ...base, ...m, ids: m.ids || base.ids };
    }
  } catch (_) {}

  return base;
}

/* ── resolve ── */

export async function resolveDevora(ref) {
  const html = await fetchHtml(ref);
  const src =
    (html.match(/<iframe[^>]+src=["']([^"']+)/i) || [])[1] || "";
  if (!src) throw Error("No se encontró reproductor en esta ficha");
  const decoded = src.replace(/&amp;/g, "&");
  if (/\.m3u8(?:[?"']|$)/i.test(decoded))
    return {
      url: decoded,
      mime: "application/x-mpegURL",
      headers: {
        Referer: BASE_URL + "/",
        "User-Agent": HEADERS["User-Agent"],
      },
    };
  throw Error(
    `El reproductor externo no expuso una fuente HLS directa: ${new URL(decoded).hostname}`
  );
}
