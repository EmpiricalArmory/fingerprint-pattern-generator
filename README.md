# fingerprint-pattern-generator

**Ridge Press**: Empirical Armory’s fingerprint-pattern generator. Adjust the ridge pattern, ink weight, fade, colours and shape, zoom in to check detail, then download the print as a vector SVG for Illustrator.

Live site (after GitHub Pages is switched on): https://empiricalarmory.github.io/fingerprint-pattern-generator/

The app is plain HTML, CSS and JavaScript. There is no build step and no server code: **the files in this repository are both the source code and exactly what is hosted.** Edit a file, commit, and the site updates.

## Project layout

```
index.html              page structure: panels, buttons, preview area
css/styles.css          all styling; colour tokens at the top (light and dark)
js/config.js            built-in options and defaults: weights, fades, colour modes, DEFAULT settings
js/rng.js               seeded random numbers (same seed → same print)
js/shapes.js            built-in silhouettes (schilt, sheet, rounded square, circle) and uploaded-SVG placement
js/renderer.js          the fingerprint itself: noise layers, loop/whorl/arch ridges, ink model, fade
js/tracer.js            converts the rendered pixels into smooth vector outlines for export
js/ui.js                controls, sliders, reset buttons, preview, zoom, dragging, presets
js/export.js            builds the SVG file and saves it; starts the app
docs/PARAMETERS.md      what every setting in a recipe means
tools/python/           optional: the original Python renderer used for the logo survey
.nojekyll               tells GitHub Pages to serve the files as they are
```

The scripts are loaded in that order by `index.html` as ordinary scripts (not modules), so the page also works when opened straight from disk.

## Run it on your computer

Double-click `index.html`. It opens in your browser and works offline; fonts come from Google Fonts when you’re online and fall back to system fonts otherwise.

If you edit the code, just reload the page to see the change.

## Put it on GitHub

1. Create the repository `EmpiricalArmory/fingerprint-pattern-generator` (Public, so GitHub Pages is free).
2. On the empty repository page, click **uploading an existing file** and drag in **everything in this folder**: `index.html`, `README.md`, `.nojekyll`, `.gitignore` and the `css`, `js`, `docs` and `tools` folders. Commit.
   Files starting with a dot are hidden on macOS; press ⌘⇧. in Finder to show them. If `.nojekyll` is missed the site still works; it just skips GitHub’s Jekyll step.
3. **Settings → Pages**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**, **Save**.
4. After about a minute the site is live at the address above. Every later commit to `main` republishes it automatically.

With git instead of the web uploader:

```
git init -b main
git add .
git commit -m "Ridge Press fingerprint-pattern generator"
git remote add origin https://github.com/EmpiricalArmory/fingerprint-pattern-generator.git
git push -u origin main
```

## Making changes

| To change… | Edit |
|---|---|
| The weight buttons (standard, crisp, light, heavy) | `WEIGHTS` in `js/config.js` |
| The fade buttons | `FADES` and `FADE_LABEL` in `js/config.js` |
| Colour modes and their colours | `MODES` in `js/config.js` |
| What the app starts with | `DEFAULT` in `js/config.js` |
| Slider ranges and labels | `buildRows()` in `js/ui.js` |
| The schilt outline (proportions, fillet, blade) | `schiltPath()` in `js/shapes.js` |
| Add a new built-in shape | `shapePath()` in `js/shapes.js`, then add a chip in `syncAll()` in `js/ui.js` |
| How the ridges and ink look | `render()` in `js/renderer.js` |
| Smoothness / file size of the exported SVG | `eps` and the curve code in `traceSVG()` in `js/tracer.js` |
| Export file name or SVG structure | `buildSVG()` and `fileName()` in `js/export.js` |
| Colours, fonts, layout of the app itself | `css/styles.css` |

Note: changing anything in `js/renderer.js` or `js/rng.js` changes what existing recipes produce. Keep a copy of recipes you rely on, or version the renderer if you need old recipes to keep matching.

## Recipes

The **Recipe** panel shows every setting as one line of text. Pasting it back reproduces the same print, and each exported SVG carries its recipe in its `<desc>`. Presets saved in the app are stored in that browser only. See `docs/PARAMETERS.md` for the meaning of each field.

## The Python renderer (optional)

`tools/python/` contains `fpgen.py`, the renderer used to make the prints in the logo survey, with the 72 presets of the universal set. It gives the same look but uses a different random generator, so a seed there does not match the same seed in the app. See `tools/python/README.md`.
