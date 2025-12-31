(() => {
  const STATE_KEY = "doubanSubjectHelper";
  const PRESTO_BASE = "https://www.prestomusic.com";
  const PRESTO_SEARCH = "https://www.prestomusic.com/classical/search?search_query=";
  const PRESTO_SEARCH_ALL = "https://www.prestomusic.com/search?search_query=";

  const state = {
    panel: null,
    results: [],
    statusEl: null,
    resultsEl: null,
    queryEl: null,
    googleLinkEl: null
  };

  const page = {
    url: new URL(window.location.href)
  };

  function isSearchPage() {
    if (!page.url.hostname.includes("douban.com")) {
      return false;
    }
    if (page.url.hostname === "search.douban.com") {
      return page.url.pathname.includes("/music/subject_search");
    }
    if (page.url.hostname === "www.douban.com") {
      if (!page.url.pathname.startsWith("/search")) {
        return false;
      }
      return page.url.searchParams.get("cat") === "1003";
    }
    return page.url.hostname === "music.douban.com" && page.url.pathname.includes("/subject_search");
  }

  function isNewSubjectPage() {
    return page.url.hostname === "music.douban.com" && page.url.pathname.includes("/new_subject");
  }

  function getSearchText() {
    const searchText = page.url.searchParams.get("search_text");
    if (searchText) {
      return decodeURIComponent(searchText);
    }
    const queryText = page.url.searchParams.get("q");
    if (queryText) {
      return decodeURIComponent(queryText);
    }
    const input = document.querySelector("input[name='search_text'], input[name='q'], #inp-query");
    if (input && input.value) {
      return input.value.trim();
    }
    return "";
  }

  function looksLikeBarcode(text) {
    const trimmed = cleanText(text).replace(/[\s-]/g, "");
    return /^\d{8,14}$/.test(trimmed) ? trimmed : "";
  }

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeFilename(value) {
    const ascii = cleanText(value).replace(/[^\x20-\x7E]/g, "");
    return ascii
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80);
  }

  function getCoverExtension(url) {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      if (match) {
        return match[1].toLowerCase();
      }
    } catch (error) {
      return "jpg";
    }
    return "jpg";
  }

  function buildCoverFilename(candidate) {
    const title = sanitizeFilename(candidate.title || "");
    const artist = sanitizeFilename(candidate.artist || "");
    const base = [title, artist].filter(Boolean).join("-");
    const name = base || "douban_cover";
    const ext = getCoverExtension(candidate.cover || "");
    return `${name}.${ext}`;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripLabel(value, labelText) {
    const label = cleanText(labelText).replace(/[:：]\s*$/, "");
    if (!label) {
      return cleanText(value);
    }
    const regex = new RegExp(`^${escapeRegExp(label)}[:：]?\\s*`, "i");
    return cleanText(String(value).replace(regex, ""));
  }

  function preferText(...values) {
    for (const value of values) {
      const text = cleanText(value);
      if (text) {
        return text;
      }
    }
    return "";
  }

  function ensurePanel() {
    if (state.panel) {
      return state.panel;
    }

    const panel = document.createElement("div");
    panel.id = "douban-helper-panel";
    panel.innerHTML = `
      <div class="dsh-header">
        <div class="dsh-title"><span class="dsh-title-text">Douban Helper</span></div>
        <button class="dsh-toggle" type="button">Hide</button>
      </div>
      <div class="dsh-body">
        <div class="dsh-section">
          <h3>Query</h3>
          <div class="dsh-query" data-role="query">Waiting for query</div>
          <div class="dsh-actions" style="margin-top: 8px;">
            <a class="dsh-link" data-role="google-link" href="#" target="_blank" rel="noreferrer">Open Google search</a>
          </div>
        </div>
        <div class="dsh-section">
          <h3>Results</h3>
          <div data-role="results"></div>
        </div>
        <div class="dsh-section">
          <h3>Status</h3>
          <div class="dsh-status" data-role="status">Ready</div>
        </div>
      </div>
      <div class="dsh-footer">Source: Presto Music (classical search).</div>
    `;

    document.body.appendChild(panel);

    const toggleButton = panel.querySelector(".dsh-toggle");
    toggleButton.addEventListener("click", () => {
      panel.classList.toggle("is-collapsed");
      toggleButton.textContent = panel.classList.contains("is-collapsed") ? "Show" : "Hide";
    });

    state.panel = panel;
    state.statusEl = panel.querySelector("[data-role='status']");
    state.resultsEl = panel.querySelector("[data-role='results']");
    state.queryEl = panel.querySelector("[data-role='query']");
    state.googleLinkEl = panel.querySelector("[data-role='google-link']");

    return panel;
  }

  function setStatus(text) {
    if (state.statusEl) {
      state.statusEl.textContent = text;
    }
  }

  function setQuery(text) {
    if (state.queryEl) {
      state.queryEl.textContent = text || "";
    }
  }

  function setGoogleLink(query) {
    if (!state.googleLinkEl) {
      return;
    }
    const terms = query ? `${query} barcode upc ean` : "";
    state.googleLinkEl.href = `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
  }

  function renderResults(results) {
    if (!state.resultsEl) {
      return;
    }

    if (!results.length) {
      state.resultsEl.innerHTML = "<div class='dsh-status'>No results yet.</div>";
      return;
    }

    state.resultsEl.innerHTML = "";

    results.forEach((result) => {
      const card = document.createElement("div");
      card.className = "dsh-result";

      const img = document.createElement("img");
      img.src = result.cover || "";
      img.alt = result.title || "No cover";
      if (!result.cover) {
        img.style.background = "#dfe7e4";
      }

      const meta = document.createElement("div");

      const titleEl = document.createElement("div");
      titleEl.className = "dsh-result-title";
      titleEl.textContent = result.title || "Untitled";

      const artistEl = document.createElement("div");
      artistEl.className = "dsh-result-artist";
      artistEl.textContent = result.artist || "Artist not found";

      const barcodeEl = document.createElement("div");
      barcodeEl.className = "dsh-result-barcode";
      barcodeEl.textContent = result.barcode ? `Barcode: ${result.barcode}` : "Barcode not found";

      const actions = document.createElement("div");
      actions.className = "dsh-actions";

      const searchBarcode = document.createElement("button");
      searchBarcode.type = "button";
      searchBarcode.className = "dsh-button";
      searchBarcode.textContent = "Search Douban (barcode)";
      if (!result.barcode) {
        searchBarcode.disabled = true;
      }
      searchBarcode.addEventListener("click", () => startDoubanSearch(result, "barcode"));

      const searchName = document.createElement("button");
      searchName.type = "button";
      searchName.className = "dsh-button secondary";
      searchName.textContent = "Search Douban (name)";
      searchName.addEventListener("click", () => startDoubanSearch(result, "name"));

      const prestoLink = document.createElement("a");
      prestoLink.className = "dsh-button ghost";
      prestoLink.textContent = "Open Presto";
      prestoLink.href = result.url || "#";
      prestoLink.target = "_blank";
      prestoLink.rel = "noreferrer";

      actions.appendChild(searchBarcode);
      actions.appendChild(searchName);
      actions.appendChild(prestoLink);

      meta.appendChild(titleEl);
      meta.appendChild(artistEl);
      meta.appendChild(barcodeEl);
      meta.appendChild(actions);

      card.appendChild(img);
      card.appendChild(meta);

      state.resultsEl.appendChild(card);
    });
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || { ok: false, error: "No response" });
      });
    });
  }

  async function downloadCover(candidate) {
    if (!candidate || !candidate.cover) {
      return { ok: false, error: "No cover url" };
    }
    const filename = buildCoverFilename(candidate);
    return sendMessage({ type: "downloadCover", url: candidate.cover, filename });
  }

  function storageGet() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STATE_KEY], (result) => {
        resolve(result[STATE_KEY] || {});
      });
    });
  }

  function storageSet(nextState) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STATE_KEY]: nextState }, () => resolve());
    });
  }

  async function updateState(patch) {
    const current = await storageGet();
    const next = { ...current, ...patch };
    await storageSet(next);
    return next;
  }

  function buildDoubanSearchUrl(searchText) {
    let host = "https://music.douban.com/subject_search";
    let queryKey = "search_text";

    if (page.url.hostname === "search.douban.com") {
      host = "https://search.douban.com/music/subject_search";
    } else if (page.url.hostname === "www.douban.com") {
      host = "https://www.douban.com/search";
      queryKey = "q";
    }
    const params = new URLSearchParams({
      [queryKey]: searchText,
      cat: "1003"
    });
    return `${host}?${params.toString()}`;
  }

  async function ensureCandidateDetails(candidate) {
    if (!candidate || !candidate.url) {
      return candidate;
    }
    if (candidate.barcode && candidate.releaseDate && candidate.publisher) {
      return candidate;
    }
    try {
      setStatus("Loading Presto details...");
      const detailHtml = await fetchHtml(candidate.url);
      const detail = parsePrestoProduct(detailHtml, candidate.url);
      return mergeResult(candidate, detail);
    } catch (error) {
      return candidate;
    }
  }

  async function startDoubanSearch(candidate, mode) {
    const enriched = await ensureCandidateDetails(candidate);
    const searchText = mode === "barcode" && enriched.barcode
      ? enriched.barcode
      : `${enriched.title || ""} ${enriched.artist || ""}`.trim();

    if (!searchText) {
      setStatus("Missing search text.");
      return;
    }

    await updateState({
      candidate: enriched,
      pending: {
        mode,
        searchText,
        stage: "search",
        createdAt: Date.now()
      }
    });

    window.location.href = buildDoubanSearchUrl(searchText);
  }

  async function fetchHtml(url) {
    const response = await sendMessage({ type: "fetchHtml", url });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "Fetch failed");
    }
    return response.text;
  }

  function parsePrestoSearch(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll("a[href*='/products/']"));
    const results = [];
    const seen = new Set();

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) {
        return;
      }
      const url = new URL(href, PRESTO_BASE).toString();
      if (seen.has(url)) {
        return;
      }
      seen.add(url);

      const container = link.closest("article, li, div") || link.parentElement;
      const title = preferText(
        container && container.querySelector("[class*='title']")?.textContent,
        link.getAttribute("title"),
        link.textContent,
        container && container.querySelector("img")?.getAttribute("alt")
      );

      const artist = preferText(
        container && container.querySelector("[class*='artist']")?.textContent,
        container && container.querySelector("[class*='composer']")?.textContent,
        container && container.querySelector("[class*='performer']")?.textContent,
        container && container.querySelector("[itemprop='byArtist']")?.textContent
      );

      const img = container ? container.querySelector("img") : null;
      const coverRaw = preferText(
        img?.getAttribute("data-src"),
        img?.getAttribute("src"),
        img?.getAttribute("data-srcset")?.split(" ")[0]
      );
      let cover = coverRaw;
      if (coverRaw) {
        try {
          cover = new URL(coverRaw, PRESTO_BASE).toString();
        } catch (error) {
          cover = coverRaw;
        }
      }

      if (!title) {
        return;
      }

      results.push({
        title,
        artist,
        cover,
        url
      });
    });

    return results.slice(0, 6);
  }

  function extractJsonLd(doc) {
    const nodes = Array.from(doc.querySelectorAll("script[type='application/ld+json']"));
    const items = [];
    nodes.forEach((node) => {
      try {
        const parsed = JSON.parse(node.textContent);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => items.push(item));
        } else {
          items.push(parsed);
        }
      } catch (error) {
        return;
      }
    });
    return items;
  }

  function normalizeBarcode(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return /^\d{8,14}$/.test(digits) ? digits : "";
  }

  function normalizeDate(value) {
    const text = cleanText(value);
    if (!text) {
      return "";
    }
    const stripped = text.replace(/(\d+)(st|nd|rd|th)/gi, "$1").replace(/,/g, "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(stripped)) {
      return stripped;
    }
    if (/^\d{4}-\d{2}$/.test(stripped)) {
      return `${stripped}-01`;
    }
    if (/^\d{4}$/.test(stripped)) {
      return `${stripped}-01-01`;
    }
    const parsedEnglish = parseEnglishDate(stripped);
    if (parsedEnglish) {
      return parsedEnglish;
    }
    const parsed = new Date(stripped);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return "";
  }

  function parseEnglishDate(value) {
    const text = cleanText(value);
    if (!text) {
      return "";
    }
    const monthMap = {
      jan: 1,
      january: 1,
      feb: 2,
      february: 2,
      mar: 3,
      march: 3,
      apr: 4,
      april: 4,
      may: 5,
      jun: 6,
      june: 6,
      jul: 7,
      july: 7,
      aug: 8,
      august: 8,
      sep: 9,
      sept: 9,
      september: 9,
      oct: 10,
      october: 10,
      nov: 11,
      november: 11,
      dec: 12,
      december: 12
    };

    const dayMonthYear = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    const monthDayYear = text.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
    const parts = dayMonthYear || monthDayYear;
    if (!parts) {
      return "";
    }

    const day = Number(dayMonthYear ? parts[1] : parts[2]);
    const monthName = (dayMonthYear ? parts[2] : parts[1]).toLowerCase();
    const year = Number(parts[3]);
    const month = monthMap[monthName];
    if (!month || !day || !year) {
      return "";
    }

    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function extractLabelValue(doc, labelRegex) {
    const candidates = Array.from(doc.querySelectorAll("dt, th, strong, span, div, li"));
    for (const node of candidates) {
      const labelText = cleanText(node.textContent);
      if (!labelText || !labelRegex.test(labelText)) {
        continue;
      }
      if (node.nextSibling && node.nextSibling.nodeType === Node.TEXT_NODE) {
        const raw = cleanText(node.nextSibling.textContent);
        if (raw) {
          return raw;
        }
      }
      const next = node.nextElementSibling;
      if (next) {
        const value = cleanText(next.textContent);
        if (value) {
          return value;
        }
      }
      const parent = node.parentElement;
      if (parent) {
        const link = parent.querySelector("a");
        if (link) {
          const value = cleanText(link.textContent);
          if (value) {
            return value;
          }
        }
        const parentText = stripLabel(parent.textContent, labelText);
        if (parentText) {
          return parentText;
        }
        const siblingValue = parent.querySelector("dd, td, span");
        if (siblingValue) {
          const value = cleanText(siblingValue.textContent);
          if (value) {
            return value;
          }
        }
      }
    }
    return "";
  }

  function extractArtist(value) {
    if (!value) {
      return "";
    }
    if (typeof value === "string") {
      return cleanText(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => extractArtist(item)).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      return cleanText(value.name || value.title || value["@id"] || "");
    }
    return "";
  }

  function parseDefinitionList(doc) {
    const data = {};
    const terms = Array.from(doc.querySelectorAll("dt"));
    terms.forEach((term) => {
      const label = cleanText(term.textContent).toLowerCase();
      const valueNode = term.nextElementSibling;
      if (!label || !valueNode) {
        return;
      }
      const value = cleanText(valueNode.textContent);
      if (!value) {
        return;
      }
      data[label] = value;
    });
    return data;
  }

  function parseMetadataList(doc) {
    const data = {
      releaseDate: "",
      publisher: ""
    };
    const items = Array.from(doc.querySelectorAll(".c-product-block__metadata li"));
    items.forEach((item) => {
      const labelNode = item.querySelector("strong");
      if (!labelNode) {
        return;
      }
      const label = cleanText(labelNode.textContent).toLowerCase();
      if (!label) {
        return;
      }
      if (label.includes("release date") && !data.releaseDate) {
        data.releaseDate = stripLabel(item.textContent, labelNode.textContent);
        return;
      }
      if ((label.includes("label") || label.includes("publisher")) && !data.publisher) {
        const link = item.querySelector("a");
        data.publisher = link ? cleanText(link.textContent) : stripLabel(item.textContent, labelNode.textContent);
      }
    });
    return data;
  }

  function parseContributors(doc) {
    const block = doc.querySelector(".c-newproduct-block__contributors");
    if (!block) {
      return "";
    }
    const items = Array.from(block.querySelectorAll("p, li"))
      .map((node) => cleanText(node.textContent))
      .filter(Boolean);
    const unique = Array.from(new Set(items));
    if (unique.length) {
      return unique.join(", ");
    }
    return cleanText(block.textContent);
  }

  function parsePrestoProduct(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const info = {
      url,
      title: "",
      artist: "",
      cover: "",
      barcode: "",
      releaseDate: "",
      publisher: "",
      reference: url
    };

    const ldItems = extractJsonLd(doc);
    ldItems.forEach((item) => {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      const isProduct = types.some((type) => String(type || "").toLowerCase().includes("product"));
      const isAlbum = types.some((type) => String(type || "").toLowerCase().includes("musicalbum"));
      if (!isProduct && !isAlbum) {
        return;
      }
      info.title = preferText(info.title, item.name);
      info.cover = preferText(info.cover, Array.isArray(item.image) ? item.image[0] : item.image);
      info.artist = preferText(info.artist, extractArtist(item.byArtist || item.artist || item.author));
      info.barcode = preferText(info.barcode, normalizeBarcode(item.gtin13 || item.gtin12 || item.gtin14 || item.gtin8 || item.mpn || item.sku));
      info.releaseDate = preferText(info.releaseDate, normalizeDate(item.releaseDate || item.datePublished));
      info.publisher = preferText(info.publisher, extractArtist(item.brand || item.publisher));
    });

    info.title = preferText(info.title, doc.querySelector("meta[property='og:title']")?.getAttribute("content"));
    info.cover = preferText(info.cover, doc.querySelector("meta[property='og:image']")?.getAttribute("content"));
    if (info.cover) {
      try {
        info.cover = new URL(info.cover, PRESTO_BASE).toString();
      } catch (error) {
        info.cover = info.cover;
      }
    }

    const contributorText = parseContributors(doc);
    if (contributorText) {
      info.artist = contributorText;
    }

    const metaRelease = doc.querySelector("meta[property='music:release_date']")?.getAttribute("content");
    info.releaseDate = preferText(info.releaseDate, normalizeDate(metaRelease));

    const dlData = parseDefinitionList(doc);
    Object.keys(dlData).forEach((label) => {
      const value = dlData[label];
      if (!value) {
        return;
      }
      if (!info.publisher && (label.includes("label") || label.includes("publisher"))) {
        info.publisher = value;
      }
      if (!info.releaseDate && label.includes("release")) {
        info.releaseDate = normalizeDate(value);
      }
      if (!info.barcode && (label.includes("ean") || label.includes("upc") || label.includes("barcode") || label.includes("gtin"))) {
        info.barcode = normalizeBarcode(value);
      }
    });

    const metadata = parseMetadataList(doc);
    if (!info.releaseDate && metadata.releaseDate) {
      info.releaseDate = normalizeDate(metadata.releaseDate);
    }
    if (!info.publisher && metadata.publisher) {
      info.publisher = metadata.publisher;
    }

    if (!info.releaseDate) {
      const releaseValue = extractLabelValue(doc, /release date|released/i);
      info.releaseDate = normalizeDate(releaseValue);
    }

    if (!info.publisher) {
      const labelValue = extractLabelValue(doc, /label|publisher/i);
      info.publisher = labelValue;
    }

    if (!info.barcode) {
      const match = html.match(/\b(?:EAN|UPC|Barcode|Bar code|GTIN)\b[^\d]{0,8}(\d{8,14})/i);
      if (match) {
        info.barcode = normalizeBarcode(match[1]);
      }
    }

    return info;
  }

  function mergeResult(base, detail) {
    return {
      ...base,
      ...detail,
      title: preferText(detail.title, base.title),
      artist: preferText(detail.artist, base.artist),
      cover: preferText(detail.cover, base.cover),
      barcode: preferText(detail.barcode, base.barcode)
    };
  }

  async function loadPrestoResults(query) {
    setStatus("Searching Presto...");
    const searchUrls = [
      `${PRESTO_SEARCH}${encodeURIComponent(query)}`,
      `${PRESTO_SEARCH_ALL}${encodeURIComponent(query)}`
    ];
    let results = [];
    for (const searchUrl of searchUrls) {
      const html = await fetchHtml(searchUrl);
      results = parsePrestoSearch(html);
      if (results.length) {
        break;
      }
    }

    if (!results.length) {
      setStatus("No Presto results.");
      renderResults([]);
      return;
    }

    state.results = results;
    renderResults(state.results);

    for (let i = 0; i < results.length; i += 1) {
      try {
        const detailHtml = await fetchHtml(results[i].url);
        const detail = parsePrestoProduct(detailHtml, results[i].url);
        state.results[i] = mergeResult(results[i], detail);
        renderResults(state.results);
      } catch (error) {
        continue;
      }
    }

    setStatus("Presto results ready.");
  }

  function findResultLinks() {
    const anchors = Array.from(document.querySelectorAll("a[href*='/subject/']"));
    return anchors.filter((anchor) => {
      if (!/\/subject\/\d+/.test(anchor.href)) {
        return false;
      }
      if (!anchor.offsetParent) {
        return false;
      }
      return true;
    });
  }

  function highlightResult(candidate) {
    const links = findResultLinks();
    if (!links.length) {
      return false;
    }

    let selected = links[0];
    if (candidate && candidate.title) {
      const lowerTitle = candidate.title.toLowerCase();
      const lowerArtist = (candidate.artist || "").toLowerCase();
      const match = links.find((link) => {
        const text = cleanText(link.textContent).toLowerCase();
        return text.includes(lowerTitle) || (lowerArtist && text.includes(lowerArtist));
      });
      if (match) {
        selected = match;
      }
    }

    const container = selected.closest(".result, .item, li, .subject-item") || selected;
    container.classList.add("dsh-highlight");
    setStatus(`Found Douban entry: ${selected.href}`);
    return true;
  }

  async function handleSearchPage() {
    ensurePanel();

    const query = getSearchText();
    setQuery(query || "No search text detected.");
    setGoogleLink(query);

    const barcode = looksLikeBarcode(query);
    if (query && !barcode) {
      try {
        await loadPrestoResults(query);
      } catch (error) {
        setStatus("Presto search failed.");
      }
    }

    const stored = await storageGet();
    const pending = stored.pending;
    const matchesSearch = pending && pending.searchText && query
      && cleanText(pending.searchText).toLowerCase() === cleanText(query).toLowerCase();

    if (barcode && stored.candidate && matchesSearch && !state.results.length) {
      state.results = [stored.candidate];
      renderResults(state.results);
    }

    if (!pending || !stored.candidate) {
      return;
    }
    if (!matchesSearch) {
      return;
    }

    const found = highlightResult(stored.candidate);
    if (found) {
      await updateState({ pending: null });
      return;
    }

    if (pending.stage === "search") {
      await updateState({ pending: { ...pending, stage: "create" } });
      window.location.href = "https://music.douban.com/new_subject?cat=1003";
    }
  }

  function isFirstStepForm() {
    return Boolean(document.querySelector("#p_title, input[name='p_title']"));
  }

  function isDetailForm() {
    return Boolean(document.querySelector("form.detail_form"));
  }

  function fillInput(input, value) {
    if (!input || value === undefined || value === null) {
      return;
    }
    if (input.value && input.value.trim()) {
      return;
    }
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillInputForce(input, value) {
    if (!input || value === undefined || value === null) {
      return;
    }
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function splitPerformers(text) {
    const normalized = cleanText(text)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s*（[^）]*）\s*/g, " ");
    return normalized
      .split(/,|&|;|\//)
      .map((part) => cleanText(part))
      .filter(Boolean);
  }

  async function maybeDownloadCover(candidate) {
    if (!candidate || !candidate.cover) {
      return;
    }
    const downloadKey = `${candidate.cover}|${candidate.url || ""}`;
    const stored = await storageGet();
    if (stored.downloadedCoverKey === downloadKey) {
      return;
    }
    const pendingKey = stored.downloadingCoverKey;
    const pendingAt = stored.downloadingCoverAt || 0;
    if (pendingKey === downloadKey && Date.now() - pendingAt < 120000) {
      return;
    }
    if (pendingKey === downloadKey) {
      await updateState({ downloadingCoverKey: null, downloadingCoverAt: null });
    }
    await updateState({ downloadingCoverKey: downloadKey, downloadingCoverAt: Date.now() });
    const response = await downloadCover(candidate);
    if (response && response.ok) {
      await updateState({
        downloadedCoverKey: downloadKey,
        downloadingCoverKey: null,
        downloadingCoverAt: null
      });
    } else {
      await updateState({ downloadingCoverKey: null, downloadingCoverAt: null });
      setStatus(`Cover download failed: ${response?.error || "unknown error"}`);
    }
  }

  async function handleNewSubjectPage() {
    ensurePanel();
    const stored = await storageGet();
    const candidate = stored.candidate;
    const pending = stored.pending;

    if (!candidate) {
      setStatus("No candidate found. Go back to search page to pick one.");
      return;
    }

    setQuery(`${candidate.title || ""} ${candidate.artist || ""}`.trim() || "Candidate loaded.");
    setGoogleLink(`${candidate.title || ""} ${candidate.artist || ""}`.trim());
    renderResults([candidate]);

    const stage = pending && pending.stage ? pending.stage : "manual";

    if (isFirstStepForm()) {
      const titleInput = document.querySelector("#p_title, input[name='p_title']");
      const barcodeInput = document.querySelector("#uid, input[name='p_uid']");
      fillInputForce(titleInput, candidate.title || "");
      if (candidate.barcode) {
        fillInputForce(barcodeInput, candidate.barcode);
      }

      const form = titleInput ? titleInput.closest("form") : document.querySelector("form");
      const shouldSubmit = Boolean(pending && stage !== "detail");
      if (form && shouldSubmit) {
        await updateState({ pending: { ...pending, stage: "detail" } });
        setStatus("Filled first step. Submitting...");
        setTimeout(() => form.submit(), 300);
      } else {
        setStatus("Filled first step. Submit when ready.");
      }
      return;
    }

    if (isDetailForm()) {
      void maybeDownloadCover(candidate);

      const titleInput = document.querySelector("#p_27, input[name='p_27']");
      const barcodeInput = document.querySelector("#p_53, input[name='p_53']");
      const performerInputs = Array.from(document.querySelectorAll("input[name='p_48']"));
      const releaseInput = document.querySelector("#p_51, input[name='p_51']");
      const publisherInput = document.querySelector("#p_50, input[name='p_50']");
      const referenceInput = document.querySelector("textarea[name='p_152_other']");

      fillInputForce(titleInput, candidate.title || "");
      if (candidate.barcode) {
        fillInputForce(barcodeInput, candidate.barcode);
      }

      const performers = splitPerformers(candidate.artist || "");
      performerInputs.forEach((input, index) => {
        fillInput(input, performers[index]);
      });

      fillInput(releaseInput, candidate.releaseDate || "");
      fillInput(publisherInput, candidate.publisher || "");
      fillInput(referenceInput, candidate.reference || candidate.url || "");

      const missing = [];
      if (releaseInput && !releaseInput.value.trim()) {
        missing.push("发行时间");
      }
      if (publisherInput && !publisherInput.value.trim()) {
        missing.push("出版者");
      }
      if (referenceInput && !referenceInput.value.trim()) {
        missing.push("参考资料");
      }

      if (missing.length) {
        setStatus(`Detail form filled. Missing: ${missing.join(" / ")}`);
      } else {
        setStatus("Detail form filled.");
      }

      if (pending) {
        await updateState({ pending: null });
      }
    }
  }

  async function init() {
    if (isSearchPage()) {
      await handleSearchPage();
    }
    if (isNewSubjectPage()) {
      await handleNewSubjectPage();
    }
  }

  init();
})();
