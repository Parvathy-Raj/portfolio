const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* =========================================================
   Chat: a tiny keyword retriever over this page's content.
   Every answer cites the section it came from; anything
   else gets a refusal.
   ========================================================= */
const SOURCES = {
  "docs-brain": "Docs Brain MCP Server",
  "uae-rag": "UAE Regulatory RAG",
  "prompt-heist": "Prompt Heist",
  "experience": "Experience",
  "research": "Research",
  "education": "Education",
  "skills": "Skills",
  "contact": "Contact",
  "projects": "Projects",
  "about": "About",
};

const KB = [
  {
    keys: ["mcp", "model context protocol", "server", "claude desktop", "cursor", "tool", "tools", "function calling"],
    answer: "Yes. Docs Brain is an MCP server that gives Claude Desktop, Cursor and other MCP clients cited search over the FastAPI docs, with typed tools and structured output [docs-brain]. At Kinetics Group I work on agents and tool calling day to day [experience].",
  },
  {
    keys: ["rag", "retrieval", "test", "testing", "evaluate", "evaluation", "eval", "quality", "measure", "accuracy", "recall", "faithfulness", "hallucination", "metrics", "golden"],
    answer: "I build the evaluation before the feature. UAE Regulatory RAG has a human-verified golden set, an LLM judge checked against human labels, and a CI gate that blocks pull requests that make retrieval or faithfulness worse [uae-rag]. Docs Brain reached 98% recall@5 on 40 hand-labelled questions, and the same evaluation showed rerankers weren't worth their cost [docs-brain].",
  },
  {
    keys: ["prompt injection", "injection", "security", "jailbreak", "guard", "guardrails", "safety", "attack", "red team", "secure"],
    answer: "Prompt Heist is a game and benchmark built on prompt injection: five stacked defenses, a leak detector for disguised secrets, and attack-success and false-positive rates with confidence intervals [prompt-heist]. Docs Brain also filters injection attempts out of retrieved docs before the model sees them [docs-brain].",
  },
  {
    keys: ["location", "where", "based", "uae", "dubai", "india"],
    answer: "I've worked in Dubai (Renie) and India (ICFOSS) [experience]. You can reach me on my UAE or Indian number [contact].",
  },
  {
    keys: ["experience", "years", "work", "job", "jobs", "career", "company", "companies", "kinetics", "renie", "icfoss", "kpmg", "current", "role", "now"],
    answer: "I'm an AI Engineer at Kinetics Group in Dubai, building agentic AI systems and multi-agent workflows. Before that I was an AI Engineer at Renie in Dubai, an AI/ML Engineer at ICFOSS in India, and a data analytics consulting intern at KPMG [experience].",
  },
  {
    keys: ["agent", "agents", "agentic", "multi-agent", "langgraph", "langchain", "llamaindex", "workflow", "automation", "n8n", "memory", "human-in-the-loop"],
    answer: "Agentic AI is my main focus: multi-agent systems, tool calling, agent memory and human-in-the-loop design with LangGraph and LangChain [skills]. At Renie I built an analytics agent that turns plain-language questions into PostgreSQL queries [experience].",
  },
  {
    keys: ["research", "paper", "publication", "published", "icon", "malayalam", "plagiarism", "nlp"],
    answer: "I published \"Comprehensive Plagiarism Detection in Malayalam Texts\" at ICON 2024 (NLP Association of India) [research], based on the plagiarism checker I built at ICFOSS [experience].",
  },
  {
    keys: ["education", "degree", "msc", "m.sc", "bsc", "b.sc", "big data", "analytics", "computer science", "university", "study", "studied", "college"],
    answer: "M.Sc in Big Data Analytics from the Central University of Rajasthan, and B.Sc in Computer Science from the University of Kerala [education].",
  },
  {
    keys: ["skills", "stack", "python", "fastapi", "django", "postgres", "postgresql", "pgvector", "aws", "docker", "vector", "pinecone", "faiss", "chroma", "openai", "groq", "ollama", "gemini", "llm", "llms", "tech", "toolkit"],
    answer: "Python and FastAPI on the backend; PostgreSQL with pgvector, FAISS, ChromaDB and Pinecone for retrieval; OpenAI, Claude, Gemini, Groq and Ollama for models; Docker, AWS and CI/CD to ship [skills].",
  },
  {
    keys: ["contact", "email", "hire", "call", "phone", "whatsapp", "linkedin", "github", "reach", "interview", "cv", "resume"],
    answer: "Email parvathyraj12@gmail.com, or call or WhatsApp +971 50 403 1831 (UAE) or +91 80782 76949 (India) [contact].",
  },
  {
    keys: ["project", "projects", "built", "portfolio", "demo", "best"],
    answer: "Three main projects, each with a demo on this page: an MCP server for cited docs search [docs-brain], a RAG system for UAE tax guides with a CI evaluation gate [uae-rag], and a prompt-injection game with a benchmark [prompt-heist].",
  },
];

const STOP = new Set("a an the is are do does did you your i me my of to in on for and or with have has had can could what which how who about any ever she her he his they be been".split(" "));
const tokens = (t) => t.toLowerCase().replace(/[^a-z0-9.\- ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));

function retrieve(question) {
  const q = question.toLowerCase();
  const qt = new Set(tokens(question));
  let best = null, bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const k of entry.keys) {
      if (k.includes(" ")) { if (q.includes(k)) score += 3; }
      else if (qt.has(k)) score += 2;
      else if (k.length > 4 && [...qt].some((t) => t.startsWith(k.slice(0, 5)))) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return bestScore >= 2 ? best : null;
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const log = $("#chat-log");
const input = $("#ask-input");
let busy = false;

function bubble(cls, html) {
  const el = document.createElement("div");
  el.className = `msg ${cls}`;
  el.innerHTML = html;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function ask(question) {
  const q = question.trim();
  if (!q || busy) { input.focus(); return; }
  busy = true;
  input.value = "";
  bubble("user", `<p>${escapeHtml(q)}</p>`);
  const thinking = bubble("bot", `<span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span>`);
  const entry = retrieve(q);

  setTimeout(() => {
    thinking.remove();
    if (!entry) {
      bubble("bot refusal", `<p>This page doesn't answer that, so I won't guess. Email me at <a href="mailto:parvathyraj12@gmail.com">parvathyraj12@gmail.com</a> and I'll reply directly.</p>`);
      busy = false;
      return;
    }
    // Number citations in order of first appearance.
    const order = [];
    const text = entry.answer.replace(/\[([a-z-]+)\]/g, (_, id) => {
      if (!order.includes(id)) order.push(id);
      return `[[${order.indexOf(id) + 1}:${id}]]`;
    });
    const toHtml = (s) => escapeHtml(s).replace(/\[\[(\d+):([a-z-]+)\]\]/g,
      (_, n, id) => `<a class="cite" href="#${id}" data-cite="${id}" aria-label="Source ${n}: ${SOURCES[id]}">${n}</a>`);
    const sources = order.map((id, i) => `<li><b>${i + 1}</b><a href="#${id}" data-cite="${id}">${SOURCES[id]}</a></li>`).join("");

    const msg = bubble("bot", `<p></p><ul class="sources" hidden>${sources}</ul>`);
    const p = $("p", msg), list = $(".sources", msg);
    const done = () => { list.hidden = false; log.scrollTop = log.scrollHeight; busy = false; };
    if (reduceMotion) { p.innerHTML = toHtml(text); done(); return; }

    const words = text.split(" ");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      p.innerHTML = toHtml(words.slice(0, i).join(" "));
      log.scrollTop = log.scrollHeight;
      if (i >= words.length) { clearInterval(timer); done(); }
    }, 26);
  }, reduceMotion ? 0 : 550);
}

$("#ask-form").addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
$$(".chip").forEach((c) => c.addEventListener("click", () => ask(c.textContent)));

// Following a citation highlights the source.
log.addEventListener("click", (e) => {
  const link = e.target.closest("[data-cite]");
  if (!link) return;
  const target = document.getElementById(link.dataset.cite);
  if (!target) return;
  target.classList.remove("flash");
  void target.offsetWidth;
  target.classList.add("flash");
});

/* =========================================================
   Hero: rotating role words
   ========================================================= */
(() => {
  const el = $("#rot-word");
  const words = ["AI agents", "RAG systems", "MCP servers", "multi-agent workflows", "LLM evaluations"];
  if (reduceMotion) return;
  let w = 0, c = words[0].length, deleting = true;
  const tick = () => {
    const word = words[w];
    if (deleting) {
      c -= 1;
      if (c <= 0) { deleting = false; w = (w + 1) % words.length; }
    } else {
      c += 1;
      if (c >= words[w].length) { deleting = true; el.textContent = words[w]; return setTimeout(tick, 1800); }
    }
    el.textContent = (deleting ? word : words[w]).slice(0, Math.max(c, 0)) || "​";
    setTimeout(tick, deleting ? 40 : 75);
  };
  setTimeout(tick, 2200);
})();

/* =========================================================
   Scroll effects: header, progress, active nav, back-to-top
   ========================================================= */
const topbar = $("#topbar");
const bar = $("#progress-bar");
const toTop = $("#to-top");
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  topbar.classList.toggle("scrolled", y > 10);
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  toTop.hidden = y < 700;
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

// Highlight the menu link for the section in the middle of the screen.
const navLinks = $$(".nav a");
const navSections = ["top", "about", "skills", "experience", "projects", "education", "contact"].map((id) => document.getElementById(id));
function updateActiveNav() {
  const mid = innerHeight * 0.45;
  let current = navSections[0];
  for (const s of navSections) if (s.getBoundingClientRect().top <= mid) current = s;
  if (innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = navSections[navSections.length - 1];
  navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current.id}`));
}
window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

/* Mobile menu */
const menuBtn = $("#menu-btn");
const nav = $("#nav");
const setMenu = (open) => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
navLinks.forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (e) => { if (!nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* =========================================================
   Reveal on scroll + counters
   ========================================================= */
function countUp(el) {
  const to = Number(el.dataset.to);
  if (reduceMotion) { el.textContent = to; return; }
  const start = performance.now(), dur = 1200;
  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealObs = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    en.target.classList.add("in");
    $$(".count", en.target).forEach(countUp);
    revealObs.unobserve(en.target);
  }
}, { threshold: 0.12 });
$$(".reveal").forEach((el) => revealObs.observe(el));

/* =========================================================
   Tabs (skills + experience)
   ========================================================= */
$$("[data-tabs]").forEach((wrap) => {
  const tabs = $$('[role="tab"]', wrap);
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true);
    });
  });
});

/* =========================================================
   Project cards: hover preview + modal
   ========================================================= */
const cards = $$(".card");
const previewOn = (card) => { const v = $("video", card); card.classList.add("previewing"); v.play().catch(() => {}); };
const previewOff = (card) => { const v = $("video", card); card.classList.remove("previewing"); v.pause(); };

if (canHover) {
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => previewOn(card));
    card.addEventListener("mouseleave", () => previewOff(card));
  });
} else if (!reduceMotion) {
  // Touch screens: play the card that's mostly on screen.
  const touchObs = new IntersectionObserver((entries) => {
    for (const en of entries) en.intersectionRatio >= 0.6 ? previewOn(en.target) : previewOff(en.target);
  }, { threshold: [0, 0.6] });
  cards.forEach((c) => touchObs.observe(c));
}

const modal = $("#modal");
const modalVideo = $("#modal-video");
const modalBody = $("#modal-body");
let lastFocus = null;

function openModal(card) {
  const id = card.dataset.project;
  lastFocus = document.activeElement;
  modalBody.replaceChildren($(`#tpl-${id}`).content.cloneNode(true));
  modalVideo.src = `media/${id}.mp4`;
  modalVideo.poster = `media/${id}.jpg`;
  cards.forEach(previewOff);
  modal.showModal();
  modal.scrollTop = 0;
  modalVideo.play().catch(() => {});
}
function closeModal() { modal.close(); }
modal.addEventListener("close", () => {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  if (lastFocus) lastFocus.focus();
});
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
cards.forEach((card) => {
  $(".thumb", card).addEventListener("click", () => openModal(card));
  $(".open-modal", card).addEventListener("click", () => openModal(card));
});

/* =========================================================
   Contact form: opens the visitor's email app, pre-filled
   ========================================================= */
$("#msg-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const company = f.company.value.trim();
  const message = f.message.value.trim();
  f.name.setAttribute("aria-invalid", String(!name));
  f.message.setAttribute("aria-invalid", String(!message));
  const err = $("#form-error");
  if (!name || !message) { err.hidden = false; (name ? f.message : f.name).focus(); return; }
  err.hidden = true;
  const subject = `Hello from ${name}${company ? ` (${company})` : ""}`;
  const body = `${message}\n\n${name}${company ? `\n${company}` : ""}`;
  window.location.href = `mailto:parvathyraj12@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

$("#year").textContent = new Date().getFullYear();

/* =========================================================
   Theme toggle (light by default, remembered per visitor)
   ========================================================= */
const root = document.documentElement;
const themeBtn = $("#theme-btn");
const themeMeta = $('meta[name="theme-color"]');
function applyTheme(t) {
  root.dataset.theme = t;
  themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeMeta.setAttribute("content", t === "dark" ? "#14110F" : "#F5F0E8");
}
applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme-v2", next); } catch (e) { /* storage blocked */ }
});

/* =========================================================
   Hero particles: drifting dots joined by faint lines
   ========================================================= */
(() => {
  const canvas = $("#particles");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  const hero = $(".hero");
  let w = 0, h = 0, dots = [], running = false, raf = 0;

  const color = () => getComputedStyle(root).getPropertyValue("--a1").trim() || "#d9bc94";
  const hexToRgb = (hex) => {
    const m = hex.replace("#", "");
    const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, (w * h) / 18000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
    }));
  }

  function frame() {
    const [r, g, b] = hexToRgb(color());
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
    }
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const c = dots[j];
        const dist = Math.hypot(a.x - c.x, a.y - c.y);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.14 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  resize();
  window.addEventListener("resize", resize);
  // Only animate while the hero is on screen.
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(hero);
})();
