(() => {
  "use strict";
  // devkitty-parser.js

  /* ======================================================
     DEVKITTY REGISTRY
  ====================================================== */

  const DevKittyRegistry = {
    icons: {},
    meta: null,

    register(name, data) {
      this.icons[name] = data;
    },

    get(name) {
      return this.icons[name];
    },

    clear() {
      this.icons = {};
      this.meta = null;
    }
  };

  /* ======================================================
     STRICT DKF PARSER (QUOTED PATHS)
  ====================================================== */

  function parseDKF(text) {
    // NOTE: this function CLEARS the registry
    DevKittyRegistry.clear();

    const normalized = text
      .replace(/\r/g, "")
      .replace(/\{/g, " { ")
      .replace(/\}/g, " } ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = normalized.split(" ");
    let i = 0;

    function expect(value) {
      if (tokens[i] !== value) {
        throw new Error(
          `DKF parse error: expected "${value}", got "${tokens[i]}"`
        );
      }
      i++;
    }

    function next() {
      return tokens[i++];
    }

    /* ---------- META ---------- */

    expect("@meta");
    expect("{");

    const meta = {};

    while (tokens[i] !== "}") {
      const key = next();
      const value = next();
      meta[key] = value;
    }

    expect("}");

    const requiredMeta = ["format", "version", "type", "mode", "iconCount"];
    for (const k of requiredMeta) {
      if (!meta[k]) {
        throw new Error(`DKF meta missing required field: ${k}`);
      }
    }

    if (meta.format !== "devkitty") throw new Error("Invalid DKF format");
    if (meta.type !== "icon") throw new Error("Invalid DKF type");
    if (!["single", "package"].includes(meta.mode)) {
      throw new Error("Invalid DKF mode");
    }

    DevKittyRegistry.meta = meta;

    /* ---------- ICONS ---------- */

    expect("@icons");
    expect("{");

    let iconCounter = 0;

    while (tokens[i] !== "}") {
      expect("icon");

      const iconName = next();
      expect("{");

      const icon = {
        viewBox: null,
        paths: []
      };

      while (tokens[i] !== "}") {
        const key = next();

        if (key === "viewBox:") {
          icon.viewBox =
            next() + " " + next() + " " + next() + " " + next();
        }

        else if (key === "paths") {
          expect("{");

          while (tokens[i] !== "}") {
            let token = next();

            if (!token.startsWith('"')) {
              throw new Error("SVG path must be wrapped in quotes");
            }

            let path = token;

            while (!path.endsWith('"')) {
              path += " " + next();
            }

            icon.paths.push(path.slice(1, -1));
          }

          expect("}");
        }

        else {
          throw new Error(`Unknown icon property: ${key}`);
        }
      }

      expect("}");

      if (!icon.viewBox) {
        throw new Error(`Icon "${iconName}" missing viewBox`);
      }

      if (icon.paths.length === 0) {
        throw new Error(`Icon "${iconName}" has no paths`);
      }

      DevKittyRegistry.register(iconName, icon);
      iconCounter++;
    }

    expect("}");

    if (iconCounter !== Number(meta.iconCount)) {
      throw new Error(
        `iconCount mismatch: meta=${meta.iconCount}, found=${iconCounter}`
      );
    }

    /* ---------- BUILD SVG BLOBS ---------- */

    for (const icon of Object.values(DevKittyRegistry.icons)) {
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">` +
        icon.paths.map(d => `<path d="${d}"/>`).join("") +
        `</svg>`;

      const blob = new Blob([svg], { type: "image/svg+xml" });
      icon.url = URL.createObjectURL(blob);
    }

    console.log(
      "DevKitty icons loaded:",
      Object.keys(DevKittyRegistry.icons)
    );
  }

  /* ======================================================
     APPEND-SAFE DKF PARSER
  ====================================================== */

  function parseDKFAppend(text) {
    const existingIcons = { ...DevKittyRegistry.icons };
    parseDKF(text);

    DevKittyRegistry.icons = {
      ...existingIcons,
      ...DevKittyRegistry.icons
    };
  }

  /* ======================================================
     LOAD DKF (ONE OR MANY)
  ====================================================== */

  async function loadDKF(...urls) {
    if (!urls.length) {
      throw new Error("loadDKF requires at least one URL");
    }

    for (const url of urls) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load DKF: ${url}`);
      }

      const text = await res.text();
      parseDKFAppend(text);
    }

    document.querySelectorAll("dk-el").forEach(el => el.render());
  }

  /* ======================================================
   AUTO-LOAD FROM <script data-dk="">
====================================================== */

  function autoLoadFromScriptTag() {
    const scripts = document.querySelectorAll("script[data-dk]");

    scripts.forEach(script => {
      const value = script.getAttribute("data-dk");
      if (!value) return;

      const files = value
        .split(/\s+/)
        .map(v => v.trim())
        .filter(Boolean);

      if (files.length) {
        loadDKF(...files);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoLoadFromScriptTag);
  } else {
    autoLoadFromScriptTag();
  }

  /* ======================================================
     <dk-el> CUSTOM ELEMENT
  ====================================================== */

  class DevKittyElement extends HTMLElement {
    connectedCallback() {
      this.render();
    }

    render() {
      const iconName = this.getAttribute("icon");
      if (!iconName) return;

      const icon = DevKittyRegistry.get(iconName);
      if (!icon || !icon.url) return;

      const size = this.getAttribute("size") || 24;
      const color = this.getAttribute("color") || "currentColor";

      this.textContent = "";

      this.style.display = "inline-block";
      this.style.width = `${size}px`;
      this.style.height = `${size}px`;
      this.style.backgroundColor = color;

      this.style.webkitMaskImage = `url("${icon.url}")`;
      this.style.maskImage = `url("${icon.url}")`;
      this.style.webkitMaskRepeat = "no-repeat";
      this.style.maskRepeat = "no-repeat";
      this.style.webkitMaskSize = "contain";
      this.style.maskSize = "contain";
      this.style.webkitMaskPosition = "center";
      this.style.maskPosition = "center";

      if (this.hasAttribute("spin") || this.classList.contains("spin")) {
        this.style.animation = "dk-spin 2s linear infinite";
      } else if (this.hasAttribute("pulse") || this.classList.contains("pulse")) {
        this.style.animation = "dk-pulse 1.5s ease-in-out infinite";
      } else {
        this.style.animation = "";
      }

      let transform = "";

      if (
        this.getAttribute("flip") === "horizontal" ||
        this.classList.contains("flip-horizontal")
      ) transform += " scaleX(-1)";

      if (
        this.getAttribute("flip") === "vertical" ||
        this.classList.contains("flip-vertical")
      ) transform += " scaleY(-1)";

      const rotate = this.getAttribute("rotate");
      if (rotate) transform += ` rotate(${rotate}deg)`;

      this.style.transform = transform;
    }
  }

  /* ======================================================
     ANIMATIONS
  ====================================================== */

  const style = document.createElement("style");
  style.textContent = `
@keyframes dk-spin {
  100% { transform: rotate(360deg); }
}
@keyframes dk-pulse {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
`;
  document.head.appendChild(style);

  customElements.define("dk-el", DevKittyElement);

  window.loadDKF = loadDKF;
})();