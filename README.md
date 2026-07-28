# Abhiram Enterprises

Premium, frontend-only website for **Abhiram Enterprises** — a wholesale and retail building-materials supplier.

## Stack

- HTML5
- Tailwind CSS (CDN) + a shared `style.css`
- Vanilla JavaScript (`script.js`)
- Lucide icons via CDN

No build step, backend, or dependencies — open `public/index.html` in a browser.

## Structure

```
public/
├── index.html      # Home — hero carousel, animated build sequence, product showcase
├── about.html      # About Us
├── products.html   # Products — filterable catalogue
├── contact.html    # Contact — enquiry form + map
├── style.css       # Shared styles
├── script.js       # Shared interactions (nav, footer, WhatsApp, animations)
└── assets/         # Logo, product and hero imagery
```

## Features

- Responsive sticky navigation with animated mobile menu
- Full-screen hero carousel with product-focused marketing copy
- Auto-building 2D architectural elevation (scroll-triggered)
- Interactive product filters with live counts
- Auto-scrolling featured-products rail
- Accessible enquiry form with validation
- Floating WhatsApp contact widget
- Reduced-motion support throughout

## Local preview

Open `public/index.html` directly, or serve the folder:

```bash
cd public
python -m http.server 8000
```

---

Designed by [Pixalara](https://pixalara.com)
