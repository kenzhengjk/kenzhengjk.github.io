# personal_website

A hand-built, dependency-free academic site — plain HTML/CSS/JS, no build step.

```
personal_website/
├── index.html              # page shell (header, hero mount, palette, footer mount)
├── 404.html                # GitHub Pages "not found" page
├── .nojekyll               # tells GitHub Pages to serve files as-is
└── assets/
    ├── css/style.css       # design tokens (colors, type, spacing) + all components
    ├── js/content.js       # ← ALL CONTENT LIVES HERE
    ├── js/main.js          # renders content.js, nav, filters, ⌘K search, theme
    ├── js/background.js    # hero background: animated neural network (canvas)
    ├── img/                # portrait, logos, og.png
    ├── teasers/            # paper teaser videos + posters (see tools/make_teaser.py)
    └── files/              # cv.pdf, slides, posters
tools/make_teaser.py        # builds looping paper teaser videos with ffmpeg
_dev/archive/               # retired background scenes (attention, diffusion, world, agents); delete before launch
```

## Editing content

Everything is in [`assets/js/content.js`](assets/js/content.js): profile, news,
research themes, publications, projects, experience, teaching, honors, service.

- Strings are HTML, so `<a>`, `<b>`, `<em>` work inline.
- Remove or empty a list and its section (and nav entry) disappears; numbering adjusts.
- Publications: your name (`profile.name` / `pubName`) is highlighted automatically;
  append `*` to an author for equal contribution. `tags` become filter chips;
  `selected: true` adds it to "★ selected". Teaser `image`/`video` are 16:10;
  leave empty for a generated placeholder.
- Color palette: `meta.accent` = `cyan | arctic | mint | amber | infrared | violet | lime | signal | mono`.
- Hero background: `meta.background` = `network | none`.
- Also update the static `<title>` / `<meta>` tags at the top of `index.html`.

## Paper teaser videos

`tools/make_teaser.py` turns one or more source clips into a muted, seamlessly looping
16:10 teaser (`.mp4`) plus a poster (`.jpg`) for a publication card:

```bash
python3 tools/make_teaser.py --out assets/teasers/pair \
  --clip "src/method.png=2.5#method" \
  --clip "src/plate.mp4@2:0.3-4.7#real robot · 4×" --clip "src/tower.mp4@3:2.5-9.5#3×"
```

Spec is `PATH[@SPEED][:START-END][=HOLD][#LABEL]`: videos are cropped to 16:10 and sped up,
images (e.g. a method figure) are held for `HOLD` seconds and letterboxed. Then set `video`,
`image` (the poster) and the printed `videoLabels` on the paper in `content.js`.

Speed tags mean *speed relative to real life*: tag = (source's own speed-up) × `@SPEED`
(e.g. a clip that is already 2×, played `@4`, is tagged 8×). Trim idle stretches with
`:START-END` first so segments stay ~2.5–3 s without extreme speed-ups. If a clip ends on a
key action (closing a drawer…), run it to its natural end and add `=0.5` to freeze the last
frame, so the crossfade dissolves over the finished state rather than the action. Clips of unknown
speed get a task label rather than a speed. Needs ffmpeg (`pip install imageio-ffmpeg` works without Homebrew).

## Visit stats

`meta.analytics` in `content.js` loads [GoatCounter](https://www.goatcounter.com) (no cookies, so no consent
banner). Dashboard: https://kenzhengjk.goatcounter.com. Visits from `localhost` are not counted. Set it to `""`
to turn stats off.

## Preview locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. Handy for design checks:
`?theme=light`, `?accent=arctic` (etc.) override the defaults.

## Deploy (GitHub Pages)

1. Create a repo named **`<github-username>.github.io`** and push this folder to `main`.
2. Repo → Settings → Pages → Source: *Deploy from a branch*, `main` / root.
3. Live at `https://<github-username>.github.io` within a minute or two.

Optional custom domain (e.g. `yourname.com`, ~$10–12/yr): add a `CNAME` file containing
the domain, point DNS at GitHub Pages, and enable "Enforce HTTPS".
