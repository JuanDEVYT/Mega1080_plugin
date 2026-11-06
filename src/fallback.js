// Fallback resolver for Mega1080 when primary source embeds timeout or fail.
// Compatible with QuickJS runtime (no Buffer, no AbortSignal, kino.fetch).

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function cleanTitle(raw) {
  return String(raw || "")
    .replace(/\s*\(\d{4}\).*$/, "")
    .replace(/[:–—|].*$/, "")
    .trim();
}

function decodeBase64(str) {
  if (typeof atob === "function") {
    return atob(str);
  }
  return "";
}

function decodeNupload(html) {
  try {
    const mFunc = html.match(/var\s+([A-Za-z0-9_]+)\s*=\s*"";\s*([A-Za-z0-9_]+)\.forEach\(function\s+[A-Za-z0-9_]+\(value\)\s*\{\s*\1\s*\+=\s*String\.fromCharCode\(parseInt\(atob\(value\)\.replace\(\/\\D\/g,''?\)\)\s*-\s*(\d+)\);\s*\}\s*\);/);
    if (!mFunc) return null;
    const [_, targetVar, arrVar, offsetStr] = mFunc;
    const offset = parseInt(offsetStr, 10);
    const mArr = html.match(new RegExp('var\\s+' + arrVar + '\\s*=\\s*(\\[[^\\]]+\\]);'));
    if (!mArr) return null;
    const arr = JSON.parse(mArr[1]);
    let baseUrl = "";
    for (const item of arr) {
      const raw = decodeBase64(item);
      const code = parseInt(raw.replace(/\D/g, ''), 10) - offset;
      baseUrl += String.fromCharCode(code);
    }
    const mSesz = html.match(/var sesz="([^"]+)"/);
    const sesz = mSesz ? mSesz[1] : "";
    return baseUrl + "?s=" + sesz;
  } catch (_) {
    return null;
  }
}

export async function resolveFallback(title) {
  const q = cleanTitle(title);
  if (!q) return null;

  try {
    const searchUrl = "https://repelisplus.my/buscar/" + encodeURIComponent(q);
    const sRes = await kino.fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!sRes.ok) return null;
    const sHtml = await sRes.text();

    const mPost = sHtml.match(/<a[^>]+href=["'](https:\/\/repelisplus\.my\/ver\/[^"']+)["']/i);
    if (!mPost) return null;
    const movieUrl = mPost[1];

    const mRes = await kino.fetch(movieUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!mRes.ok) return null;
    const mHtml = await mRes.text();

    const mJaljz = mHtml.match(/var jaljz = (\{[\s\S]*?\});/);
    if (!mJaljz) return null;
    const jaljz = JSON.parse(mJaljz[1]);

    const keys = [];
    for (const groupKey of ["0", "1", "2"]) {
      const group = jaljz[groupKey];
      if (!group || !group.pos) continue;
      for (const posKey of Object.keys(group.pos)) {
        const item = group.pos[posKey];
        if (item && item.key) {
          keys.push({ key: item.key, lang: group.id || "Latino" });
        }
      }
    }

    for (const k of keys.slice(0, 3)) {
      try {
        const buUrl = "https://watchfun.top/bu/?key=" + encodeURIComponent(k.key);
        const buRes = await kino.fetch(buUrl, {
          headers: { "User-Agent": USER_AGENT, Referer: movieUrl },
        });
        if (!buRes.ok) continue;
        const buHtml = await buRes.text();

        const iframeSrc = (buHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i) || [])[1];
        if (!iframeSrc) continue;

        const nuRes = await kino.fetch(iframeSrc, {
          headers: { "User-Agent": USER_AGENT, Referer: "https://watchfun.top/" },
        });
        if (!nuRes.ok) continue;
        const nuHtml = await nuRes.text();

        const m3u8Url = decodeNupload(nuHtml);
        if (!m3u8Url || !m3u8Url.startsWith("http")) continue;

        return {
          url: m3u8Url,
          mime: "application/x-mpegURL",
          headers: {
            Referer: iframeSrc,
            Origin: new URL(iframeSrc).origin,
            "User-Agent": USER_AGENT,
          },
          name: `${k.lang} · HD (Fallback)`,
        };
      } catch (_) {
        // try next key
      }
    }
  } catch (err) {
    console.log("[Mega1080 Fallback] error:", err.message);
  }

  return null;
}
