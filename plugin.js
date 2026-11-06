// src/browse/model.js
var TAB_IDS = ["inicio", "peliculas", "series", "animacion"];
var MAX_SLIDES = 6;
var MAX_RAILS = 8;
var MAX_RAIL_ITEMS = 24;
var MAX_SLIDE_TEXT = 160;
var HTTPS = /^https?:\/\//;
function cardOf(item) {
  if (!item) return null;
  const out = {
    id: `${item.kind || "movie"}-${item.id}`,
    ref: item.ref,
    title: item.title,
    kind: item.kind || "movie"
  };
  const poster = item.poster || item.art || item.logo;
  if (poster && HTTPS.test(poster)) out.poster = poster;
  if (item.backdrop && HTTPS.test(item.backdrop)) out.backdrop = item.backdrop;
  if (item.rating !== void 0) out.rating = item.rating;
  if (item.year !== void 0) out.year = item.year;
  if (item.badges && Array.isArray(item.badges)) out.badges = item.badges.slice(0, 3);
  return out;
}
function slidesOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const img = it.backdrop || it.image || it.poster || it.art;
    if (!img || !HTTPS.test(img)) continue;
    if (!it.ref || typeof it.ref !== "string") continue;
    const title = typeof it.title === "string" ? it.title : "";
    const rawTxt = typeof it.text === "string" ? it.text : typeof it.overview === "string" ? it.overview : "";
    const text = rawTxt.length > MAX_SLIDE_TEXT ? rawTxt.slice(0, MAX_SLIDE_TEXT - 1).trim() + "\u2026" : rawTxt;
    const s = {
      id: `${it.kind || "movie"}-${it.id || title}`,
      ref: it.ref,
      kind: it.kind || "movie",
      title,
      image: img,
      text
    };
    if (it.logo && HTTPS.test(it.logo)) s.logo = it.logo;
    out.push(s);
    if (out.length >= MAX_SLIDES) break;
  }
  return out;
}
function railsOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items = itemsRaw.map(cardOf).filter(Boolean).slice(0, MAX_RAIL_ITEMS);
    if (items.length === 0) continue;
    out.push({
      id: String(row.id || row.ref || out.length),
      title: String(row.title || ""),
      ref: typeof row.ref === "string" ? row.ref : void 0,
      items
    });
    if (out.length >= MAX_RAILS) break;
  }
  return out;
}
function tabOf(page) {
  if (!page || typeof page !== "object") return null;
  const rows = Array.isArray(page.rows) ? page.rows : [];
  const explicitSlides = Array.isArray(page.slides) ? page.slides : [];
  let slides = slidesOf(explicitSlides);
  let rails = railsOf(rows);
  if (slides.length === 0 && rails.length > 0) {
    const first = rails[0];
    const rest = rails.slice(1);
    const promoted = first.items.filter((i) => i.backdrop || i.poster).slice(0, MAX_SLIDES);
    if (promoted.length > 0) {
      slides = slidesOf(promoted.map((c) => ({ ...c, image: c.backdrop || c.poster })));
      rails = rest;
    }
  }
  return { slides, rails };
}
function playedKey(ref) {
  const r = String(ref || "");
  const m = /\/(?:pelicula|serie|episodio)\/([^\/\?#]+)/.exec(r) || /mega1080\.autos\/[^\/]+\/([^\/\?#]+)/.exec(r);
  return m ? m[1] : "";
}
function recentOf(keys, loadedTabs) {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const pool = /* @__PURE__ */ new Map();
  for (const tab of loadedTabs) {
    if (!tab) continue;
    for (const r of tab.rails) {
      for (const c of r.items) {
        const k = playedKey(c.ref);
        if (k && !pool.has(k)) pool.set(k, c);
      }
    }
    for (const s of tab.slides) {
      const k = playedKey(s.ref);
      if (k && !pool.has(k)) {
        pool.set(k, {
          id: s.id,
          ref: s.ref,
          kind: s.kind,
          title: s.title,
          poster: s.image,
          backdrop: s.image
        });
      }
    }
  }
  const out = [];
  for (const k of keys) {
    const hit = pool.get(k);
    if (hit) out.push(hit);
  }
  return out;
}

// src/browse/words.js
var WORDS_RAW = {
  appName: ["Mega1080", "Mega1080"],
  tabHome: ["Inicio", "Home"],
  tabMovies: ["Pel\xEDculas", "Movies"],
  tabSeries: ["Series", "Series"],
  tabAnime: ["Animaci\xF3n", "Animation"],
  recentRail: ["Continuar viendo", "Continue Watching"],
  emptyTitle: ["Sin contenido todav\xEDa", "No content yet"],
  emptySub: ["Vuelve a intentarlo en unos instantes.", "Try again in a few moments."],
  failedTitle: ["No se pudo cargar", "Could not load"],
  failedSub: ["Comprueba la conexi\xF3n e int\xE9ntalo de nuevo.", "Check your connection and try again."],
  btnRetry: ["Reintentar", "Retry"],
  btnSearch: ["Buscar", "Search"],
  btnSettings: ["Ajustes", "Settings"],
  brSearchTitle: ["Buscar en Mega1080", "Search Mega1080"],
  brSearchHint: ["Pel\xEDcula, serie o t\xEDtulo...", "Movie, series or title..."],
  brRecentSearches: ["B\xFAsquedas recientes", "Recent searches"],
  brNoResults: ["Sin resultados para esta b\xFAsqueda.", "No results for this search."],
  brSearching: ["Buscando en Mega1080...", "Searching Mega1080..."],
  brTypeToSearch: ["Escribe un t\xEDtulo para empezar a buscar.", "Type a title to start searching."],
  setLangTitle: ["Idioma de audio preferido", "Preferred Audio Language"],
  setLangDesc: ["Prioridad al seleccionar servidores de reproducci\xF3n autom\xE1tica.", "Priority when selecting auto-play servers."],
  setLangLatino: ["Espa\xF1ol Latino", "Latin Spanish"],
  setLangCastellano: ["Castellano (Espa\xF1a)", "Castilian (Spain)"],
  setLangSub: ["Subtitulado", "Subtitled"],
  aboutTitle: ["Acerca de Mega1080", "About Mega1080"],
  aboutDesc: ["Cat\xE1logo y reproducci\xF3n de Devoracine para Kino.", "Official HD catalog and playback plugin for Kino."],
  aboutAuthor: ["Creado por JuandreXter", "Created by JuandreXter"],
  aboutVersion: ["Versi\xF3n 1.2.0", "Version 1.2.0"],
  watchNow: ["Reproducir", "Play"],
  moreInfo: ["Ver detalles", "More details"],
  brWatch: ["Reproducir", "Play"],
  brInfo: ["Ver detalles", "Details"],
  brSettings: ["Ajustes", "Settings"],
  brClose: ["Cerrar", "Close"],
  brSearch: ["Buscar", "Search"],
  brRecent: ["Continuar viendo", "Continue watching"],
  brEmpty: ["No hay contenido disponible.", "No content available."],
  brFailed: ["No se pudo cargar el contenido.", "Could not load content."],
  brRetry: ["Reintentar", "Retry"]
};
var WORDS = Object.fromEntries(
  Object.entries(WORDS_RAW).map(([k, [es, en]]) => [
    k,
    { id: k, es, en, text: es, textEn: en }
  ])
);
function both(key, vars = {}) {
  const w = WORDS[key] || { id: key, es: key, en: key };
  let es = w.es;
  let en = w.en;
  for (const [k, v] of Object.entries(vars)) {
    es = es.replaceAll(`{${k}}`, v);
    en = en.replaceAll(`{${k}}`, v);
  }
  return { id: w.id, es, en, text: es, textEn: en };
}

// src/browse/logo.js
var LOGO_ASPECT = "1:1";
var LOGO_DATA = "data:image/png;base64,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";

// src/browse/view.js
var TAB_KEYS = {
  inicio: "tabHome",
  peliculas: "tabMovies",
  series: "tabSeries",
  animacion: "tabAnime",
  anime: "tabAnime"
};
var POLL_MS = 1500;
var SEARCH_CAP = 60;
var twin = (key, field = "text", vars) => {
  const w = both(key, vars);
  return { [field]: w.es, [field + "En"]: w.en };
};
var logo = () => ({
  type: "Image",
  key: "logo",
  url: LOGO_DATA,
  aspect: LOGO_ASPECT,
  fit: "contain",
  h: 40,
  alt: "Mega1080",
  altEn: "Mega1080",
  fallback: { type: "Text", text: "Mega1080", textEn: "Mega1080", style: "h4" }
});
var tabBar = (active) => ({
  type: "TabBar",
  key: "tabs",
  divider: false,
  value: active,
  onChanged: "tab",
  tabs: TAB_IDS.map((id) => ({ value: id, ...twin(TAB_KEYS[id], "label") }))
});
var railSkeleton = (n) => ({
  type: "Column",
  key: "skel" + n,
  gap: 8,
  children: [
    { type: "Skeleton", shape: "line" },
    { type: "Row", gap: 12, sizes: ["compact"], children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}c${i}`, flex: 1 })) },
    { type: "Row", gap: 12, sizes: ["medium", "expanded"], children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}w${i}`, flex: 1 })) }
  ]
});
var gridSkeleton = () => ({
  type: "Column",
  key: "gridSkeleton",
  gap: 12,
  children: [
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["compact"], key: `gc${r}`, children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `gc${r}-${i}`, flex: 1 })) })),
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["medium", "expanded"], key: `gw${r}`, children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `gw${r}-${i}`, flex: 1 })) }))
  ]
});
var heroSkeleton = () => ({
  type: "Skeleton",
  key: "heroSkeleton",
  shape: "block",
  height: { compact: 200, expanded: 320 }
});
var slideNode = (s) => ({
  type: "heroCard",
  key: "slide-" + s.id,
  h: { compact: 200, expanded: 240 },
  title: s.title,
  text: s.text,
  image: s.image,
  ...s.logo ? { logo: s.logo } : {},
  buttons: [
    {
      type: "ElevatedButton",
      key: "watch-" + s.id,
      ...twin("brWatch", "labelText"),
      icon: "play",
      onPressed: { go: { play: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    },
    {
      type: "TextButton",
      key: "info-" + s.id,
      ...twin("brInfo", "labelText"),
      onPressed: { go: { title: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    }
  ]
});
var hero = (slides) => slides.length === 1 ? slideNode(slides[0]) : {
  type: "PageView",
  key: "hero" + slides.length,
  autoPlayMs: 6e3,
  children: slides.map(slideNode)
};
var rail = (r, key, titleOverride, size = "medium") => ({
  type: "titleRail",
  key,
  ...titleOverride || { title: r.title },
  ...r.ref ? { ref: r.ref } : {},
  items: r.items,
  size
});
function browseView({ tab, data, recent, pending, failed, device = "phone" }) {
  const tv = device === "tv";
  const gear = {
    type: "IconButton",
    key: "settingsButton",
    icon: "settings",
    ...twin("brSettings", "labelText"),
    ...twin("brSettings", "tooltip"),
    onPressed: { event: "go", arg: "settings" }
  };
  const active = TAB_IDS.includes(tab) ? tab : TAB_IDS[0];
  const body = [];
  if (data) {
    if (data.slides.length > 0) body.push(hero(data.slides));
    else if (pending) body.push(heroSkeleton());
    if (recent && recent.length > 0) body.push(rail({ items: recent }, "recent", twin("brRecent", "title"), tv ? "small" : "medium"));
    for (const r of data.rails) {
      body.push(rail(r, "rail-" + String(r.id).replace(/[^A-Za-z0-9_-]/g, "_"), null, tv ? "small" : "medium"));
    }
    if (data.rails.length === 0) {
      body.push({ type: "Text", ...twin("brEmpty", "text"), color: "muted" });
    }
  } else if (failed) {
    body.push({
      type: "MaterialBanner",
      key: "loadFailed",
      role: "error",
      ...twin("brFailed"),
      action: { ...twin("brRetry", "label"), onTap: "retry" }
    });
  } else {
    body.push(heroSkeleton(), railSkeleton(1), railSkeleton(2), railSkeleton(3));
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "close",
        icon: "close",
        ...twin("brClose", "labelText"),
        ...twin("brClose", "tooltip"),
        onPressed: { go: { close: true } }
      },
      actions: tv ? [
        {
          type: "IconButton",
          key: "searchButton",
          icon: "search",
          ...twin("brSearch", "labelText"),
          ...twin("brSearch", "tooltip"),
          onPressed: "openSearch"
        },
        gear
      ] : [gear],
      title: tv ? {
        type: "Row",
        key: "titleRow",
        gap: 24,
        crossAxisAlignment: "center",
        children: [logo(), tabBar(active)]
      } : logo()
    },
    ...tv ? {} : {
      floatingActionButton: {
        type: "FloatingActionButton",
        key: "searchFab",
        icon: "search",
        ...twin("brSearch", "tooltip"),
        onPressed: "openSearch"
      }
    },
    body: {
      type: "Column",
      key: "page",
      children: [
        ...tv ? [] : [
          {
            type: "Column",
            key: "tabsRow",
            padding: { compact: 0, expanded: 24 },
            children: [tabBar(active)]
          }
        ],
        {
          type: "SingleChildScrollView",
          key: "browse-" + active,
          flex: 1,
          children: [
            {
              type: "Column",
              padding: { compact: 12, expanded: 24 },
              gap: 16,
              children: body
            }
          ]
        }
      ]
    },
    ...pending ? { every: { ms: POLL_MS, event: "tick" } } : {}
  };
}
function settingsView() {
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      title: logo()
    },
    body: {
      type: "SingleChildScrollView",
      key: "settings-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: [{ type: "settings", key: "form" }]
        }
      ]
    }
  };
}
function searchView({ query, status, items, history = [], device = "phone" }) {
  const tv = device === "tv";
  const searchForm = () => ({
    type: "Form",
    key: "searchForm",
    onSubmitted: "search",
    gap: 8,
    children: tv ? [
      {
        type: "Row",
        key: "searchRow",
        gap: 16,
        crossAxisAlignment: "center",
        children: [
          {
            type: "TextField",
            key: "q",
            kind: "text",
            value: query,
            ...twin("brSearchHint", "labelText"),
            maxLength: 100,
            autofocus: true,
            weight: 1
          },
          {
            type: "ElevatedButton",
            key: "searchGo",
            ...twin("brSearch", "labelText"),
            icon: "search",
            submit: true
          }
        ]
      }
    ] : [
      {
        type: "TextField",
        key: "q",
        kind: "text",
        value: query,
        ...twin("brSearchHint", "labelText"),
        maxLength: 100,
        autofocus: true
      },
      {
        type: "ElevatedButton",
        key: "searchGo",
        ...twin("brSearch", "labelText"),
        icon: "search",
        submit: true
      }
    ]
  });
  const body = tv ? [] : [searchForm()];
  if (status === "fail") {
    body.push({
      type: "MaterialBanner",
      key: "searchFailed",
      role: "error",
      ...twin("brSearchFailed"),
      action: { ...twin("brRetry", "label"), onTap: "sretry" }
    });
  } else if (status === "done" && items) {
    if (items.length === 0) {
      body.push({ type: "Text", ...twin("brNoResults", "text"), color: "muted" });
    } else {
      body.push({
        type: "titleGrid",
        key: "results",
        columns: { compact: 3, expanded: 6 },
        items: items.slice(0, SEARCH_CAP)
      });
    }
  } else if (status !== "idle") {
    body.push(gridSkeleton());
  } else if (history && history.length > 0) {
    body.push({ type: "Text", ...twin("brSearchedBefore", "text"), style: "h4" });
    body.push({
      type: "titleGrid",
      key: "history",
      columns: { compact: 3, expanded: 6 },
      items: history.slice(0, SEARCH_CAP)
    });
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      ...tv ? { title: searchForm() } : twin("brSearchTitle", "title")
    },
    body: {
      type: "SingleChildScrollView",
      key: "search-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: body
        }
      ]
    },
    ...status === "loading" ? { every: { ms: 1e3, event: "stick" } } : {}
  };
}

// src/browse/metaCache.js
var KEY = "mega1080_meta1";
var MAX = 260;
var CONCURRENCY = 3;
var HTTPS2 = /^https?:\/\//;
function makeMetaCache({ kino: kino2, clock = { now: () => Date.now() } }) {
  const usable = () => {
    try {
      return typeof kino2.meta === "function" && kino2.meta.byTitle === true;
    } catch (_) {
      return false;
    }
  };
  let book = null;
  function read() {
    if (book) return book;
    try {
      const o = JSON.parse(kino2.storage.get(KEY) || "null");
      book = o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (_) {
      book = {};
    }
    return book;
  }
  function write() {
    try {
      const ids = Object.keys(book);
      if (ids.length > MAX) {
        for (const id of ids.slice(0, ids.length - MAX)) delete book[id];
      }
      kino2.storage.set(KEY, JSON.stringify(book));
    } catch (_) {
    }
  }
  function known(id) {
    const e = read()[id];
    if (!e) return {};
    return {
      ...e.t > 0 ? { tmdb: e.t } : {},
      ...e.l && HTTPS2.test(e.l) ? { logo: e.l } : {},
      ...e.b && HTTPS2.test(e.b) ? { backdrop: e.b } : {},
      ...e.o ? { overview: e.o } : {}
    };
  }
  const asked = (id) => Object.hasOwn(read(), id);
  function dress(cards) {
    return cards.map((c) => {
      const k = known(c.id);
      const withId = k.tmdb && !(c.ids && c.ids.tmdb) ? { ...c, ids: { ...c.ids || {}, tmdb: k.tmdb } } : c;
      const withBackdrop = k.backdrop && !withId.backdrop ? { ...withId, backdrop: k.backdrop } : withId;
      return k.logo && !withBackdrop.logo ? { ...withBackdrop, logo: k.logo } : withBackdrop;
    });
  }
  async function fill(cards, budgetMs) {
    if (!usable()) return 0;
    const start = clock.now();
    let count = 0;
    const pending = cards.filter((c) => !asked(c.id));
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      if (clock.now() - start >= budgetMs) break;
      const slice = pending.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (c) => {
          try {
            const type = c.kind === "series" ? "series" : "movie";
            const yearNum = c.year ? parseInt(c.year, 10) : void 0;
            const res = await kino2.meta({
              type,
              title: c.title,
              ...yearNum && yearNum > 1900 ? { year: yearNum } : {}
            });
            count++;
            if (!res) {
              read()[c.id] = { t: 0, l: "" };
            } else {
              const tmdbId = res.ids && res.ids.tmdb || res.id || 0;
              read()[c.id] = {
                t: tmdbId,
                l: res.logo || "",
                b: res.backdrop || "",
                o: res.overview || ""
              };
            }
          } catch (_) {
          }
        })
      );
    }
    if (count > 0) write();
    return count;
  }
  return { usable, known, asked, dress, fill };
}

// src/browse/index.js
var TAB_KEY = "mega1080_browseTab";
var SNAP_PREFIX = "mega1080_browse1:";
var SNAP_TTL_MS = 12 * 3600 * 1e3;
var SNAP_MAX = 24 * 1024;
var RECENT_KEY = "mega1080_recent1";
var RECENT_MAX = 16;
var HIST_KEY = "mega1080_searchHist1";
var HIST_MAX = 24;
var MAX_META_TICKS = 30;
var MAX_LOAD_TRIES = 3;
function metaAsk(c) {
  const title = String(c.title).replace(/\s*[([][^)\]]*[)\]]/g, "").replace(/\s+/g, " ").trim() || String(c.title);
  const y = /\((19|20)\d{2}\)/.exec(String(c.title));
  return { id: c.id, title, kind: c.kind, ...y ? { year: parseInt(y[0].slice(1, 5), 10) } : {} };
}
function makeBrowse({ kino: kino2, loadTab: loadTab2, searchTitles }) {
  const meta = makeMetaCache({ kino: kino2 });
  const slidesFrom = (rails) => {
    const out = [];
    for (const r of rails) {
      for (const c of r.items) {
        if (out.length >= 6) return out;
        const k = meta.known(c.id);
        const img = k.backdrop || c.poster;
        if (!img || out.some((s) => s.id === c.id)) continue;
        out.push({
          id: c.id,
          ref: c.ref,
          kind: c.kind,
          title: c.title,
          image: img,
          text: k.overview || (c.badges ? c.badges.join(" \xB7 ") : ""),
          ...k.logo ? { logo: k.logo } : {}
        });
      }
    }
    return out;
  };
  const uniform = (items) => items.every((i) => i.backdrop) ? items : items.map(({ backdrop, ...rest }) => rest);
  const enrich = (data) => data ? {
    slides: data.slides.length > 0 ? data.slides.map((s) => {
      const k = meta.known(s.id);
      return k.logo ? { ...s, logo: k.logo } : s;
    }) : slidesFrom(data.rails),
    rails: data.rails.map((r) => ({ ...r, items: uniform(meta.dress(r.items)) }))
  } : data;
  const metaTries = /* @__PURE__ */ new Map();
  const memo = /* @__PURE__ */ new Map();
  const log2 = (...a) => {
    try {
      kino2.log("[Mega1080]", ...a);
    } catch (_) {
    }
  };
  const get2 = (k) => {
    try {
      return kino2.storage.get(k);
    } catch (_) {
      return null;
    }
  };
  const set = (k, v, opts) => {
    try {
      kino2.storage.set(k, v, opts);
    } catch (_) {
    }
  };
  function readSnap(tab) {
    try {
      const o = JSON.parse(get2(SNAP_PREFIX + tab) || "null");
      return o && Date.now() - o.at < SNAP_TTL_MS && o.data && Array.isArray(o.data.rails) ? o.data : null;
    } catch (_) {
      return null;
    }
  }
  function writeSnap(tab, data) {
    for (let max = 20; max >= 6; max -= 2) {
      try {
        const slim = {
          slides: data.slides.slice(0, 5),
          rails: data.rails.map((r) => ({ ...r, items: r.items.slice(0, max) }))
        };
        const s = JSON.stringify({ at: Date.now(), data: slim });
        if (s.length <= SNAP_MAX) {
          set(SNAP_PREFIX + tab, s);
          return;
        }
      } catch (_) {
      }
    }
  }
  function dataOf(tab) {
    const m = memo.get(tab);
    if (m) return m.data;
    const s = readSnap(tab);
    if (s) {
      memo.set(tab, { data: s, whole: false });
      return s;
    }
    return null;
  }
  const stored = () => {
    const t = get2(TAB_KEY);
    return TAB_IDS.includes(t) ? t : null;
  };
  const remember = (tab) => {
    set(TAB_KEY, tab);
  };
  function readKeys() {
    try {
      const a = JSON.parse(get2(RECENT_KEY) || "[]");
      return Array.isArray(a) ? a.filter((k) => typeof k === "string") : [];
    } catch (_) {
      return [];
    }
  }
  function notePlayed(ref) {
    const k = playedKey(ref);
    if (!k) return;
    const prior = readKeys().filter((x) => x !== k);
    try {
      set(RECENT_KEY, JSON.stringify([k, ...prior].slice(0, RECENT_MAX)));
    } catch (_) {
    }
  }
  function readHistory() {
    try {
      const a = JSON.parse(get2(HIST_KEY) || "[]");
      return Array.isArray(a) ? a.filter((c) => c && typeof c.id === "string" && typeof c.ref === "string" && typeof c.title === "string").slice(0, HIST_MAX) : [];
    } catch (_) {
      return [];
    }
  }
  function rememberFound(cards) {
    try {
      const fresh = cards.slice(0, 12).map((c) => ({
        id: c.id,
        ref: c.ref,
        title: c.title,
        kind: c.kind,
        poster: c.poster,
        year: c.year,
        rating: c.rating
      }));
      const ids = new Set(fresh.map((c) => c.id));
      set(HIST_KEY, JSON.stringify([...fresh, ...readHistory().filter((c) => !ids.has(c.id))].slice(0, HIST_MAX)));
    } catch (_) {
    }
  }
  let found = null;
  const tabFromArgs = (route) => {
    const a = route && route.args && typeof route.args === "object" ? route.args : {};
    return TAB_IDS.includes(a.tab) ? a.tab : null;
  };
  function needed(tab, device) {
    const order = [tab, ...TAB_IDS.filter((t) => t !== tab)];
    return order.filter((t, i) => (i === 0 || device !== "tv") && !(memo.get(t) && memo.get(t).whole));
  }
  function view(ctx) {
    const st = ctx.state && typeof ctx.state === "object" ? ctx.state : {};
    if (ctx.route && ctx.route.name === "settings") return settingsView();
    if (ctx.route && ctx.route.name === "search") {
      const query = typeof st.sq === "string" ? st.sq : "";
      const items = found && found.q === query ? found.items : null;
      const status = query === "" ? "idle" : st.sstate === "fail" ? "fail" : items ? "done" : "loading";
      return searchView({ query, status, items, history: query === "" ? readHistory() : [], device: ctx.device });
    }
    const tab = TAB_IDS.includes(st.tab) ? st.tab : tabFromArgs(ctx.route) ?? stored() ?? TAB_IDS[0];
    const data = enrich(dataOf(tab));
    const loaded = TAB_IDS.map((t) => memo.get(t)).filter(Boolean).map((m) => m.data);
    const pending = Array.isArray(st.pending) && st.pending.length > 0;
    return browseView({
      tab,
      data,
      recent: uniform(meta.dress(recentOf(readKeys(), loaded))),
      pending,
      failed: !!(st.failed && st.failed[tab]),
      device: ctx.device
    });
  }
  async function load(tab) {
    const page = await loadTab2(tab);
    const data = tabOf(page);
    if (data) {
      memo.set(tab, { data, whole: true });
      writeSnap(tab, data);
    }
    return data !== null;
  }
  const loadTries = /* @__PURE__ */ new Map();
  function failLoad(tab, rest, failed) {
    const n = (loadTries.get(tab) || 0) + 1;
    loadTries.set(tab, n);
    if (n < MAX_LOAD_TRIES) rest.push(tab);
    else {
      failed[tab] = true;
      loadTries.delete(tab);
    }
  }
  const events = {
    open({ route, state, device }) {
      const tab = tabFromArgs(route) ?? (TAB_IDS.includes(state.tab) ? state.tab : stored() ?? TAB_IDS[0]);
      for (const t of TAB_IDS) dataOf(t);
      return { state: { tab, pending: needed(tab, device), failed: null } };
    },
    tab({ value, arg, state }) {
      const tab = TAB_IDS.includes(value) ? value : TAB_IDS.includes(arg) ? arg : null;
      if (!tab) return null;
      remember(tab);
      dataOf(tab);
      const failed = { ...state.failed || {} };
      delete failed[tab];
      const pending = [tab, ...Array.isArray(state.pending) ? state.pending.filter((t) => t !== tab) : []];
      return { state: { tab, pending: memo.get(tab) && memo.get(tab).whole ? pending.slice(1) : pending, failed } };
    },
    retry({ state, device }) {
      const tab = TAB_IDS.includes(state.tab) ? state.tab : TAB_IDS[0];
      return { state: { failed: null, pending: [tab, ...needed(tab, device).filter((t) => t !== tab)] } };
    },
    async tick({ state }) {
      const pending = Array.isArray(state.pending) ? state.pending : [];
      if (pending.length === 0) return null;
      const [next, ...rest] = pending;
      const failed = { ...state.failed || {} };
      if (next.startsWith("meta:")) {
        const tabId = next.slice(5);
        const m = memo.get(tabId);
        if (!m) return { state: { pending: rest } };
        const cards = [
          ...m.data.slides,
          ...m.data.rails.flatMap((r) => r.items.slice(0, 6)),
          ...m.data.rails.flatMap((r) => r.items.slice(6))
        ];
        const asked = await meta.fill(cards.map(metaAsk), 12e3);
        const made = slidesFrom(m.data.rails);
        if (made.length > m.data.slides.length) {
          m.data = { ...m.data, slides: made.map(({ logo: logo2, ...rest2 }) => rest2) };
          writeSnap(tabId, m.data);
        }
        const tries = (metaTries.get(tabId) || 0) + 1;
        metaTries.set(tabId, tries);
        if (asked > 0 && tries < MAX_META_TICKS && cards.some((c) => !meta.asked(c.id))) {
          return { state: { pending: [next, ...rest] } };
        }
        return { state: { pending: rest } };
      }
      try {
        const ok = await load(next);
        if (!ok) failLoad(next, rest, failed);
        else delete failed[next];
        if (ok && meta.usable()) rest.unshift("meta:" + next);
      } catch (e) {
        log2("browse tab error", e && e.message || "error");
        failLoad(next, rest, failed);
      }
      return { state: { pending: rest, failed } };
    },
    openSearch() {
      return { route: { push: "search" }, state: { sq: "", sstate: null } };
    },
    search({ value, route }) {
      const q = value && typeof value.q === "string" ? value.q.trim().slice(0, 100) : "";
      if (q === "") return null;
      const state = { sq: q, sstate: "loading" };
      return route && route.name === "search" ? { state } : { route: { push: "search" }, state };
    },
    async stick({ state }) {
      const q = typeof state.sq === "string" ? state.sq : "";
      if (q === "" || state.sstate !== "loading") return null;
      try {
        const out = await searchTitles(q);
        found = { q, items: (Array.isArray(out) ? out : []).slice(0, 60).map(cardOf) };
        rememberFound(found.items);
        return { state: { sstate: "done" } };
      } catch (e) {
        log2("browse search error", e && e.message || "error");
        return { state: { sstate: "fail" } };
      }
    },
    sretry({ state }) {
      return typeof state.sq === "string" && state.sq !== "" ? { state: { sstate: "loading" } } : null;
    },
    go({ arg }) {
      return arg === "settings" ? { route: { push: "settings" }, state: { fromBrowse: true } } : null;
    },
    back({ state, route }) {
      if (route && route.name === "settings" && !state.fromBrowse) return { close: true };
      return { route: { pop: true }, state: { sq: null, sstate: null } };
    }
  };
  async function event(ev) {
    const handler = Object.hasOwn(events, ev.name) ? events[ev.name] : null;
    return handler ? await handler({ ...ev, state: ev.state || {} }) ?? null : null;
  }
  return { view, event, notePlayed };
}

// src/mega1080.js
var BASE_URL = "https://mega1080.me";
var API = `${BASE_URL}/api/rest`;
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": BASE_URL + "/"
};
async function get(path) {
  if (typeof kino === "undefined" || !kino.fetch) throw Error("Kino fetch no disponible");
  const r = await kino.fetch(API + path, { headers: HEADERS });
  if (!r.ok) throw Error(`Mega1080 HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw Error(j.message || "Respuesta inv\xE1lida de Mega1080");
  return j.data;
}
function abs(v) {
  return v ? /^https?:/.test(v) ? v : BASE_URL + v : "";
}
function tmdbImage(path, size = "w500") {
  const p = String(path || "").trim();
  return /^\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(p) ? `https://image.tmdb.org/t/p/${size}${p}` : "";
}
function galleryImage(x, size = "w500") {
  return tmdbImage(String(x.gallery || "").split(/\s+/).find(Boolean) || "", size);
}
function kindOf(type) {
  return type === "tvshows" ? "series" : type === "animes" ? "anime" : "movie";
}
function card(x, type = "movies") {
  return {
    id: String(x._id),
    ref: `${BASE_URL}/${type === "tvshows" ? "series" : type === "animes" ? "animes" : "peliculas"}/${x.slug}/`,
    title: x.title,
    overview: x.overview || "",
    kind: kindOf(type),
    type: kindOf(type),
    poster: galleryImage(x, "w500") || abs(x.images?.poster),
    art: galleryImage(x, "original") || abs(x.images?.backdrop || x.images?.poster),
    backdrop: galleryImage(x, "original") || abs(x.images?.backdrop),
    year: x.year || Number((x.title || "").match(/\((\d{4})\)/)?.[1])
  };
}
async function sliders(type) {
  return (await get(`/sliders?type=${type}`)).map((x) => card(x, type));
}
async function listing(type = "movies", page = 1) {
  const d = await get(`/listing?post_type=${type}&page=${page}&genres=&years=&order=latest`);
  return {
    items: (d.posts || []).map((x) => card(x, type)),
    next: d.next_page ? String(page + 1) : void 0
  };
}
async function searchMega(q, type = "movies") {
  const d = await get(`/search?post_type=${type}&query=${encodeURIComponent(q)}`);
  return (d.posts || []).map((x) => card(x, type));
}
async function detail(ref) {
  const u = new URL(ref);
  const bits = u.pathname.split("/").filter(Boolean);
  const type = bits[0] === "series" ? "tvshows" : bits[0] === "animes" ? "animes" : "movies";
  const slug = bits.at(-1);
  const d = await get(`/single?post_name=${encodeURIComponent(slug)}&post_type=${type}`);
  const x = d.post || d;
  const out = card(x, type);
  out.ref = ref;
  out.sourceId = String(x._id);
  out.ids = x.ids || x.external_ids || {};
  out.genres = x.genres || [];
  out.rating = x.vote_average || x.rating;
  return out;
}
async function players(id) {
  return get(`/player?post_id=${encodeURIComponent(id)}`);
}
async function episodeList(id) {
  return get(`/episodes?post_id=${encodeURIComponent(id)}`);
}
function unescapeJs(s) {
  return s.replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
}
function token(n, radix) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let s = "";
  do {
    s = chars[n % radix] + s;
    n = Math.floor(n % radix);
  } while (n);
  return s;
}
function unpackPacker(html) {
  const m = html.match(/eval\(function\(p,a,c,k,e,[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/);
  if (!m) return html;
  const payload = unescapeJs(m[1]), radix = Number(m[2]), count = Number(m[3]), dict = unescapeJs(m[4]).split("|");
  let out = payload;
  for (let i = count - 1; i >= 0; i--) {
    const word = dict[i];
    if (word) out = out.replace(new RegExp("\\b" + token(i, radix) + "\\b", "g"), word);
  }
  return out;
}
async function resolveEmbed(url) {
  const r = await kino.fetch(url, {
    headers: {
      "User-Agent": HEADERS["User-Agent"],
      "Referer": BASE_URL + "/"
    }
  });
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  const html = await r.text();
  const source = unpackPacker(html);
  const m = source.match(/https?:[^"'\\\s]+\.m3u8[^"'\\\s]*/i) || source.match(/["'](\/[^"']+\.m3u8[^"']*)/i);
  if (!m) throw Error("El embed no expuso un manifiesto HLS");
  const stream = (m[1] || m[0]).replace(/\\u0026/g, "&");
  return {
    url: stream.startsWith("/") ? new URL(stream, url).href : stream,
    mime: "application/x-mpegURL",
    headers: {
      Referer: url,
      "User-Agent": HEADERS["User-Agent"]
    }
  };
}

// src/fallback.js
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
function cleanTitle(raw) {
  return String(raw || "").replace(/\s*\(\d{4}\).*$/, "").replace(/[:–—|].*$/, "").trim();
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
    const mArr = html.match(new RegExp("var\\s+" + arrVar + "\\s*=\\s*(\\[[^\\]]+\\]);"));
    if (!mArr) return null;
    const arr = JSON.parse(mArr[1]);
    let baseUrl = "";
    for (const item of arr) {
      const raw = decodeBase64(item);
      const code = parseInt(raw.replace(/\D/g, ""), 10) - offset;
      baseUrl += String.fromCharCode(code);
    }
    const mSesz = html.match(/var sesz="([^"]+)"/);
    const sesz = mSesz ? mSesz[1] : "";
    return baseUrl + "?s=" + sesz;
  } catch (_) {
    return null;
  }
}
async function resolveFallback(title) {
  const q = cleanTitle(title);
  if (!q) return null;
  try {
    const searchUrl = "https://repelisplus.my/buscar/" + encodeURIComponent(q);
    const sRes = await kino.fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT }
    });
    if (!sRes.ok) return null;
    const sHtml = await sRes.text();
    const mPost = sHtml.match(/<a[^>]+href=["'](https:\/\/repelisplus\.my\/ver\/[^"']+)["']/i);
    if (!mPost) return null;
    const movieUrl = mPost[1];
    const mRes = await kino.fetch(movieUrl, {
      headers: { "User-Agent": USER_AGENT }
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
          headers: { "User-Agent": USER_AGENT, Referer: movieUrl }
        });
        if (!buRes.ok) continue;
        const buHtml = await buRes.text();
        const iframeSrc = (buHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i) || [])[1];
        if (!iframeSrc) continue;
        const nuRes = await kino.fetch(iframeSrc, {
          headers: { "User-Agent": USER_AGENT, Referer: "https://watchfun.top/" }
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
            "User-Agent": USER_AGENT
          },
          name: `${k.lang} \xB7 HD (Fallback)`
        };
      } catch (_) {
      }
    }
  } catch (err) {
    console.log("[Mega1080 Fallback] error:", err.message);
  }
  return null;
}

// src/plugin.js
var VERSION = "1.0.2";
var P = `[Mega1080 v${VERSION}]`;
console.log(`${P} Creado por JuandreXter`);
var log = (x) => console.log(P, x);
var b;
function app() {
  return b || (b = makeBrowse({
    kino: typeof kino !== "undefined" ? kino : null,
    loadTab,
    searchTitles: async (q) => (await search({ q })).items
  }));
}
async function loadTab(t) {
  log(`loadTab("${t}")`);
  if (t === "inicio") return { rows: await home() };
  const r = await browse(t, "1");
  return { rows: [{ id: t, title: t === "peliculas" ? "Pel\xEDculas" : "Series", ref: t, items: r.items }] };
}
async function home() {
  log("home(): cargando rieles");
  const [m, s, a] = await Promise.all([sliders("movies"), sliders("tvshows"), sliders("animes")]);
  return [
    { id: "movies", title: "Pel\xEDculas destacadas", ref: "peliculas", items: m },
    { id: "series", title: "Series destacadas", ref: "series", items: s },
    { id: "anime", title: "Anime destacado", ref: "animes", items: a }
  ].filter((x) => x.items.length);
}
async function browse(ref = "peliculas", cursor = "1") {
  const type = ref === "series" ? "tvshows" : ref === "animes" ? "animes" : "movies";
  log(`browse(${ref}, ${cursor})`);
  return listing(type, Number(cursor) || 1);
}
async function search(arg) {
  const q = typeof arg === "string" ? arg : arg?.q || arg?.query || "";
  if (!q.trim()) return { items: [] };
  const groups = await Promise.all(["movies", "tvshows", "animes"].map((t) => searchMega(q, t).catch(() => [])));
  return { items: groups.flat() };
}
async function details(ref) {
  log(`details(${ref})`);
  const d = await detail(ref);
  try {
    if (kino?.meta?.byTitle) {
      const m = await kino.meta({ title: d.title, kind: d.kind, year: d.year });
      if (m) return { ...d, ...m, ids: m.ids || d.ids };
    }
  } catch (_) {
  }
  return d;
}
async function episodes(ref) {
  const d = await details(ref);
  const eps = await episodeList(d.sourceId);
  return {
    series: { title: d.title, ref },
    episodes: eps.map((e) => ({
      id: String(e._id),
      ref: `${ref}#episode=${e._id}`,
      title: e.title,
      season: e.season_number,
      episode: e.episode_number,
      overview: e.overview || "",
      kind: "episode",
      type: "episode",
      poster: e.still_path ? `https://image.tmdb.org/t/p/w500${e.still_path}` : d.poster
    }))
  };
}
async function resolve(ref) {
  log(`resolve(${ref})`);
  const hash = ref.match(/#episode=(\d+)/);
  let id;
  let itemTitle = "";
  if (hash) {
    id = hash[1];
  } else {
    const d = await detail(ref);
    id = d.sourceId;
    itemTitle = d.title;
  }
  const list = await players(id).catch(() => []);
  const streams = [];
  for (const x of list) {
    try {
      const s = await resolveEmbed(x.url);
      streams.push({ ...s, name: `${x.lang || "Servidor"} \xB7 ${x.quality || "HD"}` });
      break;
    } catch (e) {
      log(`servidor primario omitido: ${e.message}`);
    }
  }
  if (!streams.length && itemTitle) {
    log(`buscando fallback para "${itemTitle}"...`);
    const fb = await resolveFallback(itemTitle);
    if (fb) {
      log(`fallback exitoso: ${fb.url}`);
      streams.push(fb);
    }
  }
  if (!streams.length) {
    throw Error("No se pudo resolver ning\xFAn servidor HLS");
  }
  return { ...streams[0], alternatives: streams.slice(1) };
}
async function screen(ctx) {
  log("screen()");
  return app().view(ctx || {});
}
async function screenEvent(ev) {
  const e = typeof ev === "string" ? JSON.parse(ev) : ev;
  log(`screenEvent(${e?.name})`);
  return app().event(e || {});
}
export {
  browse,
  details,
  episodes,
  home,
  resolve,
  screen,
  screenEvent,
  search
};
