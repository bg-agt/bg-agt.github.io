/* BG-AGT website: progressive enhancements. The page works without this file. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------------- Nav ---------------- */
  const nav = $(".nav");
  const toggle = $(".nav__toggle");
  const links = $("#nav-links");

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- Reveal on scroll ---------------- */
  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      revealIO.unobserve(entry.target);
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------------- Metro map ---------------- */
  const metroSvg = $("#metro svg");
  if (metroSvg && reduceMotion && metroSvg.pauseAnimations) metroSvg.pauseAnimations();

  /* ---------------- Tabs ---------------- */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus = false) => {
    for (const t of tabs) {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !selected;
      if (!selected) $$("video", panel).forEach((v) => v.pause());
    }
    if (focus) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });

  /* ---------------- Copy BibTeX ---------------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = $(btn.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Press Ctrl+C";
        const range = document.createRange();
        range.selectNodeContents($(btn.dataset.copy));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setTimeout(() => { btn.textContent = "Copy"; }, 1800);
    });
  });

  /* ---------------- Footer year ---------------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- Hero replay (scripted illustration) ---------------- */
  // Request and final reply only, as the app shows them. Each mirrors behaviour
  // described in the paper.
  const SCENARIOS = [
    {
      user: "Do a pan-genome analysis on isolate_A.fasta and isolate_B.fasta",
      agent: "Done. The pan-genome analysis of isolate_A and isolate_B is complete. The gene presence–absence matrix and summary are in your output files.",
    },
    {
      user: "Call variants in sample_X.fasta",
      agent: "Variant calling needs a reference genome, and none was named. Which file should I use as the reference? You can upload a GBK or FASTA file.",
    },
    {
      user: "Annotate the reads in sampleA_reads.zip",
      agent: "Done. The annotation for sampleA is complete. The GFF, GBK, protein and summary files are ready to download.",
    },
  ];

  const replay = $("#replay");
  const field = $("#replay-input");
  if (!replay || !field) return;
  const send = $(".window__send");
  const hint = field.innerHTML;

  const bubble = (cls, text) => {
    const li = document.createElement("li");
    li.className = `msg ${cls}`;
    if (text) li.textContent = text;
    return li;
  };

  // Reduced motion: show the first exchange statically.
  if (reduceMotion) {
    replay.append(bubble("msg--user", SCENARIOS[0].user), bubble("msg--agent", SCENARIOS[0].agent));
    return;
  }

  // Pause the loop while the window is off-screen or the tab is hidden.
  let onScreen = true;
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }).observe(replay);
  const sleep = (ms) => new Promise((resolve) => {
    let last = performance.now();
    let elapsed = 0;
    const check = (now) => {
      if (onScreen && !document.hidden) elapsed += now - last;
      last = now;
      if (elapsed >= ms) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

  const typeIntoField = async (text) => {
    const caret = document.createElement("span");
    caret.className = "caret";
    field.replaceChildren(caret);
    send.classList.add("is-active");
    for (const ch of text) {
      caret.before(ch);
      await sleep(ch === " " ? 18 : 30);
    }
    await sleep(450);
    field.innerHTML = hint;
    send.classList.remove("is-active");
  };

  const run = async () => {
    for (let i = 0; ; i = (i + 1) % SCENARIOS.length) {
      const { user, agent } = SCENARIOS[i];
      replay.replaceChildren();
      await sleep(600);
      await typeIntoField(user);
      replay.append(bubble("msg--user", user));
      await sleep(500);
      const typing = bubble("msg--typing");
      typing.innerHTML = "<i></i><i></i><i></i>";
      typing.setAttribute("aria-label", "BG-AGT is working");
      replay.append(typing);
      await sleep(1900);
      typing.replaceWith(bubble("msg--agent", agent));
      await sleep(5200);
      replay.style.transition = "opacity .4s";
      replay.style.opacity = "0";
      await sleep(420);
      replay.style.opacity = "1";
    }
  };
  run();
})();
