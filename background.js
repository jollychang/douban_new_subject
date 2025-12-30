chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "fetchHtml") {
    return false;
  }

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
});
