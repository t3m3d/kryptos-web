# KryptOS Web — the website that *is* a Linux desktop

KryptOS Web is a personal site built as a **browser operating system**: a
GNOME-on-Arch styled desktop where every part of the site (Profile, Projects,
Krypton, Mac/Windows apps, Blog, Contact) is an **app you open in a window** — plus
a **Terminal that boots a real Linux kernel** via the [v86](https://github.com/copy/v86)
x86 emulator.

100% static — no server, no backend. Deploys to Hostinger shared hosting (target:
`kryptos.krypton-lang.org`), Netlify, GitHub Pages — anything that serves files.

---

## ✅ What I need from YOU to finish it

1. **App screenshots** — drop PNGs into `screenshots/` named exactly:
   `devbar.png`, `tally.png`, `fixture.png`, `meridian.png`, `cutout.png`,
   `cortex-win.png`, `godmode.png` (~640×400, 16:10). They auto-appear on the
   Mac Apps / Windows Apps pages. (Until then a gradient placeholder shows.)
2. **Store links** — open `os.js`, find the **`STORE_LINKS`** block at the very top.
   It lists every app by name with an empty `""`. Paste the **Mac App Store /
   Microsoft Store** URL between the quotes for that app — done. The button flips
   from "Coming soon" to a real **paid** store link automatically. That one block
   is the only place to edit. (No direct downloads — buying happens on the store.)
3. **Content review** — all page text lives inline in `os.js` (search the app id:
   `profile`, `projects`, `krypton`, `macapps`, `winapps`, `blog`, `contact`).
   Tell me edits, or change it directly: your bio, real project descriptions,
   actual blog posts, links.
4. **Deploy** — confirm the `kryptos.krypton-lang.org` subdomain + FTP path when
   ready and I'll push it live (or you upload the folder to `public_html`).

Editing on Windows: clone this repo, edit `os.js` / drop screenshots, commit, push.
No build step — it's plain HTML/CSS/JS.

---

## Run locally
```sh
cd weblinux
python3 -m http.server 8099
# open http://localhost:8099
```
Must be served over http (not file://) so the WASM + ISO load.

## What works
- Boot animation → GNOME desktop (top bar, dock, wallpaper)
- Draggable/min/max/close windows, focus, Activities overview, dock running-dots
- **Terminal** → real **Alpine Linux** (self-hosted x86 ISO, ~47 MB) via v86,
  rendered on a VGA console. Click it → boots → `localhost login:` → user `root`
  (no password) → real `ash` shell with the **apk** package manager.
- Files, Text Editor, Firefox (about), Settings (neofetch-style)

Self-hosted: `v86/alpine.iso` ships in the project — no external CDN. (The earlier
Arch option needed a 6.2 GB lazy-loaded rootfs from copy.sh; Alpine is a real
distro that fits in one self-hostable ISO.)

## Files
```
index.html         markup
style.css          GNOME/Arch theme
os.js              boot, window manager, dock, apps, v86 wiring
v86/               emulator engine + Linux image (~10 MB)
  libv86.js v86.wasm seabios.bin vgabios.bin linux.iso
vendor/            xterm.js + xterm.css (terminal rendering)
.htaccess          wasm MIME + COOP/COEP + caching (for Apache/Hostinger)
```

## Deploy to Hostinger (shared hosting)
1. Upload the whole `weblinux/` folder contents to your `public_html` (or a subfolder) via FTP.
2. The included `.htaccess` sets the `.wasm` MIME type + COOP/COEP headers.
3. Done — visit the URL. First load pulls ~10 MB (wasm + Linux ISO), then it caches.

No VPS required. It's static; the "Linux" runs client-side in the visitor's browser.

## Notes
- Each visitor downloads ~10 MB on first load (cached after).
- v86 runs faster with COOP/COEP headers (SharedArrayBuffer) — the `.htaccess`
  enables them on Apache/LiteSpeed. Without them it still runs, a bit slower.
- Swap `v86/linux.iso` for a different v86 image (Alpine, Arch, etc.) to change the
  shell — bigger images boot slower.

## Third-party

- [v86](https://github.com/copy/v86) — x86 emulator (BSD-2). `v86/libv86.js`, `v86/v86.wasm`, BIOSes, `linux.iso` from the v86 project / copy.sh.
- [xterm.js](https://xtermjs.org/) — terminal rendering (MIT).
- The bundled Linux image is Buildroot/busybox (GPL); redistributed unmodified.
