"use strict";
/* Simulated Arch Linux shell (xterm + a JS command interpreter).
   Looks/feels like Arch with a working pacman — fully client-side, instant. */

function mountSimShell(container) {
  const host = document.createElement("div");
  host.className = "term-host";
  container.appendChild(host);

  const term = new Terminal({
    fontFamily: "ui-monospace, monospace", fontSize: 13, cursorBlink: true,
    theme: { background: "#0b0b0f", foreground: "#e6e6ea", cursor: "#1793d1",
             green: "#a6e3a1", cyan: "#1793d1", blue: "#89b4fa", yellow: "#f9e2af", red: "#f38ba8" }
  });
  term.open(host);

  const C = { g: "\x1b[32m", c: "\x1b[36m", b: "\x1b[34m", y: "\x1b[33m", r: "\x1b[31m",
              m: "\x1b[35m", bold: "\x1b[1m", dim: "\x1b[2m", reset: "\x1b[0m" };
  const w = s => term.write(s.replace(/\n/g, "\r\n"));
  const wl = s => w(s + "\n");
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---- fake filesystem ----
  const FS = {
    "root": { "readme.txt": "Welcome to KryptOS — a Krypton Linux spin.\nTry: pacman -S neofetch, then neofetch\n",
              ".bashrc": "# ~/.bashrc\nalias ll='ls -la'\n", "projects": {} },
    "etc": { "os-release": 'NAME="KryptOS"\nPRETTY_NAME="KryptOS (Krypton Linux)"\nID=arch\n', "hostname": "kryptos\n" },
    "usr": { "bin": {}, "share": {} }, "var": { "log": {} }, "tmp": {}
  };
  let cwd = ["root"];
  const at = p => p.reduce((n, k) => (n && typeof n === "object") ? n[k] : undefined, FS);
  const cwdStr = () => "/" + cwd.join("/").replace(/^root/, "root");
  const promptStr = () => `${C.c}${C.bold}[root@kryptos ${cwd[cwd.length-1] === "root" ? "~" : cwd[cwd.length-1]}]${C.reset}# `;

  // ---- package "repo" ----
  const REPO = {
    vim: ["9.1.0", "Vi Improved, a text editor", 3.4], neovim: ["0.10.0", "hyperextensible Vim-based editor", 11.2],
    git: ["2.45.2", "the fast distributed version control system", 28.1], python: ["3.12.4", "interpreted language", 64.0],
    nodejs: ["22.3.0", "Evented I/O for V8 javascript", 38.7], htop: ["3.3.0", "interactive process viewer", 0.9],
    neofetch: ["7.1.0", "CLI system information tool", 0.4], cmatrix: ["2.0", "scrolling Matrix-like screen", 0.05],
    cowsay: ["3.8.0", "configurable talking characters", 0.1], "fortune-mod": ["3.20", "epigram program", 2.3],
    tree: ["2.1.1", "list contents as a tree", 0.1], wget: ["1.24.5", "network downloader", 4.2],
    curl: ["8.8.0", "command line transfer tool", 1.5], tmux: ["3.4", "terminal multiplexer", 0.6],
    ranger: ["1.9.3", "console file manager", 1.2], gcc: ["14.1.1", "GNU Compiler Collection", 158.0],
    rust: ["1.79.0", "systems programming language", 191.0], go: ["1.22.4", "core compiler tools", 134.0],
    firefox: ["127.0", "fast, private browser", 232.0], docker: ["26.1.4", "container platform", 96.0]
  };
  const installed = new Set(["bash", "coreutils", "pacman", "glibc", "linux", "systemd", "krypton"]);

  async function pacman(args) {
    const flags = args[0] || "";
    const rest = args.slice(1);
    if (flags.startsWith("-S") && !flags.includes("s")) {
      if (flags.includes("y")) {
        for (const repo of ["core", "extra", "multilib"]) {
          w(`${C.c}::${C.reset} Synchronizing package databases...\n`);
          w(` ${repo}`); await sleep(180); wl(`${" ".repeat(14 - repo.length)}${(Math.random()*150+20|0)}.0 KiB  ${C.g}${(Math.random()*2+1).toFixed(1)} MiB/s 00:00${C.reset}`);
        }
      }
      if (flags === "-Syu" || flags === "-Su") { wl(`${C.c}::${C.reset} Starting full system upgrade...`); wl(" there is nothing to do"); return; }
      if (!rest.length) return;
      const toInstall = rest.filter(p => REPO[p] && !installed.has(p));
      const unknown = rest.filter(p => !REPO[p]);
      for (const u of unknown) wl(`${C.r}error:${C.reset} target not found: ${u}`);
      if (!toInstall.length) { rest.filter(p=>installed.has(p)).forEach(p=>wl(`${C.y}warning:${C.reset} ${p} is up to date -- reinstalling`)); if(!unknown.length && !rest.some(p=>installed.has(p))) return; }
      if (!toInstall.length) return;
      wl("resolving dependencies..."); await sleep(200);
      wl("looking for conflicting packages..."); await sleep(150);
      const total = toInstall.reduce((s,p)=>s+REPO[p][2],0);
      wl("");
      wl(`Packages (${toInstall.length}) ${toInstall.map(p=>`${p}-${REPO[p][0]}`).join("  ")}`);
      wl("");
      wl(`Total Download Size:    ${total.toFixed(2)} MiB`);
      wl(`Total Installed Size:   ${(total*2.6).toFixed(2)} MiB`);
      wl("");
      w(`${C.c}::${C.reset} Proceed with installation? [Y/n] `); await sleep(350); wl("Y");
      wl(`${C.c}::${C.reset} Retrieving packages...`);
      for (const p of toInstall) { w(` ${p}-${REPO[p][0]}`); await sleep(250); wl(`${" ".repeat(Math.max(1,26-p.length-REPO[p][0].length))}${REPO[p][2].toFixed(1)} MiB  ${C.g}${(Math.random()*4+2).toFixed(1)} MiB/s 00:0${(Math.random()*3|0)}${C.reset} [${C.g}######################${C.reset}] 100%`); }
      for (const step of ["checking keys in keyring", "checking package integrity", "loading package files", "checking for file conflicts", "checking available disk space"]) { w(`(${toInstall.length}/${toInstall.length}) ${step}`); await sleep(120); wl(` ${C.g}[######]${C.reset} 100%`); }
      let i = 0;
      for (const p of toInstall) { i++; w(`(${i}/${toInstall.length}) installing ${p}`); await sleep(180); wl(` ${C.g}[######]${C.reset} 100%`); installed.add(p); }
      wl(`${C.g}:: ${C.reset}Done.`);
    } else if (flags.startsWith("-Ss") || flags === "-Ss") {
      const q = rest[0] || "";
      Object.entries(REPO).filter(([n,d]) => n.includes(q) || d[1].includes(q)).forEach(([n,d]) => {
        wl(`${C.m}extra/${C.reset}${C.bold}${n} ${C.g}${d[0]}${C.reset}${installed.has(n)?` ${C.c}[installed]${C.reset}`:""}`);
        wl(`    ${d[1]}`);
      });
    } else if (flags.startsWith("-Q")) {
      [...installed].sort().forEach(p => wl(`${p} ${REPO[p]?REPO[p][0]:"1.0.0"}`));
    } else if (flags.startsWith("-R")) {
      rest.forEach(p => { if (installed.has(p)) { installed.delete(p); wl(`removing ${p}...`); } else wl(`${C.r}error:${C.reset} target not found: ${p}`); });
    } else {
      wl("usage: pacman -S <pkg> | -Sy | -Syu | -Ss <term> | -Q | -R <pkg>");
    }
  }

  function neofetch() {
    const logo = [
      `${C.c}                   -\``, `                  .o+\``, `                 \`ooo/`,
      `                \`+oooo:`, `               \`+oooooo:`, `               -+oooooo+:`,
      `             \`/:-:++oooo+:`, `            \`/++++/+++++++:`, `           \`/++++++++++++++:`,
      `          \`/+++ooooooooooooo/\``, `         ./ooosssso++osssssso+\``, `        .oossssso-\`\`\`\`/ossssss+\``,
      `       -osssssso.      :ssssssso.`, `      :osssssss/        osssso+++.`, `     /ossssssss/        +ssssooo/-`,
      `   \`/ossssso+/:-        -:/+osssso+-`, `  \`+sso+:-\`                 \`.-/+oso:`, ` \`++:.                           \`-/+/`,
      ` .\`                                 \`/${C.reset}`
    ];
    const info = ["", `${C.c}${C.bold}root${C.reset}@${C.c}${C.bold}kryptos${C.reset}`, "-----------",
      `${C.y}OS${C.reset}: KryptOS (Krypton Linux) x86_64`, `${C.y}Host${C.reset}: KryptOS Web`, `${C.y}Kernel${C.reset}: 6.9.1-krypton`,
      `${C.y}Shell${C.reset}: ksh 1.0`, `${C.y}DE${C.reset}: GNOME 46 (web)`, `${C.y}Terminal${C.reset}: ksim`,
      `${C.y}CPU${C.reset}: Krypton Virtual`, `${C.y}Packages${C.reset}: ${installed.size} (pacman)`, `${C.y}Uptime${C.reset}: ${(Math.random()*40+1|0)} mins`, ""];
    for (let i = 0; i < Math.max(logo.length, info.length); i++)
      wl((logo[i] || " ".repeat(36)) + "   " + (info[i] || ""));
  }

  const commands = {
    help: () => wl("commands: pacman, ls, cd, cat, pwd, whoami, hostname, uname, echo, neofetch, clear, date, history, help"),
    pwd: () => wl(cwdStr()),
    whoami: () => wl("root"),
    hostname: () => wl("kryptos"),
    date: () => wl(new Date().toString()),
    "uname": a => wl(a.includes("-a") ? "Linux kryptos 6.9.1-krypton #1 SMP x86_64 GNU/Linux" : "Linux"),
    echo: a => wl(a.join(" ")),
    clear: () => term.write("\x1b[2J\x1b[H"),
    ls: a => { const node = at(cwd); if (node && typeof node === "object") wl(Object.keys(node).map(k => typeof node[k] === "object" ? `${C.b}${C.bold}${k}${C.reset}` : k).join("  ")); },
    cd: a => { const t = a[0]; if (!t || t === "~") cwd = ["root"]; else if (t === "..") { if (cwd.length > 1) cwd.pop(); } else { const n = at([...cwd, t]); if (n && typeof n === "object") cwd.push(t); else wl(`cd: ${t}: No such file or directory`); } },
    cat: a => { const n = at([...cwd, a[0]]); if (typeof n === "string") w(n); else wl(`cat: ${a[0]}: No such file or directory`); },
    neofetch, fastfetch: neofetch,
  };

  let line = "", history = [], hidx = -1, busy = false;
  function prompt() { w(promptStr()); }
  async function run(raw) {
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    history.push(raw); hidx = history.length;
    const cmd = parts[0], args = parts.slice(1);
    if (cmd === "pacman") { busy = true; await pacman(args); busy = false; }
    else if (cmd === "sudo") { await run(args.join(" ")); return; }
    else if (cmd === "history") history.forEach((h, i) => wl(` ${i + 1}  ${h}`));
    else if (cmd === "exit") wl("logout");
    else if (commands[cmd]) commands[cmd](args);
    else wl(`${C.r}${cmd}:${C.reset} command not found  (try: help)`);
  }

  term.onData(async d => {
    if (busy) return;
    for (const ch of d) {
      if (ch === "\r") { w("\r\n"); const l = line; line = ""; await run(l); prompt(); }
      else if (ch === "\x7f") { if (line.length) { line = line.slice(0, -1); w("\b \b"); } }
      else if (ch === "\x1b[A") { if (hidx > 0) { hidx--; while(line.length){line=line.slice(0,-1);w("\b \b");} line = history[hidx]; w(line); } }
      else if (ch === "\x1b[B") { if (hidx < history.length-1) { hidx++; while(line.length){line=line.slice(0,-1);w("\b \b");} line = history[hidx]; w(line); } }
      else if (ch >= " ") { line += ch; w(ch); }
    }
  });

  neofetch();
  wl(`${C.dim}simulated shell with a working pacman · try: pacman -S vim · pacman -Ss editor · help${C.reset}`);
  wl("");
  prompt();
}
