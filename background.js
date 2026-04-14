chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "fetchHtml" || message.type === "fetchJson") {
    const url = typeof message.url === "string" ? message.url : "";
    const method = typeof message.method === "string" ? message.method : "GET";
    const headers = message.headers && typeof message.headers === "object" ? message.headers : {};
    const body = typeof message.body === "string" ? message.body : undefined;
    if (!url) {
      sendResponse({ ok: false, error: "Missing url" });
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    fetch(url, {
      method,
      headers,
      body,
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text().then((text) => ({
          text,
          finalUrl: response.url,
          status: response.status
        }));
      })
      .then(({ text, finalUrl, status }) => {
        if (message.type === "fetchJson") {
          sendResponse({ ok: true, data: JSON.parse(text), text, finalUrl, status });
          return;
        }
        sendResponse({ ok: true, text, finalUrl, status });
      })
      .catch((error) => {
        const messageText = error && error.message ? error.message : "Fetch failed";
        sendResponse({ ok: false, error: messageText });
      })
      .finally(() => clearTimeout(timeoutId));

    return true;
  }

  if (message.type === "downloadCover") {
    const url = typeof message.url === "string" ? message.url : "";
    const filename = typeof message.filename === "string" ? message.filename : "";
    if (!url) {
      sendResponse({ ok: false, error: "Missing url" });
      return false;
    }

    const options = { url };
    if (filename) {
      options.filename = filename;
    }

    chrome.downloads.download(options, (downloadId) => {
      const error = chrome.runtime.lastError;
      if (error) {
        sendResponse({ ok: false, error: error.message || "Download failed" });
        return;
      }
      sendResponse({ ok: true, downloadId });
    });

    return true;
  }

  return false;
});
