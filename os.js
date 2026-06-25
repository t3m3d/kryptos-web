"use strict";

/* =======================================================================
   STORE LINKS — paste each app's store URL here. Leave "" for "Coming soon".
   This is the ONLY place you edit to make a buy button go live.
   ======================================================================= */
const STORE_LINKS = {
  // --- Mac App Store ---
  "DevBar": "", "Tally": "", "Fixture": "", "Meridian": "", "Cutout": "",
  // --- Microsoft Store: apps ---
  "Cortex": "",            // coming soon to the Microsoft Store
  "God Mode Script": "",
  // --- Microsoft Store: WSL distros ---
  "Chimera Linux WSL": "", "Exherbo Linux WSL": "", "koyd": "", "krewsil": "",
  "kryodev": "", "kryodome": "", "kryottos": "", "kryox": "", "kryptoo": "",
  "krytix": "", "FedBase": "", "wsltoo": "",
};

/* ============================ Boot ============================ */
const bootLines = [
  "[    0.000000] KryptOS 1.0 — Krypton Linux (kernel 6.9.1-krypton)",
  "[    0.142000] Command line: root=/dev/sda1 rw quiet splash",
  "[    0.318000] Memory: 64MB available",
  "[    0.512000] systemd[1]: Detected architecture x86.",
  "[    0.640000] systemd[1]: Reached target Local File Systems.",
  "[    0.880000] Starting GNOME Display Manager...",
  "[    1.120000] gdm: Loading session gnome-wayland",
  "[    1.400000] Reached target Graphical Interface.",
  "[    1.600000] Welcome to KryptOS.",
];
function boot() {
  const log = document.getElementById("boot-log");
  const fill = document.getElementById("boot-fill");
  let i = 0;
  const t = setInterval(() => {
    if (i < bootLines.length) {
      log.textContent += bootLines[i] + "\n";
      fill.style.width = Math.round(((i + 1) / bootLines.length) * 100) + "%";
      i++;
    } else {
      clearInterval(t);
      setTimeout(() => {
        document.getElementById("boot").classList.add("hidden");
        document.getElementById("desktop").classList.remove("hidden");
      }, 450);
    }
  }, 230);
}

/* ============================ Clock ============================ */
function tickClock() {
  const d = new Date();
  const s = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) +
    "  " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("clock").textContent = s;
}

/* ======================= Window manager ======================= */
let zTop = 10;
const openWindows = new Map(); // id -> {el, app}
function focusWindow(el) {
  document.querySelectorAll(".window").forEach(w => w.classList.remove("active"));
  el.classList.add("active");
  el.style.zIndex = ++zTop;
}
function makeWindow(app) {
  const el = document.createElement("div");
  el.className = "window";
  const w = app.w || 720, h = app.h || 460;
  el.style.width = w + "px"; el.style.height = h + "px";
  el.style.left = (40 + Math.random() * 120) + "px";
  el.style.top = (40 + Math.random() * 60) + "px";
  el.innerHTML =
    `<div class="titlebar">
       <div class="title">${app.icon} ${app.title}</div>
       <div class="winbtns">
         <div class="winbtn min">&#9472;</div>
         <div class="winbtn max">&#9633;</div>
         <div class="winbtn close">&#10005;</div>
       </div>
     </div>
     <div class="content"></div>`;
  document.getElementById("windows").appendChild(el);
  const content = el.querySelector(".content");
  app.mount(content, el);

  // focus + drag
  el.addEventListener("mousedown", () => focusWindow(el));
  const bar = el.querySelector(".titlebar");
  bar.addEventListener("mousedown", e => {
    if (e.target.closest(".winbtn")) return;
    const ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
    const move = ev => { el.style.left = (ev.clientX - ox) + "px"; el.style.top = Math.max(0, ev.clientY - oy) + "px"; };
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
  });
  let max = false, prev = {};
  el.querySelector(".max").onclick = () => {
    if (!max) { prev = { l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height };
      el.style.left = "0"; el.style.top = "0"; el.style.width = "100%"; el.style.height = "100%"; }
    else { Object.assign(el.style, { left: prev.l, top: prev.t, width: prev.w, height: prev.h }); }
    max = !max;
  };
  el.querySelector(".min").onclick = () => { el.classList.add("hidden"); };
  el.querySelector(".close").onclick = () => closeWindow(app.id, el);

  openWindows.set(app.id, { el, app });
  markDock(app.id, true);
  focusWindow(el);
  return el;
}
function closeWindow(id, el) {
  const rec = openWindows.get(id);
  if (rec && rec.app.onClose) rec.app.onClose();
  el.remove(); openWindows.delete(id); markDock(id, false);
}
function launch(app) {
  if (app.runCmd) { runInTerminal(app.runCmd); return; }
  if (app.singleton && openWindows.has(app.id)) {
    const { el } = openWindows.get(app.id); el.classList.remove("hidden"); focusWindow(el); return;
  }
  makeWindow(app);
}

/* ============================ Apps ============================ */
let emulator = null;
let termReady = false;
let pendingCmds = [];
function flushPending() {
  if (!emulator) return;
  pendingCmds.forEach(c => emulator.serial0_send(c + "\n"));
  pendingCmds = [];
}
/** Open the terminal (if needed) and run a real Linux command in it. */
function runInTerminal(cmd) {
  launch(apps.terminal);
  if (termReady && emulator) emulator.serial0_send(cmd + "\n");
  else pendingCmds.push(cmd);
}
const apps = {
  terminal: {
    id: "terminal", title: "Terminal — Linux", icon: "&#9636;", singleton: true, w: 800, h: 500,
    mount(c) {
      // content as a column: a small toolbar on top, the terminal below.
      c.style.display = "flex"; c.style.flexDirection = "column";
      const bar = document.createElement("div");
      bar.className = "term-bar";
      bar.innerHTML =
        `<button class="send-btn">&#128206; Send file &#8594; /mnt</button>
         <span class="term-note"></span>`;
      c.appendChild(bar);
      const fileInput = document.createElement("input");
      fileInput.type = "file"; fileInput.style.display = "none"; bar.appendChild(fileInput);

      const host = document.createElement("div"); host.className = "term-host";
      host.style.position = "relative"; host.style.flex = "1"; c.appendChild(host);
      const term = new Terminal({
        fontFamily: "ui-monospace, monospace", fontSize: 13, cursorBlink: true,
        theme: { background: "#0b0b0f", foreground: "#e6e6ea", cursor: "#1793d1" }
      });
      term.open(host);
      term.write("\x1b[36mBooting Linux (v86)…  files you send land in /mnt\x1b[0m\r\n");
      emulator = new V86({
        wasm_path: "v86/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        bios: { url: "v86/seabios.bin" },
        vga_bios: { url: "v86/vgabios.bin" },
        cdrom: { url: "v86/linux.iso" },        // self-hosted Buildroot busybox (~7 MB)
        filesystem: {},                          // in-browser 9p fs → /mnt
        autostart: true,
        disable_keyboard: true,
      });
      let sbuf = "";
      emulator.add_listener("serial0-output-byte", b => {
        const ch = String.fromCharCode(b); term.write(ch);
        sbuf += ch; if (sbuf.length > 240) sbuf = sbuf.slice(-240);
        if (!termReady && sbuf.includes("~%")) { termReady = true; flushPending(); }
      });
      term.onData(d => emulator.serial0_send(d));

      // browser → Linux: drop the file into the 9p fs; it appears in /mnt
      const note = bar.querySelector(".term-note");
      bar.querySelector(".send-btn").onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        const f = fileInput.files[0]; if (!f) return;
        try {
          const bytes = new Uint8Array(await f.arrayBuffer());
          await emulator.create_file(f.name, bytes);
          note.textContent = `sent → /mnt/${f.name}  (run: ls /mnt)`;
        } catch (e) { note.textContent = "send failed: " + e; }
        fileInput.value = "";
      };
    },
    onClose() {
      termReady = false; pendingCmds = [];
      if (emulator) { try { emulator.destroy(); } catch (e) {} emulator = null; }
    }
  },

  // ---- launchers: run a real Linux command in the terminal ----
  monitor: { id: "monitor", title: "System Monitor", icon: "&#128202;", runCmd: "top" },
  diskuse: { id: "diskuse", title: "Disk Usage", icon: "&#128190;", runCmd: "df -h" },
  explore: { id: "explore", title: "Explore /", icon: "&#128193;", runCmd: "ls -la /" },
  procs:   { id: "procs",   title: "Processes", icon: "&#9881;", runCmd: "ps" },

  files: {
    id: "files", title: "Files", icon: "&#128193;", singleton: true, w: 640, h: 420,
    mount(c) {
      const items = [
        ["&#128193;", "Desktop"], ["&#128193;", "Documents"], ["&#128193;", "Downloads"],
        ["&#128193;", "Pictures"], ["&#128221;", "readme.txt"], ["&#128196;", "notes.md"],
        ["&#127916;", "wallpaper.png"], ["&#9881;", ".bashrc"],
      ];
      c.innerHTML = `<div class="files">
        <div class="files-bar">&#127968; /home/arch
          <button class="send-btn" id="browse-real" style="float:right;font-size:11px;padding:2px 8px">Browse Linux / &#8594;</button>
        </div>
        <div class="files-grid">${items.map(([i, n]) =>
        `<div class="file" data-n="${n}"><div class="fi">${i}</div>${n}</div>`).join("")}</div></div>`;
      c.querySelector("#browse-real").onclick = () => runInTerminal("ls -la /");
      c.querySelectorAll(".file").forEach(f => f.ondblclick = () => {
        const n = f.dataset.n;
        if (n.endsWith(".txt") || n.endsWith(".md")) launch(makeEditor(n));
      });
    }
  },

  editor: { id: "editor", title: "Text Editor", icon: "&#128221;", w: 600, h: 420,
    mount(c) { const t = document.createElement("textarea"); t.className = "editor";
      t.value = "# Welcome to KryptOS Web\n\nA GNOME/Arch desktop in your browser.\nThe Terminal runs a REAL Linux (v86).\n"; c.appendChild(t); } },

  firefox: { id: "firefox", title: "Firefox", icon: "&#127757;", singleton: true, w: 820, h: 540,
    mount(c) {
      c.innerHTML = `<div class="app-pad"><h2>&#127757; Firefox</h2>
        <p style="color:var(--muted)">Sandboxed browser. External sites are blocked in this demo.</p>
        <p style="margin-top:14px">Try the <b>Terminal</b> — it boots a real Linux kernel via the
        <a href="https://github.com/copy/v86" target="_blank">v86</a> x86 emulator, entirely in your browser.</p></div>`;
    }
  },

  settings: { id: "settings", title: "Settings", icon: "&#9881;", singleton: true, w: 560, h: 420,
    mount(c) {
      c.innerHTML = `<div class="about">
        <pre>      /\\
     /  \\
    /    \\
   /      \\
  /   ,,   \\
 /   |  |   \\
/_-''    ''-_\\</pre>
        <div class="info" style="font-size:13px;line-height:1.8">
          <div><b>arch@kryptos</b></div>
          <div>os <b>Arch Linux x86 (v86)</b></div>
          <div>de <b>GNOME 46 (web)</b></div>
          <div>wm <b>KryptOS WM</b></div>
          <div>shell <b>busybox</b></div>
          <div>cpu <b>Emulated x86</b></div>
          <div>mem <b>64 MiB</b></div>
          <div>host <b>browser</b></div>
        </div></div>`;
    }
  },
};
/* ---- Website-as-OS: each site section is a "page app" window ---- */
function makePage(html) {
  return (c) => { c.innerHTML = `<div class="page">${html}</div>`; };
}
Object.assign(apps, {
  about: {
    id: "about", title: "About", icon: "&#128100;", singleton: true, w: 600, h: 480,
    mount: makePage(`
      <h1>Brian</h1>
      <p class="lead">Builder of the <b>Krypton</b> programming language, <b>KryptOS</b>, and a stack of
      native macOS apps. I work across compilers, systems, and polished desktop tools.</p>
      <p>This whole site runs on <b>KryptOS</b> — a real Linux desktop in your browser. Click around the
      dock: open <b>Work</b>, read the <b>Blog</b>, or pop a real <b>Terminal</b>.</p>
      <p class="muted">M4 MacBook Air · macOS · ships fast.</p>`)
  },
  work: {
    id: "work", title: "Work", icon: "&#128188;", singleton: true, w: 720, h: 520,
    mount: makePage(`
      <h1>Work</h1>
      <div class="cards">
        <div class="card"><h3>Krypton</h3><p>Self-hosting language compiling straight to native machine
          code — arm64 Mach-O on macOS, PE/COFF on Windows. No VM, no runtime.</p></div>
        <div class="card"><h3>KryptOS</h3><p>A Linux-from-scratch distro for the krypt- family — plus this
          web edition you're using right now.</p></div>
        <div class="card"><h3>Cortex</h3><p>Keyboard-driven dual-pane macOS file manager: git panel,
          embedded terminal, SFTP, tabs, fuzzy search.</p></div>
        <div class="card"><h3>kryofetch</h3><p>neofetch-style system-info tool, written in Krypton.</p></div>
        <div class="card"><h3>brain / stem / kryoterm</h3><p>Native macOS terminal emulators — Metal
          rendering, pure-Krypton experiments.</p></div>
        <div class="card"><h3>Mac apps</h3><p>DevBar, Tally, Fixture, Meridian, Cutout — focused utilities
          for the Mac App Store.</p></div>
      </div>`)
  },
  krypton: {
    id: "krypton", title: "Krypton", icon: "&#9889;", singleton: true, w: 640, h: 480,
    mount: makePage(`
      <h1>&#9889; Krypton</h1>
      <p class="lead">A self-hosting programming language that compiles directly to native machine code.</p>
      <ul>
        <li>Native codegen — arm64 Mach-O (macOS), PE/COFF (Windows). No interpreter, no VM.</li>
        <li>Self-hosting — the compiler is written in Krypton and compiles itself.</li>
        <li>Powers KryptOS, kryofetch, KSML/kweb, and more.</li>
      </ul>
      <p><a href="https://krypton-lang.org" target="_blank">krypton-lang.org</a> &nbsp;·&nbsp;
         <a href="https://kryptonbytes.com" target="_blank">kryptonbytes.com</a></p>`)
  },
  macapps: {
    id: "macapps", title: "Mac Apps", icon: "&#127822;", singleton: true, w: 720, h: 560,
    mount(c) { renderStore(c, "Mac Apps", "mac", [
      ["DevBar", "A toolbox of developer utilities in the menu bar.", "devbar.png", ""],
      ["Tally", "Calculator-notepad — type math in plain language (Soulver-style).", "tally.png", ""],
      ["Fixture", "Fake-data generator — JSON / CSV / SQL in a click.", "fixture.png", ""],
      ["Meridian", "World clock + best-time-to-meet planner.", "meridian.png", ""],
      ["Cutout", "One-click background remover (Vision framework).", "cutout.png", ""],
    ]); }
  },
  blog: {
    id: "blog", title: "Blog", icon: "&#128221;", singleton: true, w: 640, h: 500,
    mount(c) {
      const posts = [
        ["Building a Linux desktop that runs in your browser", "Jun 2026",
         "KryptOS Web wraps the v86 x86 emulator in a GNOME-styled desktop. The terminal you click boots a real Linux kernel — busybox on a 7&nbsp;MB image, fully self-hosted. Here's how the window manager, dock, and 9p file-sharing fit together…"],
        ["Self-hosting Krypton: compiling a language with itself", "May 2026",
         "Once a compiler can compile its own source, you've crossed the self-hosting line. Krypton emits native Mach-O directly — no LLVM, no VM. The bootstrap path, the codegen, and why native-first changes everything…"],
      ];
      c.innerHTML = `<div class="page"><h1>Blog</h1>${posts.map((p, i) =>
        `<div class="post" data-i="${i}"><h3>${p[0]}</h3><span class="muted">${p[1]}</span></div>`).join("")}</div>`;
      c.querySelectorAll(".post").forEach(el => el.onclick = () => {
        const p = posts[el.dataset.i];
        launch({ id: "post-" + el.dataset.i, title: p[0], icon: "&#128221;", w: 600, h: 460,
          mount: makePage(`<span class="muted">${p[1]}</span><h1>${p[0]}</h1><p>${p[2]}</p>
            <p class="muted">(full post — editable)</p>`) });
      });
    }
  },
  contact: {
    id: "contact", title: "Contact", icon: "&#9993;", singleton: true, w: 520, h: 380,
    mount: makePage(`
      <h1>&#9993; Contact</h1>
      <p><b>Email</b> &nbsp; <a href="mailto:brian@krypton-lang.org">brian@krypton-lang.org</a></p>
      <p><b>GitHub</b> &nbsp; <a href="https://github.com/t3m3d" target="_blank">github.com/t3m3d</a></p>
      <p><b>Krypton</b> &nbsp; <a href="https://krypton-lang.org" target="_blank">krypton-lang.org</a></p>`)
  },
});

Object.assign(apps, {
  profile: {
    id: "profile", title: "Profile", icon: "&#128100;", singleton: true, w: 600, h: 520,
    mount: makePage(`
      <div class="profile-head">
        <div class="avatar">B</div>
        <div><h1 style="margin:0">Brian</h1>
          <p class="role">Systems &amp; language engineer · indie macOS / Windows developer</p></div>
      </div>
      <div class="chips"><span>Krypton author</span><span>KryptOS</span>
        <span>macOS &amp; Windows</span><span>compilers</span><span>ships fast</span></div>
      <p>I build compilers, operating systems, and the focused desktop tools I want to use myself —
      from a self-hosting language to native file managers on two platforms.</p>
      <p>Right now you're standing inside one of those projects: <b>KryptOS Web</b>, a real Linux desktop
      running in your browser.</p>
      <p class="links">
        <a href="https://github.com/t3m3d" target="_blank">github.com/t3m3d</a> &nbsp;·&nbsp;
        <a href="mailto:brian@krypton-lang.org">brian@krypton-lang.org</a> &nbsp;·&nbsp;
        <a href="https://krypton-lang.org" target="_blank">krypton-lang.org</a></p>`)
  },
  projects: {
    id: "projects", title: "Projects", icon: "&#128302;", singleton: true, w: 740, h: 560,
    mount: makePage(`
      <h1>&#128302; Projects</h1>
      <div class="cards">
        <div class="card"><h3>Krypton</h3><p>Self-hosting language → native machine code (Mach-O / PE).</p></div>
        <div class="card"><h3>KryptOS</h3><p>Linux-from-scratch distro for the krypt- family.</p></div>
        <div class="card"><h3>KryptOS Web</h3><p>This site — a browser Linux desktop on the v86 emulator.</p></div>
        <div class="card"><h3>Cortex</h3><p>Dual-pane macOS file manager: git, terminal, SFTP, tabs.</p></div>
        <div class="card"><h3>kryofetch</h3><p>neofetch-style system info, written in Krypton.</p></div>
        <div class="card"><h3>brain / stem / kryoterm</h3><p>Native terminal emulators (Metal, pure-Krypton).</p></div>
        <div class="card"><h3>kweb / KSML</h3><p>Krypton web framework + hypermedia DSL.</p></div>
        <div class="card"><h3>NetWatch</h3><p>LAN device scanner + admin tooling.</p></div>
      </div>
      <p class="muted">More on <a href="https://github.com/t3m3d" target="_blank">github.com/t3m3d</a>.</p>`)
  },
  winapps: {
    id: "winapps", title: "Windows Apps", icon: "&#129744;", singleton: true, w: 720, h: 520,
    mount(c) {
      const wsl = [
        ["Chimera Linux WSL", "Chimera Linux for WSL — a modern musl-based distro with BSD userland.", "chimerawsl.png", ""],
        ["Exherbo Linux WSL", "Exherbo Linux for WSL — a source-based, power-user distro.", "exherbowsl.png", ""],
        ["koyd", "Unofficial Void Linux–based WSL environment (xbps).", "koydwsl.png", ""],
        ["krewsil", "Alpine Linux–based WSL environment (apk).", "krewsilwsl.png", ""],
        ["kryodev", "Devuan-based WSL environment (Debian without systemd, apt).", "kryodevwsl.png", ""],
        ["kryodome", "Security / pentesting WSL based on BlackArch (Arch, pacman + BlackArch tools).", "kryodomewsl.png", ""],
        ["kryottos", "Security / pentesting WSL based on Parrot OS.", "kryottos.png", ""],
        ["kryox", "Lightweight WSL based on antiX (Debian-based, no systemd).", "kryox.png", ""],
        ["kryptoo", "Security / pentesting WSL based on Pentoo (Gentoo-based).", "kryptoo.png", ""],
        ["krytix", "WSL based on Artix (Arch-based, no systemd — OpenRC / runit / s6).", "krytix.png", ""],
        ["FedBase", "A Fedora-based Linux WSL installer (dnf package manager).", "fedbase.png", ""],
        ["wsltoo", "A Gentoo-based spin for WSL2 (Portage / emerge).", "wsltoo.png", ""],
      ];
      const winApps = [
        ["Cortex", "WPF / .NET 8 file explorer — the Windows sibling of macOS Cortex.", "cortex-win.png", ""],
        ["God Mode Script", "Windows power-user tweak / utility script.", "godmode.png", ""],
      ];
      c.innerHTML = `<div class="page"><h1>Windows Apps</h1>
        <h2 class="sec">WSL Distros</h2>
        ${storeCards(wsl, "win", "screenshots/wsl/")}
        <h2 class="sec">Apps</h2>
        ${storeCards(winApps, "win", "screenshots/")}
        <p class="muted">Paid downloads via the Microsoft Store — this site only links out.</p></div>`;
    }
  },
});

/** App-store cards: screenshot + paid store button per app. `dir` = screenshot folder. */
function storeBadge(kind) {
  return kind === "mac"
    ? `<span class="store-logo">&#63743;</span> Mac App Store`
    : `<span class="store-logo">&#9638;</span> Microsoft Store`;
}
function storeCards(items, kind, dir) {
  const badge = storeBadge(kind);
  return items.map(([name, desc, shot, url]) => {
    const link = (STORE_LINKS[name] || url || "").trim();   // STORE_LINKS wins
    return `
      <div class="appcard">
        <div class="shot" style="background-image:url('${dir}${shot}')"></div>
        <div class="appcard-body">
          <h3>${name}</h3><p>${desc}</p>
          ${link
            ? `<a class="store-btn ${kind}" href="${link}" target="_blank">${badge} &#8599;</a>`
            : `<span class="store-btn soon">${badge} · Coming soon</span>`}
        </div>
      </div>`;
  }).join("");
}
function renderStore(c, title, kind, items, dir = "screenshots/") {
  c.innerHTML = `<div class="page"><h1>${title}</h1>
    ${storeCards(items, kind, dir)}
    <p class="muted">Paid downloads are handled by the ${kind === "mac" ? "Mac App Store" : "Microsoft Store"} —
      this site only links out.</p></div>`;
}

function makeEditor(name) {
  return { id: "editor-" + name, title: name + " — Text Editor", icon: "&#128221;", w: 560, h: 400,
    mount(c) { const t = document.createElement("textarea"); t.className = "editor";
      t.value = "Contents of " + name + "\n"; c.appendChild(t); } };
}

/* ============================ Dock ============================ */
const dockApps = ["profile", "projects", "krypton", "macapps", "winapps", "blog", "contact", "terminal", "files"];
function buildDock() {
  const dock = document.getElementById("dock");
  dock.innerHTML = "";
  dockApps.forEach(id => {
    const a = apps[id];
    const el = document.createElement("div");
    el.className = "dock-app"; el.dataset.id = id; el.title = a.title;
    el.innerHTML = `${a.icon}<span class="dot"></span>`;
    el.onclick = () => launch(a);
    dock.appendChild(el);
  });
  // show-apps button
  const grid = document.createElement("div");
  grid.className = "dock-app"; grid.title = "Show Applications"; grid.innerHTML = "&#9638;";
  grid.onclick = toggleOverview;
  dock.appendChild(grid);
}
function markDock(id, running) {
  const el = document.querySelector(`.dock-app[data-id="${id}"]`);
  if (el) el.classList.toggle("running", running);
}

/* ========================= Overview ========================== */
function toggleOverview() {
  const ov = document.getElementById("overview");
  if (ov.classList.contains("hidden")) {
    const grid = document.getElementById("appgrid");
    grid.innerHTML = Object.values(apps).map(a =>
      `<div class="grid-app" data-id="${a.id}"><div class="gi">${a.icon}</div><span>${a.title}</span></div>`).join("");
    grid.querySelectorAll(".grid-app").forEach(g =>
      g.onclick = () => { launch(apps[g.dataset.id]); ov.classList.add("hidden"); });
    ov.classList.remove("hidden");
  } else ov.classList.add("hidden");
}

/* ============================ Power =========================== */
function powerOff() {
  document.getElementById("desktop").classList.add("hidden");
  const b = document.getElementById("boot");
  b.classList.remove("hidden");
  document.getElementById("boot-log").textContent = "Powering off...\n[  OK  ] Reached target Power-Off.";
  document.getElementById("boot-fill").style.width = "0";
  document.querySelector(".boot-name").textContent = "Goodbye";
}

/* ============================ Init =========================== */
window.addEventListener("DOMContentLoaded", () => {
  boot();
  buildDock();
  tickClock(); setInterval(tickClock, 1000 * 20);
  document.getElementById("activities").onclick = toggleOverview;
  document.getElementById("powerbtn").onclick = powerOff;
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") document.getElementById("overview").classList.add("hidden");
  });
});
