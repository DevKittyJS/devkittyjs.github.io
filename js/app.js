/* ============================================================
   CONFIG
============================================================ */
const BACKEND_URL = "https://api-devkitty.onrender.com";
const OWNER = "DevKittyJS";
const REPO = "API";
const loaderBaseUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/ldscr`;

/* ============================================================
   DOM
============================================================ */
const iconsGrid = document.getElementById("icons");
const loadersGrid = document.getElementById("loaders");

const modal = document.getElementById("modal");
const modalPreview = document.getElementById("modal-preview");
const modalCode = document.getElementById("modal-code");

document.getElementById("close").onclick = () => (modal.hidden = true);

/* ============================================================
   BACKEND FETCH
============================================================ */
async function apiFetch(path) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[API ERROR]", err);
    throw err;
  }
}

/* ============================================================
   COPY BUTTON
============================================================ */
document.getElementById("copy").onclick = () => {
  navigator.clipboard.writeText(modalCode.textContent).then(() => {
    const btn = document.getElementById("copy");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  });
};

/* ============================================================
   TABS
============================================================ */
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".grid").forEach(g => g.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

/* ============================================================
   ICONS
============================================================ */
const ICON_FOLDERS = ["brands", "core", "misc"];
const iconsBaseUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/icons`;
const iconStylesId = "DevKittyIcons";

let iconStyleSheet = document.getElementById(iconStylesId);
if (!iconStyleSheet) {
  iconStyleSheet = document.createElement("style");
  iconStyleSheet.id = iconStylesId;
  document.head.appendChild(iconStyleSheet);
}

iconStyleSheet.textContent = `
.dk_ico {
  display:inline-block;
  width:1em;
  height:1em;
  background-color:currentColor;
  -webkit-mask-repeat:no-repeat;
  mask-repeat:no-repeat;
  -webkit-mask-size:contain;
  mask-size:contain;
  -webkit-mask-position:center;
  mask-position:center;
}
.dk-xs{font-size:.75em}
.dk-sm{font-size:.875em}
.dk-lg{font-size:1.33em}
.dk-2x{font-size:2em}
.dk-3x{font-size:3em}
.dk-4x{font-size:4em}
.dk-5x{font-size:5em}
@keyframes dk-spin{to{transform:rotate(360deg)}}
.dk-spin{animation:dk-spin 2s linear infinite}
`;

ICON_FOLDERS.forEach(async folder => {
  try {
    const files = await apiFetch(`/api/icons/${folder}`);

    files
      .filter(f => f.name.endsWith(".svg"))
      .forEach(file => {
        const name = file.name.replace(".svg", "");
        const url = `${iconsBaseUrl}/${folder}/${name}.svg`;

        iconStyleSheet.appendChild(
          document.createTextNode(`
.dk_${folder}_${name}{
  -webkit-mask-image:url('${url}');
  mask-image:url('${url}');
}
          `)
        );

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-preview">
            <i class="dk_ico dk_${folder}_${name}"></i>
          </div>
          <small>${name}</small>
        `;
        card.onclick = () => showIcon(folder, name);
        iconsGrid.appendChild(card);
      });
  } catch (err) {
    console.error(`[Icons] Failed to load ${folder}`, err);
  }
});

function showIcon(folder, name) {
  modalPreview.innerHTML = `<i class="dk_ico dk_${folder}_${name} dk-4x"></i>`;
  modalCode.textContent = `<i class="dk_ico dk_${folder}_${name}"></i>`;
  modal.hidden = false;
}

/* ============================================================
   LOADERS
============================================================ */
async function loadLoaderCSS(name) {
  const cssUrl = `${loaderBaseUrl}/${name}/spinner_small.css?v=${Date.now()}`;

  const cssText = await fetch(cssUrl).then(r => {
    if (!r.ok) throw new Error("CSS fetch failed");
    return r.text();
  });

  const animName = `rotate-${name}`;

  const scoped = cssText
    .replace(/@keyframes\s+rotate/g, `@keyframes ${animName}`)
    .replace(/animation:\s*rotate/g, `animation: ${animName}`)
    .replace(/\.dk-ldscr([^\w-]|$)/g, `.dk-ldscr.scr-${name}$1`);

  const style = document.createElement("style");
  style.textContent = scoped;
  document.head.appendChild(style);
}

function applyLoaderColors(root = document) {
  root.querySelectorAll(".dk-ldscr").forEach(el => {
    const colClass = [...el.classList].find(c => c.startsWith("col-"));
    if (!colClass) return;

    let color = colClass.replace("col-", "");
    if (color === "black") color = "#000";
    if (color === "white") color = "#fff";

    el.style.setProperty("--bg-color", color);
  });
}

(async () => {
  try {
    const loaders = await apiFetch("/api/loaders");

    for (const name of loaders) {
      await loadLoaderCSS(name);

      const card = document.createElement("div");
      card.className = "card loader-card";
      card.innerHTML = `
        <div class="card-preview loader-preview">
          <div class="dk-ldscr scr-${name} s-small col-black"></div>
        </div>
        <small>${name}</small>
      `;
      card.onclick = () => showLoader(name);
      loadersGrid.appendChild(card);

      applyLoaderColors(card);
    }
  } catch (err) {
    console.error("[Loaders] Failed to load loaders", err);
  }
})();

function showLoader(name) {
  modalPreview.innerHTML = `
    <div class="dk-ldscr scr-${name} s-large col-black"></div>
  `;
  applyLoaderColors(modalPreview);

  modalCode.textContent = `
<div class="dk-ldscr scr-${name} s-small col-black"></div>
`.trim();

  modal.hidden = false;

}
