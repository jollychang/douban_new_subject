import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const STATE_KEY = "doubanSubjectHelper";
const SCRIPT_SOURCE = readFileSync(
  new URL("../content/douban.js", import.meta.url),
  "utf8"
);

const staleCandidate = {
  title: "Kienzl: String Quartets Nos. 1, 2 & 3 (Digital Download)",
  artist: "Thomas Christian Ensemble",
  cover: "https://example.test/kienzl.jpg",
  url: "https://www.prestomusic.com/classical/products/old-kienzl"
};

const oblivionCandidate = {
  title: "Oblivion",
  artist: "Hee-Young Lim & Chuan Chen",
  cover: "https://example.test/oblivion.jpg",
  url: "/classical/products/9868890--oblivion"
};

class FakeClassList {
  constructor(initial = "") {
    this.values = new Set(String(initial).split(/\s+/).filter(Boolean));
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name) {
    if (this.values.has(name)) {
      this.values.delete(name);
      return false;
    }
    this.values.add(name);
    return true;
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentElement = null;
    this.style = {};
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.className = "";
    this.id = "";
    this.value = "";
    this.textContent = "";
    this.href = "";
    this.src = "";
    this.alt = "";
    this.disabled = false;
    this.listeners = new Map();
    this._innerHTML = "";
    this._queryMap = new Map();
    this._form = null;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    this._queryMap.clear();

    if (!this._innerHTML.includes("data-role=\"status\"")) {
      return;
    }

    const toggle = this.ownerDocument.createElement("button");
    toggle.className = "dsh-toggle";
    toggle.classList = new FakeClassList(toggle.className);

    const status = this.ownerDocument.createElement("div");
    status.textContent = "Ready";
    const results = this.ownerDocument.createElement("div");
    const query = this.ownerDocument.createElement("div");
    const googleLink = this.ownerDocument.createElement("a");

    this._queryMap.set(".dsh-toggle", toggle);
    this._queryMap.set("[data-role='status']", status);
    this._queryMap.set("[data-role='results']", results);
    this._queryMap.set("[data-role='query']", query);
    this._queryMap.set("[data-role='google-link']", googleLink);

    this.appendChild(toggle);
    this.appendChild(query);
    this.appendChild(googleLink);
    this.appendChild(results);
    this.appendChild(status);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatchEvent() {
    return true;
  }

  querySelector(selector) {
    return this._queryMap.get(selector) || null;
  }

  querySelectorAll() {
    return [];
  }

  closest(selector) {
    if (selector === "form") {
      return this._form || (this.tagName === "FORM" ? this : null);
    }
    return null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement("body", this);
    this.selectors = new Map();
    this.selectorLists = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  querySelector(selector) {
    return this.selectors.get(selector) || null;
  }

  querySelectorAll(selector) {
    return this.selectorLists.get(selector) || [];
  }

  register(selector, element) {
    this.selectors.set(selector, element);
  }

  registerAll(selector, elements) {
    this.selectorLists.set(selector, elements);
  }
}

function createFirstStep(document, initialTitle = "") {
  const form = document.createElement("form");
  form.submitCount = 0;
  form.submit = () => {
    form.submitCount += 1;
  };

  const titleInput = document.createElement("input");
  titleInput.value = initialTitle;
  titleInput._form = form;
  const barcodeInput = document.createElement("input");
  barcodeInput._form = form;

  document.register("#p_title, input[name='p_title']", titleInput);
  document.register("#uid, input[name='p_uid']", barcodeInput);
  document.register("form", form);

  return { form, titleInput, barcodeInput };
}

function createDetailStep(document) {
  const form = document.createElement("form");
  const titleInput = document.createElement("input");
  const barcodeInput = document.createElement("input");
  const performerInputs = [
    document.createElement("input"),
    document.createElement("input")
  ];
  const releaseInput = document.createElement("input");
  const publisherInput = document.createElement("input");
  const referenceInput = document.createElement("textarea");

  document.register("form.detail_form", form);
  document.register("#p_27, input[name='p_27']", titleInput);
  document.register("#p_53, input[name='p_53']", barcodeInput);
  document.register("#p_51, input[name='p_51']", releaseInput);
  document.register("#p_50, input[name='p_50']", publisherInput);
  document.register("textarea[name='p_152_other']", referenceInput);
  document.registerAll("input[name='p_48']", performerInputs);

  return {
    titleInput,
    barcodeInput,
    performerInputs,
    releaseInput,
    publisherInput,
    referenceInput
  };
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function createHarness({
  url,
  initialState = {},
  form = "first",
  initialTitle = "",
  pageSearchText = "",
  onMessage = () => ({ ok: false, error: "Unstubbed request" }),
  onStorageSet = () => undefined
}) {
  const document = new FakeDocument();
  const formElements = form === "detail"
    ? createDetailStep(document)
    : createFirstStep(document, initialTitle);

  if (pageSearchText) {
    const searchInput = document.createElement("input");
    searchInput.value = pageSearchText;
    document.register(
      "input[name='search_text'], input[name='q'], #inp-query",
      searchInput
    );
  }

  let storageState = clone(initialState);
  const messages = [];
  const timers = [];

  const chrome = {
    storage: {
      local: {
        get(_keys, callback) {
          queueMicrotask(() => callback({ [STATE_KEY]: clone(storageState) }));
        },
        set(next, callback) {
          const nextState = clone(next[STATE_KEY]);
          Promise.resolve(onStorageSet(clone(nextState))).then(() => {
            storageState = nextState;
            callback();
          });
        }
      }
    },
    runtime: {
      sendMessage(message, callback) {
        messages.push(clone(message));
        Promise.resolve(onMessage(message))
          .then((response) => callback(clone(response)));
      }
    }
  };

  const context = vm.createContext({
    URL,
    URLSearchParams,
    Event: class FakeEvent {
      constructor(type, options) {
        this.type = type;
        this.bubbles = Boolean(options?.bubbles);
      }
    },
    Node: { TEXT_NODE: 3 },
    DOMParser: class FakeDOMParser {
      parseFromString() {
        return {
          querySelector: () => null,
          querySelectorAll: () => []
        };
      }
    },
    document,
    window: { location: { href: url } },
    chrome,
    console,
    setTimeout(callback) {
      timers.push(callback);
      return timers.length;
    },
    clearTimeout() {}
  });

  vm.runInContext(SCRIPT_SOURCE, context, { filename: "content/douban.js" });

  return {
    document,
    formElements,
    messages,
    get storageState() {
      return storageState;
    },
    get panel() {
      return document.body.children.find((element) => element.id === "douban-helper-panel");
    },
    runTimers() {
      timers.splice(0).forEach((callback) => callback());
    }
  };
}

function prestoApiResponse(results = [oblivionCandidate]) {
  return {
    ok: true,
    data: {
      payload: results.map((result) => ({
        text: result.title,
        secondLine: result.artist,
        image: result.cover,
        url: result.url
      }))
    }
  };
}

function findByClass(root, className) {
  if (!root) {
    return [];
  }
  const matches = String(root.className).split(/\s+/).includes(className)
    ? [root]
    : [];
  return root.children.reduce(
    (all, child) => all.concat(findByClass(child, className)),
    matches
  );
}

function resultTitles(harness) {
  return findByClass(harness.panel, "dsh-result-title")
    .map((element) => element.textContent);
}

function panelNode(harness, selector) {
  return harness.panel?.querySelector(selector) || null;
}

async function settle(iterations = 30) {
  for (let index = 0; index < iterations; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

test("URL query replaces stale candidate on both sides without auto-submit", async () => {
  const apiQueries = [];
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003&search_text=Oblivion+Hee-Young+Lim+%26+Chuan+Chen",
    initialState: {
      candidate: staleCandidate,
      pending: {
        mode: "name",
        searchText: "Kienzl Thomas Christian Ensemble",
        stage: "create"
      }
    },
    initialTitle: "Existing Douban value",
    pageSearchText: "Wrong page input",
    onMessage(message) {
      if (message.type === "fetchJson") {
        apiQueries.push(JSON.parse(message.body).searchText);
        return prestoApiResponse();
      }
      return { ok: false, error: "Detail unavailable in test" };
    }
  });

  await settle();
  harness.runTimers();

  assert.equal(harness.formElements.titleInput.value, "Oblivion");
  assert.deepEqual(resultTitles(harness), ["Oblivion"]);
  assert.match(
    panelNode(harness, "[data-role='query']").textContent,
    /Oblivion/
  );
  assert.equal(harness.formElements.form.submitCount, 0);
  assert.equal(harness.storageState.candidate.title, "Oblivion");
  assert.equal(apiQueries[0], "Oblivion Hee-Young Lim & Chuan Chen");
});

test("a unique exact result is selected from multiple Presto results", async () => {
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003&search_text=Oblivion+Hee-Young+Lim+%26+Chuan+Chen",
    initialTitle: "Keep this title",
    onMessage(message) {
      if (message.type === "fetchJson") {
        return prestoApiResponse([
          {
            title: "Oblivion",
            artist: "Hee-Young Lim, Chuan Chen",
            cover: "",
            url: "/classical/products/9868890--oblivion"
          },
          {
            title: "Oblivion: Remastered",
            artist: "Hee-Young Lim",
            cover: "",
            url: "/classical/products/other"
          }
        ]);
      }
      return { ok: false, error: "Detail unavailable in test" };
    }
  });

  await settle();

  assert.equal(harness.formElements.titleInput.value, "Oblivion");
  assert.deepEqual(resultTitles(harness), ["Oblivion"]);
  assert.equal(harness.formElements.form.submitCount, 0);
});

test("failed URL lookup never falls back to stale candidate", async () => {
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003&search_text=Missing+Album",
    initialState: {
      candidate: staleCandidate,
      pending: { mode: "name", searchText: "Kienzl", stage: "create" }
    },
    initialTitle: "Keep this title",
    onMessage: () => ({ ok: false, error: "Network unavailable" })
  });

  await settle();
  harness.runTimers();

  assert.equal(harness.formElements.titleInput.value, "Keep this title");
  assert.ok(!resultTitles(harness).includes(staleCandidate.title));
  assert.equal(harness.formElements.form.submitCount, 0);
  assert.match(
    panelNode(harness, "[data-role='status']").textContent,
    /failed|error|no presto results/i
  );
});

test("ambiguous URL lookup shows no stale fallback and fills no candidate", async () => {
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003&search_text=Oblivion+Hee-Young+Lim+%26+Chuan+Chen",
    initialState: {
      candidate: staleCandidate,
      pending: { mode: "name", searchText: "Kienzl", stage: "create" }
    },
    initialTitle: "Keep this title",
    onMessage(message) {
      if (message.type === "fetchJson") {
        return prestoApiResponse([
          {
            title: "Oblivion: Remastered",
            artist: "Hee-Young Lim",
            cover: "",
            url: "/classical/products/one"
          },
          {
            title: "The Oblivion Sessions",
            artist: "Chuan Chen",
            cover: "",
            url: "/classical/products/two"
          }
        ]);
      }
      return { ok: false, error: "Detail unavailable in test" };
    }
  });

  await settle();
  harness.runTimers();

  assert.equal(harness.formElements.titleInput.value, "Keep this title");
  assert.ok(!resultTitles(harness).includes(staleCandidate.title));
  assert.equal(harness.formElements.form.submitCount, 0);
});

test("stale candidate is ignored without search_text or pending create state", async () => {
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003",
    initialState: { candidate: staleCandidate, pending: null },
    initialTitle: "Keep this title"
  });

  await settle();

  assert.equal(harness.formElements.titleInput.value, "Keep this title");
  assert.ok(!resultTitles(harness).includes(staleCandidate.title));
  assert.equal(harness.formElements.form.submitCount, 0);
});

test("pending create flow still fills and automatically submits first step", async () => {
  const candidate = {
    ...oblivionCandidate,
    barcode: "1234567890123"
  };
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003",
    initialState: {
      candidate,
      pending: {
        mode: "name",
        searchText: "Oblivion Hee-Young Lim Chuan Chen",
        stage: "create"
      }
    }
  });

  await settle();

  assert.equal(harness.formElements.titleInput.value, "Oblivion");
  assert.equal(harness.formElements.barcodeInput.value, "1234567890123");
  assert.equal(harness.storageState.pending.stage, "detail");
  assert.equal(harness.formElements.form.submitCount, 0);

  harness.runTimers();
  assert.equal(harness.formElements.form.submitCount, 1);
});

test("detail completion clears both candidate and pending state", async () => {
  const candidate = {
    title: "Oblivion",
    artist: "Hee-Young Lim & Chuan Chen",
    barcode: "1234567890123",
    releaseDate: "2026-01-02",
    publisher: "Test Label",
    reference: "https://www.prestomusic.com/classical/products/9868890--oblivion"
  };
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003",
    form: "detail",
    initialState: {
      candidate,
      pending: {
        mode: "name",
        searchText: "Oblivion Hee-Young Lim Chuan Chen",
        stage: "detail"
      }
    }
  });

  await settle();

  assert.equal(harness.formElements.titleInput.value, "Oblivion");
  assert.deepEqual(
    harness.formElements.performerInputs.map((input) => input.value),
    ["Hee-Young Lim", "Chuan Chen"]
  );
  assert.equal(harness.storageState.candidate ?? null, null);
  assert.equal(harness.storageState.pending ?? null, null);
});

test("detail completion cannot be undone by a delayed cover state write", async () => {
  let releaseDownloadingWrite;
  let markDownloadingWrite;
  const downloadingWriteGate = new Promise((resolve) => {
    releaseDownloadingWrite = resolve;
  });
  const downloadingWriteSeen = new Promise((resolve) => {
    markDownloadingWrite = resolve;
  });
  const candidate = {
    ...oblivionCandidate,
    reference: "https://www.prestomusic.com/classical/products/9868890--oblivion"
  };
  const harness = createHarness({
    url: "https://music.douban.com/new_subject?cat=1003",
    form: "detail",
    initialState: {
      candidate,
      pending: {
        mode: "name",
        searchText: "Oblivion Hee-Young Lim Chuan Chen",
        stage: "detail"
      }
    },
    onMessage(message) {
      if (message.type === "downloadCover") {
        return { ok: true };
      }
      return { ok: false, error: "Unexpected request" };
    },
    onStorageSet(nextState) {
      if (nextState.downloadingCoverKey && nextState.candidate) {
        markDownloadingWrite();
        return downloadingWriteGate;
      }
      return undefined;
    }
  });

  await downloadingWriteSeen;
  await settle();
  releaseDownloadingWrite();
  await settle();

  assert.equal(harness.storageState.candidate ?? null, null);
  assert.equal(harness.storageState.pending ?? null, null);
});

test("new subject lookup decodes plus and percent-encoded ampersand from URL", async () => {
  const apiQueries = [];
  createHarness({
    url: "https://music.douban.com/new_subject?cat=1003&search_text=Oblivion+Hee-Young+Lim+%26+Chuan+Chen",
    pageSearchText: "Page input must not win",
    onMessage(message) {
      if (message.type === "fetchJson") {
        apiQueries.push(JSON.parse(message.body).searchText);
        return prestoApiResponse();
      }
      return { ok: false, error: "Detail unavailable in test" };
    }
  });

  await settle();

  assert.equal(apiQueries[0], "Oblivion Hee-Young Lim & Chuan Chen");
});
