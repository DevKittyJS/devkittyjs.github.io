# 🐱 DevKitty

**DevKitty** is a lightweight, JavaScript-based icon and graphic delivery system designed for modern websites.

It lets you load icons from a custom binary-safe format (**GGDK**) and render them to canvas — without exposing SVG markup in the DOM.

No inline SVGs.  
No copy-paste theft.  
No runtime parsing chaos.

Just clean, controlled asset delivery.

---

## ✨ Features

- 🚀 **Zero SVG in DOM**
- 🎨 Canvas-based rendering
- 📦 Custom GGDK asset format
- ⚡ Strict, deterministic parsing
- 🧩 `<dk-el>` custom element API
- 💤 Smart preload modes
  - `idle`
  - `hover`
  - `viewport`
  - `never`
- 📱 Fully responsive & mobile-safe
- 🌗 Light & dark mode friendly
- 🔒 Designed to prevent asset scraping

---

## 📦 Installation

Include the DevKitty parser and one or more GGDK files:

```html
<script
  src="parser.js"
  ggdk="icons.ggdk, ui.ggdk">
</script>

For more info visit: https://devkittyjs.github.io/docs