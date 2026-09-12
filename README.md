# Full Custody — Own What Matters.

A 3D brand site for the Full Custody apparel line. Visitors pick the path
they're carrying, then see it built onto a tee, hoodie or jacket in a live
WebGL studio they can spin with the mouse.

**Static site. No build step, no bundler, no server.** Open `index.html`
through any static host and it runs.

---

## Running it

Because it uses ES modules, it needs to be served over HTTP (opening the file
with `file://` will not work):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Deploying

There is no build step, so every host is the same: publish the repo root.

**Netlify, drag and drop** — unzip the deploy folder and drag it onto
<https://app.netlify.com/drop>. That folder is just `index.html`, `css/`,
`js/`, `assets/`, `vendor/` and `netlify.toml`; you can also make it yourself
with:

```bash
mkdir -p ../full-custody-site
cp -r index.html css js assets vendor netlify.toml ../full-custody-site/
```

**Netlify, connected to Git** — point it at this branch and accept the
defaults. `netlify.toml` already sets the publish directory to the repo root,
leaves the build command empty, and sets cache headers for `vendor/`.

**GitHub Pages** — point Pages at this branch's root. Nothing to build.

One requirement on any host: the site uses ES modules, so it must be served
over HTTP(S). That is true of all three above.

---

## What's on the page

| Section | What it does |
|---|---|
| **Hero** | The garment turns slowly in a gold-lit stage while the headline holds the left. |
| **The gate** | "What are you in full custody of?" — pick up to three feelings, get scored onto one of the eight paths, with a match breakdown. |
| **The studio** | Live configurator: 3 garments × 4 colourways × 8 designs × 5 sizes. Drag the garment to turn it. |
| **The collection** | All eight designs as cards; clicking one loads it into the studio. |
| **The craft** | The camera pushes into a macro of the chest crest behind the copy. |
| **The creed** | Brand manifesto. |

The eight paths are **Family, Discipline, Purpose, Faith, Freedom, Passion,
Growth, Legacy** — one mindset, different paths.

---

## How the 3D works

There is one fixed full-screen canvas behind the whole page and **one scene**.
Each section carries a `data-shot` attribute; an `IntersectionObserver` tells
the stage which camera shot to fly to, and the camera damps toward it every
frame. Scrolling the page is what moves the camera.

Nothing is loaded from a model file — every garment is generated in code.

```
js/
  paths.js     the eight paths, the feeling→path scoring
  art.js       generated artwork: a chain-wrapped orb holding a miniature world
  fabric.js    print layout, colourways, woven normal map
  garment.js   procedural geometry — tee / hoodie / jacket
  stage.js     renderer, lights, camera shots, bloom, dust
  app.js       state, UI wiring, scroll choreography
vendor/three/  three.js r169 (vendored so the site has no CDN dependency)
```

### Garment geometry

Each garment is a profile of cross-sections — width, depth and height at eight
points from hem to shoulder — swept into a superellipse shell. Changing those
eight numbers is what turns a tee into a hoodie into a jacket. Sleeves are
tapered tubes along a curve, set into the armhole rather than the shoulder
top. Pockets and the zip placket are patches of the *same* shell pushed
slightly outward, so they hug the body exactly instead of floating.

The UV layout is shared with `fabric.js`:

- `u` runs `0.25 → 1.25` with repeat wrapping, putting **centre front at
  u 0.25** and **centre back at u 0.75** with no visible seam.
- `v` runs `0` at the hem to `1` at the shoulder.

That is why the back graphic and the left-chest crest land where they do.

---

## The artwork

Each design resolves through three tiers, best first:

1. `assets/designs/<path>.png` — shipped artwork, if present
2. `path.remoteArt` — a hosted URL, if set in `js/paths.js`
3. **a generated canvas emblem** — always works

Tier 3 is not a placeholder box. `js/art.js` draws a gold-rimmed crystal orb,
wrapped in chain, holding a miniature world painted per path — a family on a
cliff, stairs climbing out of fog, a cross at sunrise, a rider on open road.
The site is complete and shippable with nothing in `assets/designs/`.

**To use the real artwork**, drop eight square PNGs into `assets/designs/`
named `family.png`, `discipline.png`, `purpose.png`, `faith.png`,
`freedom.png`, `passion.png`, `growth.png`, `legacy.png` — or run:

```bash
./tools/fetch-designs.sh
```

Artwork should be a centred composition on a **black background**. The black is
keyed out before printing, with the orb area held fully opaque, so the same
file works on the Bone colourway as well as on Onyx.

---

## Editing the brand

- **Paths, taglines, creeds, feeling questions and their scoring** — `js/paths.js`
- **Colourways and prices** — `COLORWAYS` in `js/fabric.js`, `GARMENTS` in `js/garment.js`
- **Print placement** — `garmentTexture()` in `js/fabric.js`
- **Camera shots** — the `SHOTS` table at the top of `js/stage.js`
- **Colour and type tokens** — `:root` in `css/style.css`
- **The crest** — `assets/logo-fc.svg` (used in the nav, the footer, the
  favicon, and printed onto the garment's left chest)

---

## Fallbacks and accessibility

- No WebGL → the stage is skipped, `body.no-3d` is set, and the artwork is
  shown flat. Every control still works.
- `prefers-reduced-motion` → bloom and scroll reveals are disabled and the
  particle count drops.
- The loader always clears, even if the stage fails, so the page can never get
  stuck behind it.
- Controls are real buttons in labelled radio groups with `aria-checked`, and
  focus styling is visible throughout.

---

## Notes

- "Add to bag" shows a confirmation toast; there is no cart or checkout wired up.
- The newsletter form is front-end only.
- Prices and fabric specs are placeholders — see `GARMENTS` in `js/garment.js`.
- three.js is vendored under `vendor/three/` (MIT, licence included).
