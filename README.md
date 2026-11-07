# Parvathy Raj: portfolio

A static site (plain HTML, CSS and JavaScript). The only build step renders the link-preview image. The demo videos live in `media/`.

| File | What it holds |
|---|---|
| `index.html` | All page content: projects, experience, skills, contact |
| `styles.css` | Design (colours, fonts, layout, light and dark mode) |
| `script.js` | The "Ask this portfolio" box and video autoplay |
| `media/` | Demo videos (`.mp4`) and their poster images (`.jpg`) |
| `scripts/build.mjs` | Vercel build: copies the site to `dist/` and renders `og-image.png` from the colours and fonts in `styles.css` |

## Preview on your computer

```bash
python -m http.server 18080
```

Then open http://localhost:18080.

## Deploy to Vercel (free)

1. Create a new **public** GitHub repository, e.g. `portfolio`, and upload the contents of this folder
   (GitHub Desktop: *File > Add local repository*, then *Publish repository*).
2. Go to https://vercel.com and sign up with **Continue with GitHub** (Hobby plan, free, no card).
3. Click **Add New > Project**, pick the `portfolio` repo, and click **Import**.
4. Leave everything as it is and click **Deploy**. `vercel.json` tells Vercel to run `npm run build` and serve `dist/`.
5. Your site is live at `https://<project-name>.vercel.app`. To get a nicer address, open
   *Project > Settings > Domains* and rename it, e.g. `parvathy-raj.vercel.app`.

Every time you push a change to GitHub, Vercel redeploys automatically.

## Updating content

- **Text:** edit `index.html`. If you add a new fact, also add it to the `KB` list in `script.js`
  so the question box can answer it.
- **Videos:** replace a file in `media/` with the same name, or add a new `<video>` block.
  Keep each video under about 20 MB so the page stays fast.

## Link preview image

`og-image.png` (the card shown when the link is shared on WhatsApp, LinkedIn, Slack, X) is generated on
every Vercel build by `scripts/build.mjs`, using Satori and resvg (both free and open source).
It reads the dark-theme colours (the default theme) and the fonts from `styles.css`, so changing the theme updates the image too.
To build locally (needs Node.js 18+): `npm install && npm run build`, then look at `dist/og-image.png`.
