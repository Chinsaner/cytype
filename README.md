# Yue CHEN Portfolio Website Draft

This is a static portfolio website draft for CY Fonts | 虫鱼爬字. The homepage uses a black visual tone, type-project dropdown navigation, an auto-scrolling horizontal project rail, and alternating project sections. Each type project links to a dedicated detail page with metadata, specimens, and, where fonts are available, an interactive tester.

## Open locally

From this folder:

```bash
python3 -m http.server 8090
```

Then open:

```text
http://localhost:8090/
```

## Files

- `index.html` — portfolio content
- `style.css` — visual design
- `tester.js` — interactive type tester behavior
- `yourong.html`, `aki.html`, `lihei.html`, `shanghai-sky.html`, `guqin.html`, `yi-database.html` — project pages
- `assets/` — screenshots from the Yi character management website
- `assets/portfolio/` — selected project images rendered from the PDF portfolio
- `assets/covers/` — one homepage cover per project
- `assets/details/` — project detail images
- `assets/fonts/` — web fonts currently available for testers

## Next edits

- Confirm all contact links before publishing.
- Add updated CV PDF
- Replace PDF-rendered images with higher-resolution original images where available
- Add font files for Yourong, Shanghai Sky, Guqin, and other projects if interactive testers are desired
- Current testers support style, direct editable specimen text, size, line height, alignment, and reverse mode
- Add downloadable project PDFs or specimen PDFs
- Add public links when the Yi review website or dataset is ready

## Deployment options

- GitHub Pages
- Netlify
- Vercel

This site is intentionally static so it can be deployed quickly without a build step.
