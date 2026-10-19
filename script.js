(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, IO = "IntersectionObserver" in window;

  $$("a.mail").forEach(function (a) {
    var m = a.dataset.u + "@" + a.dataset.d, s = a.dataset.s;
    a.href = "mailto:" + m + (s ? "?subject=" + encodeURIComponent(s) : "");
    if (!s) a.textContent = m;
  });
  $("#year").textContent = new Date().getFullYear();

  // Step-through simulations
  function stepper(r) {
    var li = $$("li", r), bar = $(".bar i", r), st = $(".state", r), cnt = $(".cnt", r), p = $(".play", r), t;
    var label = p ? p.textContent : "", det = null, rs = $(".rst", r);
    if (r.parentNode.dataset && r.parentNode.dataset.v) { det = document.createElement("div"); det.className = "det"; det.setAttribute("aria-live", "polite"); $("ol", r).insertAdjacentElement("afterend", det); }
    if (rs) rs.addEventListener("click", function () { stop(); go(0); });
    function go(i) {
      li.forEach(function (l, k) { l.classList.toggle("on", k === i); $("button", l).setAttribute("aria-pressed", k === i ? "true" : "false"); });
      if (bar) bar.style.width = ((i + 1) / li.length * 100) + "%";
      if (cnt) cnt.textContent = "Step " + (i + 1) + " of " + li.length;
      if (det) det.innerHTML = $("p", li[i]).innerHTML;
      if (st) { st.textContent = li[i].dataset.s || ""; st.className = "state mono " + (li[i].dataset.c || ""); }
    }
    function stop() { clearInterval(t); if (p) { p.textContent = label; p.disabled = false; } }
    li.forEach(function (l, i) { $("button", l).addEventListener("click", function () { stop(); go(i); }); });
    if (p) p.addEventListener("click", function () {
      clearInterval(t); var i = 0; go(0); p.textContent = "Playing…"; p.disabled = true;
      t = setInterval(function () {
        i++;
        if (i >= li.length) { clearInterval(t); p.textContent = "Replay"; p.disabled = false; return; }
        go(i);
      }, reduce ? 500 : 1800);
    });
    go(0);
  }

  // EAACD: send normal / suspicious requests (made-up numbers, illustration only)
  function reqsim(r) {
    var risk = 0, n = 0, bar = $(".bar i", r), st = $(".state", r), log = $(".log", r);
    var ST = [
      ["Normal", "ok", "200 OK"],
      ["Throttle", "warn", "200 OK, but slowed down"],
      ["Restrict", "warn", "200 OK, some actions blocked"],
      ["Isolate", "bad", "403 Forbidden"]
    ];
    function stage() { return risk >= 100 ? 3 : risk >= 75 ? 2 : risk >= 50 ? 1 : 0; }
    function show(msg) {
      var s = ST[stage()];
      bar.style.width = risk + "%";
      st.textContent = "Risk " + risk + "/100 · Stage: " + s[0] + " · " + msg;
      st.className = "state mono " + s[1];
    }
    function send(bad) {
      n++;
      var blocked = stage() === 3;
      if (bad && !blocked) risk = Math.min(100, risk + 25);
      var s = ST[stage()], li = document.createElement("li");
      li.textContent = "#" + n + " " + (bad ? "suspicious" : "normal") + " → " + (blocked ? "403 Forbidden (already isolated)" : s[2]);
      log.insertBefore(li, log.firstChild);
      while (log.children.length > 6) log.removeChild(log.lastChild);
      show(blocked ? "session is cut off" : "last reply: " + s[2]);
    }
    $(".rn", r).addEventListener("click", function () { send(false); });
    $(".rs", r).addEventListener("click", function () { send(true); });
    $(".rr", r).addEventListener("click", function () { risk = 0; n = 0; log.innerHTML = ""; show("waiting for a request"); });
  }

  // Network map
  var NM = {
    scan: ["Nmap, the scanner", "I ran it from my own machine: a port scan, service versions (-sV) and OS detection (-O).", "Nmap sends probes to a machine and reports which ports answer and what software is behind them.", "This is where the audit started."],
    host: ["The Linux target", "The machine in my lab that I audited.", "Everything else on the map is a finding about this one machine.", "I recorded the findings in a risk table, with terminal screenshots and the raw audit log as evidence."],
    telnet: ["Telnet on port 23 (rated critical)", "Port 23 was open and running Telnet.", "Telnet sends everything, passwords included, as plain text. Anyone who can watch the network can read it.", "My hardening script blocks it with UFW."],
    apache: ["Apache 2.4.7 (rated high)", "The web server was running an outdated version, Apache 2.4.7.", "Old software can have publicly known flaws that newer versions have fixed.", "I rated and documented it. My hardening script also turns on automatic updates."],
    smb: ["SMB on port 445 (rated medium)", "Port 445, used for Windows file sharing, showed as filtered.", "Filtered means something was blocking or hiding my probes, so Nmap couldn't tell if the port was open. File-sharing ports are a common target.", "My hardening script blocks it with UFW. It also turns off SSH root login."]
  };
  function netmap(r) {
    var out = $(".nmp", r); if (!out) return;
    var nr = $(".nmr", r); if (nr) nr.addEventListener("click", function () { $$("[data-k]", r).forEach(function (x) { x.classList.remove("sel"); }); out.textContent = "Select a box to start."; });
    $$("[data-k]", r).forEach(function (g) {
      function pick() {
        $$("[data-k]", r).forEach(function (x) { x.classList.remove("sel"); }); g.classList.add("sel");
        var v = NM[g.dataset.k];
        out.innerHTML = "<p class='nmt'>" + v[0] + "</p><p><b>What I found:</b> " + v[1] + "</p><p><b>Why it matters:</b> " + v[2] + "</p><p><b>What I did:</b> " + v[3] + "</p>";
      }
      g.addEventListener("click", pick);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  }

  // Inline demos
  $$("[data-mount]").forEach(function (m) {
    m.innerHTML = $("#t-" + m.dataset.mount).innerHTML; m.classList.add("v-" + m.dataset.v);
    var h = $("h2", m), s = $(".sub", m); if (h) h.remove(); if (s) s.remove();
    $$(".stepper", m).forEach(stepper); $$(".reqsim", m).forEach(reqsim); netmap(m);
  });

  // Videos: embedded only after a click, never autoplay
  $$(".vid").forEach(function (box) {
    var b = $(".vbtn", box), slot = $(".vslot", box), id = b.dataset.vid, yt = "https://www.youtube.com/watch?v=" + id, tm, ok;
    function close() { clearTimeout(tm); slot.innerHTML = ""; b.hidden = false; b.focus(); }
    function fail() {
      clearTimeout(tm); slot.innerHTML = "";
      var w = document.createElement("div"); w.className = "vw";
      w.innerHTML = "<p>The video could not load here. You can still watch it on YouTube.</p><p class='vbar'><a class='btn sm' target='_blank' rel='noopener' href='" + yt + "'>Open on YouTube ↗</a><button type='button' class='btn sm ghost'>Close</button></p>";
      $("button", w).addEventListener("click", close); slot.appendChild(w);
    }
    b.addEventListener("click", function () {
      b.hidden = true; slot.innerHTML = "";
      if (navigator.onLine === false) return fail();
      var w = document.createElement("div"), fr = document.createElement("div"), f = document.createElement("iframe"), bar = document.createElement("p");
      w.className = "vw"; fr.className = "frame"; bar.className = "vbar";
      f.title = b.dataset.t; f.loading = "lazy"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allow = "encrypted-media; picture-in-picture; fullscreen";
      f.addEventListener("load", function () { ok = true; clearTimeout(tm); });
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
      bar.innerHTML = "<button type='button' class='btn sm'>Hide video ✕</button><a class='btn sm ghost' target='_blank' rel='noopener' href='" + yt + "'>Open on YouTube ↗</a>";
      $("button", bar).addEventListener("click", close);
      fr.appendChild(f); w.appendChild(fr); w.appendChild(bar); slot.appendChild(w);
      w.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
      $("button", bar).focus(); tm = setTimeout(function () { if (!ok) fail(); }, 10000);
    });
  });

  // Skills: what it is, where I used it, what I did, how far I've taken it
  var SK = {
    "Wazuh": ["A SIEM: it collects security logs and raises alerts.", "Wazuh SOC home lab", "Deployed it from the official OVA on VirtualBox, simulated failed logins on a Windows machine, and investigated the alerts, including a new local account and privilege escalation.", "Home lab with one endpoint. No production use."],
    "Snort": ["An intrusion detection tool that watches network traffic and alerts on rules.", "Firewall, IDS and IPS lab", "Wrote a rule and compared tools that only alert with tools that block.", "One rule in a lab setting."],
    "Fail2ban": ["Bans an address after repeated failed attempts, such as bad logins.", "Firewall, IDS and IPS lab", "Wrote a rule and compared its blocking with Snort's alerting.", "One rule in a lab setting."],
    "Nmap": ["A scanner that finds open ports, the software behind them, and the operating system.", "Network reconnaissance, network vulnerability audit, Linux hardening lab", "Ran port, version and OS scans on my own machines and rated what I found.", "Used on my own lab machines only."],
    "Python": ["A general-purpose programming language, used here for security tooling.", "AWS attack-surface diff engine, SHFSL dashboard, controls at ProJenius", "Wrote a tool that compares an AWS baseline with the live state, and worked on the SHFSL dashboard and the ProJenius controls.", "Project-sized tools, not large production systems."],
    "Bash": ["The Linux command-line language, good for automating admin tasks.", "Linux infrastructure hardening", "Wrote a script that blocks Telnet and SMB, automates updates and disables SSH root login.", "One hardening script."],
    "UFW": ["A simple firewall tool for Ubuntu.", "Linux infrastructure hardening", "Used it to block Telnet (port 23) and SMB (port 445).", "Basic allow and block rules."],
    "PowerShell": ["Windows' scripting and administration shell.", "Project Sentinel forensic triage", "Took a snapshot of machine state and matched process IDs to show a port 7070 listener was a legitimate service.", "One triage script."],
    "Boto3 / Moto": ["Boto3 is the Python toolkit for AWS. Moto fakes AWS so you can test safely.", "AWS attack-surface diff engine", "Compared a known-good baseline with the live state to find public S3 buckets, open SSH ports and unauthorized IAM keys. Output is JSON for SIEMs.", "Tested against Moto's simulated AWS."],
    "John the Ripper": ["A password-cracking tool used to check how weak passwords are.", "Offline password risk assessment", "Ran it on md5crypt hashes I generated myself.", "Only hashes I created."],
    "Streamlit": ["A Python library for quick web dashboards.", "SHFSL 2.0 live dashboard", "Built the dashboard that shows live risk scores.", "A project dashboard."],
    "Flask / Node.js / MongoDB": ["The web frameworks and database the attendance app is built on.", "The ProJenius attendance app", "Worked on the security of the app: 10 fixes and 7+ controls.", "I hardened an existing app. I didn't design it."],
    "Burp Suite": ["A tool for testing how web apps respond to crafted requests.", "Not shown in a repo yet", "It's the tool I plan to use for website security checks.", "Still learning. I have no documented project with it yet."]
  }, ch = $("#chips"), used = $("#used");
  function pick(k) {
    var v = SK[k];
    $$("button", ch).forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.k === k ? "true" : "false"); });
    used.innerHTML = "<p class='nmt'>" + k + "</p><p><b>What it's for:</b> " + v[0] + "</p><p><b>Where I used it:</b> " + v[1] + "</p><p><b>What I did:</b> " + v[2] + "</p><p><b>Experience level:</b> " + v[3] + "</p>";
  }
  Object.keys(SK).forEach(function (k) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = k; b.dataset.k = k; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { pick(k); });
    ch.appendChild(b);
  });
  pick("Wazuh");

  // Nav highlight and reveal
  if (IO) {
    var links = $$("nav a"), spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { var on = a.getAttribute("href") === "#" + e.target.id; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["overview", "work", "labs", "internship", "skills", "checks", "contact"].forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    if (!reduce) {
      document.documentElement.classList.add("js");
      var rv = new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }); }, { threshold: .06 });
      $$("main section:not(.hero)").forEach(function (s) { s.classList.add("rv"); rv.observe(s); });
    }
  }

  // Decorative hero network
  var c = $("#net"), x = c.getContext("2d"), W, H, P = [], run = true;
  function size() {
    var q = Math.min(devicePixelRatio || 1, 2), b = c.getBoundingClientRect(); W = b.width; H = b.height;
    c.width = W * q; c.height = H * q; x.setTransform(q, 0, 0, q, 0, 0);
    P = []; for (var i = 0; i < 38; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3 });
  }
  function draw() {
    x.clearRect(0, 0, W, H);
    P.forEach(function (p) { if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; } });
    for (var i = 0; i < P.length; i++) {
      for (var j = i + 1; j < P.length; j++) {
        var dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, q = dx * dx + dy * dy;
        if (q < 14000) { x.strokeStyle = "rgba(34,199,232," + (.5 * (1 - q / 14000)).toFixed(2) + ")"; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(P[j].x, P[j].y); x.stroke(); }
      }
      x.fillStyle = i % 9 === 0 ? "#FF6A3D" : "#22C7E8"; x.beginPath(); x.arc(P[i].x, P[i].y, i % 9 === 0 ? 4 : 2.4, 0, 6.3); x.fill();
    }
    if (!reduce && run) requestAnimationFrame(draw);
  }
  size(); draw(); addEventListener("resize", function () { size(); if (reduce) draw(); });
  if (IO && !reduce) new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !run) { run = true; draw(); } run = v; }).observe(c);
})();
