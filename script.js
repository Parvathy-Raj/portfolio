const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* =========================================================
   "Ask about Parvathy": a floating assistant.
   A tiny keyword retriever over this page's content. Every
   answer cites the section it came from; anything else gets
   a polite refusal instead of a guess.
   ========================================================= */
const SOURCES = {
  "docs-brain": "Docs Brain MCP Server",
  "uae-rag": "UAE Regulatory RAG",
  "prompt-heist": "Prompt Heist",
  "hallucination-firewall": "Hallucination Firewall",
  "experience": "Experience",
  "research": "Research",
  "education": "Education",
  "skills": "Skills",
  "contact": "Contact",
  "projects": "Projects",
  "about": "About",
};

// Answers: one paragraph per line; lines starting with "- " become bullets.
const KB = [
  {
    id: "now",
    keys: ["now", "current", "currently", "today", "kinetics", "submittal", "submittals", "netsuite", "routing", "inquiry", "inquiries", "kats", "doing"],
    answer: "Parvathy is an AI Engineer at Kinetics Group in Dubai, working with the CEO and the heads of Sales, Engineering, Logistics and Administration [experience]. Recent work:\n- AI Submittal Control Platform: prep time down from 2 hours to 10 minutes, used for 200+ submittals a month\n- 5 production n8n workflows linking NetSuite, databases, email and AI agents\n- LLM inquiry routing that gets each inquiry to the right person in under an hour\n- KATS, a LangGraph agent with function calling and MCP integrations",
  },
  {
    id: "experience",
    keys: ["experience", "years", "career", "job", "jobs", "company", "companies", "renie", "icfoss", "kpmg", "background", "previous", "history", "roles"],
    answer: "Parvathy has 3 years of experience in AI and ML [experience]:\n- AI Engineer, Kinetics Group, Dubai (May 2026 – present)\n- AI Engineer, Renie, Dubai (2025): plain-English analytics, a production RAG chatbot and a recommendation engine on AWS\n- AI/ML Engineer, ICFOSS, India (2023–2024): Malayalam plagiarism detection, published at ICON 2024\n- Data analytics consulting intern, KPMG (2023)",
  },
  {
    id: "projects",
    keys: ["project", "projects", "built", "build", "portfolio", "demo", "demos", "made", "showcase"],
    answer: "Four portfolio projects, each with a demo on this page:\n- UAE Regulatory RAG: cited answers over UAE tax guides, with a CI evaluation gate [uae-rag]\n- Prompt Heist: a prompt-injection game and benchmark [prompt-heist]\n- Docs Brain: an MCP server for cited docs search [docs-brain]\n- Hallucination Firewall: an MCP server that catches hallucinations in agent answers [hallucination-firewall]\nOpen any project card to watch its demo.",
  },
  {
    id: "hardest",
    keys: ["hardest", "difficult", "challenging", "challenge", "complex", "proud", "impressive", "technically"],
    answer: "The Hallucination Firewall is the most technically involved [hallucination-firewall]. It splits an agent's draft answer into single-fact claims and checks each one against the tool outputs the agent actually received: exact checks first, then an NLI model, and an LLM judge only when needed. Wrong claims are blocked or rewritten with citations.\nIn production, the biggest is the AI Submittal Control Platform at Kinetics Group, which the engineering team uses for every submittal [experience].",
  },
  {
    id: "backend",
    keys: ["backend", "back-end", "api", "apis", "fastapi", "django", "database", "databases", "sql", "postgres", "postgresql", "deploy", "deployment", "aws", "docker", "infrastructure", "devops"],
    answer: "Parvathy builds backends in Python [skills]:\n- FastAPI services for AI features, and Django REST Framework at ICFOSS\n- PostgreSQL with pgvector, plus FAISS, ChromaDB and Pinecone for retrieval\n- Docker, NGINX, Gunicorn, AWS and CI/CD to ship; the ICFOSS deployment cut response latency by 40% [experience]\n- NetSuite APIs, REST services, databases and email wired together through n8n",
  },
  {
    id: "firewall",
    keys: ["hallucination", "hallucinations", "hallucinate", "firewall", "fact check", "fact-check", "verify", "verification", "grounded", "grounding", "nli", "trust", "trustworthy", "reliable", "reliability"],
    answer: "The Hallucination Firewall is an MCP server that checks an agent's answer against the tool outputs it actually received [hallucination-firewall]:\n- Splits the draft into single-fact claims\n- Verifies each with exact checks, an NLI model, and an LLM judge only when needed\n- Blocks or rewrites wrong claims, with citations\nUAE Regulatory RAG also refuses questions its sources don't cover instead of guessing [uae-rag].",
  },
  {
    id: "mcp",
    keys: ["mcp", "model context protocol", "claude desktop", "cursor", "tool", "tools", "function calling"],
    answer: "Yes, two of them. Docs Brain gives Claude Desktop, Cursor and other MCP clients cited search over the FastAPI docs, with typed tools and structured output [docs-brain]. The Hallucination Firewall verifies an agent's answer against its tool outputs before it goes out [hallucination-firewall].\nAt Kinetics Group, the KATS agent also uses MCP integrations [experience].",
  },
  {
    id: "eval",
    keys: ["rag", "retrieval", "test", "testing", "tests", "evaluate", "evaluation", "eval", "evals", "quality", "measure", "accuracy", "recall", "faithfulness", "metrics", "golden"],
    answer: "Parvathy builds the evaluation before the feature [uae-rag]:\n- A human-verified golden set for UAE Regulatory RAG\n- An LLM judge checked against human labels\n- A CI gate that blocks pull requests that make retrieval or faithfulness worse\nDocs Brain reached 98% recall@5 on 40 hand-labelled questions, and the same evaluation showed rerankers weren't worth their cost [docs-brain].",
  },
  {
    id: "security",
    keys: ["prompt injection", "injection", "security", "jailbreak", "guard", "guardrails", "safety", "attack", "attacks", "red team", "secure"],
    answer: "Prompt Heist is a game and benchmark built on prompt injection [prompt-heist]:\n- Five stacked defenses\n- A leak detector that catches disguised secrets\n- Attack-success and false-positive rates with confidence intervals\nDocs Brain also filters injection attempts out of retrieved docs before the model sees them [docs-brain].",
  },
  {
    id: "agents",
    keys: ["agent", "agents", "agentic", "multi-agent", "langgraph", "langchain", "llamaindex", "workflow", "workflows", "automation", "automate", "n8n", "memory", "human-in-the-loop"],
    answer: "Agentic AI is Parvathy's main focus: multi-agent systems, tool calling, agent memory and human-in-the-loop design with LangGraph and LangChain [skills]. Examples:\n- KATS, a LangGraph agent for engineering knowledge lookup and report generation at Kinetics Group [experience]\n- 5 production n8n workflows that remove manual hand-offs between teams\n- AI SQL agents at Renie that answer plain-English questions over PostgreSQL",
  },
  {
    id: "stack",
    keys: ["skills", "stack", "python", "vector", "pinecone", "faiss", "chroma", "openai", "groq", "ollama", "gemini", "claude", "llm", "llms", "tech", "technology", "technologies", "toolkit", "languages", "use"],
    answer: "Parvathy's main stack [skills]:\n- Python, FastAPI and Django on the backend\n- LangGraph, LangChain and LlamaIndex for agents and RAG\n- PostgreSQL with pgvector, FAISS, ChromaDB and Pinecone for retrieval\n- OpenAI, Claude, Gemini, Groq and Ollama for models\n- Docker, AWS and CI/CD to ship",
  },
  {
    id: "research",
    keys: ["research", "paper", "publication", "published", "icon", "malayalam", "plagiarism", "nlp"],
    answer: "Parvathy published \"Comprehensive Plagiarism Detection in Malayalam Texts\" at ICON 2024, the NLP Association of India's conference [research]. It grew out of the plagiarism detection platform built at ICFOSS [experience].",
  },
  {
    id: "education",
    keys: ["education", "degree", "degrees", "msc", "m.sc", "bsc", "b.sc", "big data", "computer science", "university", "study", "studied", "college", "qualification"],
    answer: "- M.Sc Big Data Analytics, Central University of Rajasthan\n- B.Sc Computer Science, University of Kerala [education]",
  },
  {
    id: "location",
    keys: ["location", "where", "based", "live", "uae", "dubai", "india"],
    answer: "Parvathy is based in Dubai, and has worked in Dubai (Kinetics Group, Renie) and India (ICFOSS) [experience].",
  },
  {
    id: "contact",
    keys: ["contact", "email", "hire", "call", "phone", "whatsapp", "linkedin", "github", "reach", "interview", "cv", "resume", "talk", "message"],
    answer: "You can reach Parvathy by [contact]:\n- Email: parvathyraj12@gmail.com\n- Phone or WhatsApp: +971 50 403 1831 (UAE) or +91 80782 76949 (India)\n- The message form in the Contact section",
  },
  {
    id: "hello",
    keys: ["hi", "hello", "hey", "thanks", "thank"],
    answer: "Hi! Ask me anything about Parvathy's projects, stack or experience. Every answer links to where it comes from on this page.",
  },
];

// Suggested questions, each tied to the answer it should open.
const SUGGESTIONS = [
  ["What projects has Parvathy built?", "projects"],
  ["What does Parvathy work on now?", "now"],
  ["Show me Parvathy's backend experience.", "backend"],
  ["What was the most technically difficult project?", "hardest"],
  ["Has Parvathy built an MCP server?", "mcp"],
  ["How does Parvathy test RAG quality?", "eval"],
  ["What technologies does Parvathy use?", "stack"],
  ["Any prompt-injection experience?", "security"],
  ["Tell me about the research paper.", "research"],
  ["How can I contact Parvathy?", "contact"],
];

const STOP = new Set("a an the is are do does did you your i me my of to in on for and or with have has had can could what which how who about any ever she her he his they them their be been parvathy parvathy's raj tell show".split(" "));
const tokens = (t) => t.toLowerCase().replace(/[^a-z0-9.\- ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
const byId = Object.fromEntries(KB.map((e) => [e.id, e]));

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
const chatbot = $("#chatbot");
const panel = $("#chat-panel");
const launcher = $("#chat-launcher");
const teaser = $("#chat-teaser");
const log = $("#chat-log");
const input = $("#ask-input");
const chips = $("#chips");
const asked = new Set();
let busy = false;

function bubble(cls, html) {
  const el = document.createElement("div");
  el.className = `msg ${cls}`;
  el.innerHTML = html;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function renderChips() {
  const left = SUGGESTIONS.filter(([, id]) => !asked.has(id)).slice(0, 4);
  chips.innerHTML = left.map(([q, id]) => `<button type="button" class="chip" data-id="${id}">${escapeHtml(q)}</button>`).join("");
  chips.hidden = left.length === 0 || busy;
}
chips.addEventListener("click", (e) => {
  const c = e.target.closest(".chip");
  if (c) ask(c.textContent, byId[c.dataset.id]);
});

function ask(question, forced) {
  const q = question.trim();
  if (!q || busy) { input.focus(); return; }
  busy = true;
  chips.hidden = true;
  input.value = "";
  bubble("user", `<p>${escapeHtml(q)}</p>`);
  const thinking = bubble("bot", `<span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span>`);
  const entry = forced || retrieve(q);
  if (entry) asked.add(entry.id);

  setTimeout(() => {
    thinking.remove();
    const finish = () => { busy = false; renderChips(); log.scrollTop = log.scrollHeight; };
    if (!entry) {
      bubble("bot refusal", `<p>That isn't covered on this page, so I won't guess. Email Parvathy at <a href="mailto:parvathyraj12@gmail.com">parvathyraj12@gmail.com</a> for a direct reply.</p>`);
      return finish();
    }
    // Number citations in order of first appearance.
    const order = [];
    const marked = entry.answer.replace(/\s*\[([a-z-]+)\]/g, (_, id) => {
      if (!order.includes(id)) order.push(id);
      return ` [[${order.indexOf(id) + 1}:${id}]]`;
    });
    const blocks = marked.split("\n").map((line) => line.startsWith("- ")
      ? { li: true, words: line.slice(2).split(" ") }
      : { li: false, words: line.split(" ") });
    const total = blocks.reduce((n, b) => n + b.words.length, 0);
    const inline = (s) => escapeHtml(s).replace(/\[\[(\d+):([a-z-]+)\]\]/g,
      (_, n, id) => `<a class="cite" href="#${id}" data-cite="${id}" aria-label="Source ${n}: ${SOURCES[id]}">${n}</a>`);
    const render = (shown) => {
      let html = "", inList = false, left = shown;
      for (const b of blocks) {
        if (left <= 0) break;
        const text = inline(b.words.slice(0, left).join(" "));
        left -= b.words.length;
        if (b.li && !inList) { html += `<ul class="bul">`; inList = true; }
        if (!b.li && inList) { html += `</ul>`; inList = false; }
        html += b.li ? `<li>${text}</li>` : `<p>${text}</p>`;
      }
      return html + (inList ? "</ul>" : "");
    };
    const sources = order.map((id, i) => `<li><b>${i + 1}</b><a href="#${id}" data-cite="${id}">${SOURCES[id]}</a></li>`).join("");
    const msg = bubble("bot", `<div class="ans"></div>${sources ? `<ul class="sources" hidden>${sources}</ul>` : ""}`);
    const body = $(".ans", msg), list = $(".sources", msg);
    const done = () => { if (list) list.hidden = false; finish(); };
    if (reduceMotion) { body.innerHTML = render(total); return done(); }

    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      body.innerHTML = render(i);
      log.scrollTop = log.scrollHeight;
      if (i >= total) { clearInterval(timer); done(); }
    }, 22);
  }, reduceMotion ? 0 : 550);
}

function setChat(open) {
  chatbot.classList.toggle("open", open);
  panel.hidden = !open;
  launcher.setAttribute("aria-expanded", String(open));
  launcher.setAttribute("aria-label", open ? "Close chat" : "Ask about Parvathy");
  if (open) {
    teaser.hidden = true;
    try { sessionStorage.setItem("chat-seen", "1"); } catch (e) {}
    log.scrollTop = log.scrollHeight;
    if (canHover) input.focus();
  }
}
launcher.addEventListener("click", () => setChat(panel.hidden));
teaser.addEventListener("click", () => setChat(true));
$("#chat-close").addEventListener("click", () => { setChat(false); launcher.focus(); });
$$("[data-open-chat]").forEach((b) => b.addEventListener("click", () => setChat(true)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setChat(false); launcher.focus(); } });
$("#ask-form").addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
renderChips();

// A one-time nudge, once per visit.
(() => {
  let seen = false;
  try { seen = sessionStorage.getItem("chat-seen") === "1"; } catch (e) {}
  if (seen) return;
  setTimeout(() => { if (panel.hidden) teaser.hidden = false; }, 4000);
  setTimeout(() => { teaser.hidden = true; }, 16000);
})();

// Following a citation highlights the source (and gets the panel out of the way on small screens).
log.addEventListener("click", (e) => {
  const link = e.target.closest("[data-cite]");
  if (!link) return;
  const target = document.getElementById(link.dataset.cite);
  if (!target) return;
  if (window.innerWidth < 640) setChat(false);
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
const cards = $$(".card[data-project]"); // project cards only (the research paper card has no demo)
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
   Theme toggle (dark by default, remembered per visitor)
   ========================================================= */
const root = document.documentElement;
const themeBtn = $("#theme-btn");
const themeMeta = $('meta[name="theme-color"]');
function applyTheme(t) {
  root.dataset.theme = t;
  themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeMeta.setAttribute("content", t === "dark" ? "#0E0B16" : "#F8F6FD");
}
applyTheme(root.dataset.theme === "light" ? "light" : "dark");
themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme-v3", next); } catch (e) { /* storage blocked */ }
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

  const color = () => getComputedStyle(root).getPropertyValue("--a1").trim() || "#8b5cf6";
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
