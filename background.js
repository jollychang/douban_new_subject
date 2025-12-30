chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "fetchHtml") {
    const url = typeof message.url === "string" ? message.url : "";
    if (!url) {
      sendResponse({ ok: false, error: "Missing url" });
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch(url, {
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((text) => sendResponse({ ok: true, text }))
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
