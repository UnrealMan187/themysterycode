/* =======================================================
   offer.js – JS für offer.html
   Struktur:
   0) Smooth-Scroll für interne Anker
   0b) Hero-Intro (sanftes Einblenden, ohne extra CSS)
   0c) Micro-Interaktionen für Steps
   1) Fade-in der Sektionen
   2) Hero-Feuerwerk (7s) + Mini-Glitter (alle 5s)
   3) Countdown (12h) mit Ziffernblatt + Zeiger
   4) FAQ-Accordion: nur ein <details> offen
   5) QR-Scan-Logging (Worker)
   6) PayPal Checkout (robustes Rendering)
   7) Sticky CTA visibility
   8) Social Proof (live, monoton, random Interval)
======================================================= */

/* 0) Smooth-Scroll für interne Anker ----------------------*/
(() => {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();

/* 0b) Hero-Intro (sanftes Einblenden) --------------------*/
(() => {
  const title = document.querySelector(".celebrate__title");
  const sub = document.querySelector(".hero__subtitle");
  const trust = document.querySelector(".trustline--inline");
  [title, sub, trust].forEach((el, i) => {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "opacity .6s ease, transform .6s ease";
    // zweites RAF, damit die Startwerte sicher gesetzt sind
    requestAnimationFrame(() =>
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 80 + i * 90)
    );
  });
})();

/* 0c) Micro-Interaktionen für Steps ----------------------*/
(() => {
  const steps = document.querySelectorAll(".step");
  steps.forEach((s) => {
    s.style.transition = "box-shadow .25s ease, transform .25s ease";
    s.addEventListener("mouseenter", () => {
      s.style.boxShadow = "0 10px 24px rgba(0,0,0,.32)";
      s.style.transform = "translateY(-1px)";
    });
    s.addEventListener("mouseleave", () => {
      s.style.boxShadow = "";
      s.style.transform = "translateY(0)";
    });
  });
})();

/* 1) Fade-in der Sektionen --------------------------------*/
(() => {
  const els = document.querySelectorAll(".fade-in");
  if (!els.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("fade-in--visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => obs.observe(el));
})();

/* 2) Hero-Feuerwerk ---------------------------------------*/
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.querySelector(".fx-canvas");
  if (!canvas || prefersReduced) return;

  const ctx = canvas.getContext("2d");
  let W,
    H,
    particles = [],
    rockets = [],
    running = false,
    startTime = 0;
  const COLORS = ["#D4AF37", "#F3E2A3", "#B8860B", "#ffffff"];

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width = parent.clientWidth;
    H = canvas.height = parent.clientHeight;
  }
  new ResizeObserver(resize).observe(canvas.parentElement);

  const rand = (min, max) => Math.random() * (max - min) + min;

  function burst(x, y, amount = 120, power = 9) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(power * 0.4, power);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        g: 0.18,
        life: rand(60, 120),
        size: rand(2, 4),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rotation: rand(0, Math.PI * 2),
        vr: rand(-0.2, 0.2)
      });
    }
  }

  function spawnRocket() {
    rockets.push({
      x: rand(W * 0.25, W * 0.75),
      y: H + 10,
      vx: rand(-0.7, 0.7),
      vy: rand(-7.5, -9.5),
      life: rand(40, 60),
      color: COLORS[(Math.random() * COLORS.length) | 0]
    });
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.08;
      r.life--;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + 8);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      if (r.life <= 0 || r.vy > -2) {
        burst(r.x, r.y, 90, 8.5);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rotation += p.vr;
      p.life--;
      p.vx *= 0.992;
      p.vy *= 0.992;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      ctx.restore();
      if (p.y > H - 2) {
        p.vy *= -0.2;
        p.vx *= 0.8;
        p.y = H - 2;
        p.life -= 3;
      }
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (performance.now() - startTime > 7000 && !particles.length && !rockets.length) {
      running = false;
    } else {
      requestAnimationFrame(step);
    }
  }

  function celebrate(full = true) {
    resize();
    if (full) {
      burst(W * 0.5, H * 0.35, 150, 10);
      burst(W * 0.25, H * 0.42, 110, 8.5);
      burst(W * 0.75, H * 0.42, 110, 8.5);
      for (let i = 0; i < 4; i++) spawnRocket();
    } else {
      burst(rand(W * 0.3, W * 0.7), rand(H * 0.3, H * 0.5), 40, 5);
    }
    startTime = performance.now();
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  }

  const hero = document.querySelector(".hero");
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          celebrate(true);
          heroObserver.disconnect();
          setInterval(() => celebrate(false), 6000);
        }
      });
    },
    { threshold: 0.6 }
  );
  if (hero) heroObserver.observe(hero);
})();

/* 3) Countdown (6h) --------------------------------------*/
(() => {
  const SECS_TOTAL = 6 * 60 * 60;
  const KEY = "tmc_offer_expiry_v2_6h";

  const dial = document.querySelector(".dial");
  const progress = dial?.querySelector(".dial__progress");
  const minorGroup = dial?.querySelector(".ticks--minor");
  const needle = document.getElementById("tmc-needle");
  const label = document.querySelector(".readout__label");
  const sub = document.querySelector(".readout__sub");
  if (!dial || !progress || !minorGroup || !needle) return;

  (function addMinorTicks() {
    const center = 80,
      rInner = 64;
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const ang = (i / 60) * Math.PI * 2;
      const x1 = center + Math.sin(ang) * rInner;
      const y1 = center - Math.cos(ang) * rInner;
      const x2 = center + Math.sin(ang) * (rInner + 4.5);
      const y2 = center - Math.cos(ang) * (rInner + 4.5);
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", x1.toFixed(2));
      ln.setAttribute("y1", y1.toFixed(2));
      ln.setAttribute("x2", x2.toFixed(2));
      ln.setAttribute("y2", y2.toFixed(2));
      minorGroup.appendChild(ln);
    }
  })();

  const CIRC = Math.PI * 2 * 62;
  progress.style.strokeDasharray = String(CIRC);

  const now = Date.now();
  let expiry = parseInt(localStorage.getItem(KEY), 10);
  if (isNaN(expiry) || expiry < now) {
    expiry = now + SECS_TOTAL * 1000;
    localStorage.setItem(KEY, String(expiry));
  }

  function update() {
    const nowMs = Date.now();
    let remain = Math.max(0, Math.floor((expiry - nowMs) / 1000));
    const p = remain / SECS_TOTAL;
    progress.style.strokeDashoffset = String(CIRC * (1 - p));

    const digits = document.getElementById("tmc-digits");
    if (digits) {
      const h = Math.floor(remain / 3600);
      const m = Math.floor((remain % 3600) / 60);
      const s = Math.floor(remain % 60);
      digits.textContent = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    const angle = 0 - (1 - p) * 360;
    needle.setAttribute("transform", `rotate(${angle} 80 80)`);

    if (remain <= 0) {
      if (label) label.textContent = "Der Code ist erloschen.";
      if (sub) sub.textContent = "Vielleicht findet dich der nächste.";
      return;
    }
    setTimeout(update, 1000);
  }
  update();
})();

/* 4) FAQ: immer nur eins offen ----------------------------*/
(() => {
  const faq = document.querySelector(".faq");
  if (!faq) return;
  faq.addEventListener(
    "toggle",
    (e) => {
      const opened = e.target;
      if (opened.tagName.toLowerCase() !== "details" || !opened.open) return;
      faq.querySelectorAll("details[open]").forEach((d) => {
        if (d !== opened) d.open = false;
      });
    },
    true
  );
})();

/* 5) TMC: QR-Scan Logging mit Throttle --------------------*/
(() => {
  try {
    const p = new URLSearchParams(location.search);
    const src = p.get("src") || "direct";
    const code = p.get("code") || "unknown";
    if (!(src === "qr" && code !== "unknown")) return;

    const KEY = `tmc:last:${src}:${code}`;
    const now = Date.now();
    const last = Number(localStorage.getItem(KEY) || 0);
    const THROTTLE = 20 * 1000;
    if (now - last < THROTTLE) return;

    fetch("https://themysterycode.p-ohrner89.workers.dev/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tmc-secret": "9f3c2a7d6e5b41f2c9a1d0e8b3c4d5f6"
      },
      body: JSON.stringify({ src, code, ua: navigator.userAgent })
    })
      .then(() => localStorage.setItem(KEY, String(now)))
      .catch(() => {});
  } catch (e) {}
})();

/* 6) PayPal Checkout – Zufallsprinzip + robustes Rendering */
(function () {
  let rendering = false;

  // Optionaler Override für interne Tests (?item=digital|physical)
  const urlItem = (new URLSearchParams(location.search).get("item") || "").toLowerCase();

  function decideItem() {
    if (urlItem === "digital" || urlItem === "physical") return urlItem;
    return Math.random() < 0.5 ? "digital" : "physical";
  }

  function afterPurchase(item) {
    if (item === "digital") return "/reward.html?from=paypal&mode=random";
    if (item === "physical") return "/form.html?from=paypal&mode=random";
    return "/thankyou.html?from=paypal";
  }

  function renderButtons() {
    const box = document.getElementById("paypal-button-container");
    if (!window.paypal || !box || rendering) return;
    rendering = true;
    box.innerHTML = "";

    // WICHTIG: Item vor createOrder bestimmen, damit Text konsistent ist
    const pickedAtRender = decideItem();

    paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "pay", tagline: false },

        createOrder: (data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                description: `The Mystery Code – Zufalls-Reward (${
                  pickedAtRender === "digital" ? "Digital" : "Physisch"
                })`,
                amount: { value: "10.00", currency_code: "EUR" }
              }
            ],
            // Adresse holen wir bei "physisch" später in /form.html – PayPal-Dialog bleibt clean
            application_context: { shipping_preference: "NO_SHIPPING" }
          }),

        onApprove: async (data, actions) => {
          // zweite Entscheidung, falls Session/Back-Nav inkonsistent war
          const picked = pickedAtRender || decideItem();
          await actions.order.capture();
          location.href = afterPurchase(picked);
        },

        onError: (err) => {
          console.error("PayPal error:", err);
          if (window.tmcShowToast) {
            window.tmcShowToast(
              "Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
              "warn"
            );
          } else {
            alert("Die Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
          }
        }
      })
      .render("#paypal-button-container")
      .finally(() => {
        rendering = false;
      });
  }

  // vom SDK onload getriggert (siehe offer.html)
  window.initPayPal = function () {
    renderButtons();
  };

  // Zurück-Navigation & Tab-Wechsel → neu rendern
  window.addEventListener("pageshow", (e) => {
    const isBack =
      e.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward";
    if (isBack) renderButtons();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") renderButtons();
  });

  // Falls SDK schon da (Cache), direkt rendern
  if (window.paypal) renderButtons();
})();

/* 7) Sticky CTA steuern: sichtbar, wenn #checkout NICHT im Viewport */
(() => {
  const bar = document.getElementById("stickyCta");
  const target = document.getElementById("checkout");
  if (!bar || !target) return;

  function setVisible(v) {
    bar.style.display = v ? "flex" : "none";
    bar.setAttribute("aria-hidden", v ? "false" : "true");
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setVisible(!(e && e.isIntersecting && e.intersectionRatio > 0.2));
      },
      { threshold: [0, 0.2, 0.6, 1] }
    );
    io.observe(target);
  } else {
    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      const ratio = scrolled / max;
      setVisible(ratio > 0.35);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  window.addEventListener("pageshow", () => {
    const rect = target.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = rect.top < vh * 0.8 && rect.bottom > vh * 0.2;
    setVisible(!visible);
  });
})();

/* 8) Social Proof: "Heute X Codes gefunden" – live, monoton, random Interval */
(() => {
  const STR = document.querySelector(".proof__text strong");
  if (!STR) return;

  // ------- Konfiguration -------
  const BASE_MIN = 12,
    BASE_MAX = 38; // Startwert pro Tag
  const INTERVAL_DELTA_MIN = 1,
    INTERVAL_DELTA_MAX = 8; // kleiner Drift
  const REVISIT_COOLDOWN_MS = 60 * 1000; // min. 1 min zwischen Revisit-Bumps
  const REVISIT_DELTA_MIN = 3,
    REVISIT_DELTA_MAX = 7;
  const CAP_TODAY = 264; // Obergrenze pro Nutzer+Tag
  const KEY = "tmc:proof:v2"; // Versioniert

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const ymd = (t) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };
  const today = ymd(Date.now());

  // Laden / init
  let st;
  try {
    st = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    st = null;
  }
  if (!st || st.date !== today) {
    st = { date: today, value: rnd(BASE_MIN, BASE_MAX), lastBump: Date.now() };
  }

  // Niemals rückwärts (DOM > State)
  const domVal = parseInt((STR.textContent || "").replace(/\D/g, ""), 10);
  if (!Number.isNaN(domVal)) st.value = Math.max(st.value, domVal);

  const persist = () => localStorage.setItem(KEY, JSON.stringify(st));
  const renderImmediate = () => (STR.textContent = String(st.value));

  function animateTo(next) {
    next = Math.min(CAP_TODAY, next);
    if (next <= st.value) {
      st.value = next;
      persist();
      renderImmediate();
      return;
    }
    const start = st.value,
      diff = next - start;
    const steps = Math.min(12, diff),
      stepVal = Math.max(1, Math.floor(diff / steps));
    let cur = start;
    STR.classList.add("tmc-proof-pulse");
    const tick = () => {
      cur = Math.min(next, cur + stepVal);
      st.value = cur;
      persist();
      STR.textContent = String(cur);
      if (cur < next) requestAnimationFrame(tick);
      else setTimeout(() => STR.classList.remove("tmc-proof-pulse"), 120);
    };
    requestAnimationFrame(tick);
  }

  renderImmediate();
  persist();

  function bumpOnceRandom(minAdd, maxAdd) {
    if (st.value >= CAP_TODAY) return false;
    const add = rnd(minAdd, maxAdd);
    animateTo(Math.min(CAP_TODAY, st.value + add));
    st.lastBump = Date.now();
    persist();
    return true;
  }

  // Zufälliger Intervall mit 60s-Garantie
  const MIN_INTERVAL_MS = 18 * 1000;
  const MAX_INTERVAL_MS = 60 * 1000;
  let driftTimer = null,
    watchdogTimer = null;

  function clearTimers() {
    if (driftTimer) clearTimeout(driftTimer);
    if (watchdogTimer) clearTimeout(watchdogTimer);
    driftTimer = watchdogTimer = null;
  }
  function scheduleNextDrift() {
    clearTimers();
    const delay = rnd(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
    driftTimer = setTimeout(() => {
      bumpOnceRandom(INTERVAL_DELTA_MIN, INTERVAL_DELTA_MAX);
      scheduleNextDrift();
    }, delay);
    watchdogTimer = setTimeout(() => {
      bumpOnceRandom(INTERVAL_DELTA_MIN, INTERVAL_DELTA_MAX);
      scheduleNextDrift();
    }, MAX_INTERVAL_MS + 200);
  }
  scheduleNextDrift();

  // Revisit-Bumps
  function maybeRevisitBump() {
    const now = Date.now();
    if (now - (st.lastBump || 0) >= REVISIT_COOLDOWN_MS) {
      bumpOnceRandom(REVISIT_DELTA_MIN, REVISIT_DELTA_MAX);
      scheduleNextDrift();
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") maybeRevisitBump();
  });
  window.addEventListener("pageshow", () => {
    maybeRevisitBump();
  });

  // Extra-Safety (nie unter angezeigten Wert)
  new MutationObserver(() => {
    const shown = parseInt((STR.textContent || "").replace(/\D/g, ""), 10);
    if (!Number.isNaN(shown) && shown > st.value) {
      st.value = shown;
      persist();
    } else if (!Number.isNaN(shown) && shown < st.value) {
      STR.textContent = String(st.value);
    }
  }).observe(STR, { characterData: true, subtree: true, childList: true });
})();
/* === Tiny Toast (unten, dezent) ========================= */
window.tmcShowToast = (function () {
  let wrap, timer;
  const make = () => {
    wrap = document.createElement("div");
    wrap.className = "tmc-toast";
    document.body.appendChild(wrap);
  };
  return function tmcShowToast(msg, type = "info", ms = 3200) {
    if (!wrap) make();
    wrap.textContent = msg;
    wrap.setAttribute("data-type", type);
    wrap.classList.add("tmc-toast--show");
    clearTimeout(timer);
    timer = setTimeout(() => wrap.classList.remove("tmc-toast--show"), ms);
  };
})();
/* === Auto-Reveal: sanft zum Checkout scrollen (nur 1×) === */
(() => {
  const KEY = "tmc:checkout:auto:v1";
  if (localStorage.getItem(KEY) === "done") return;

  const checkout = document.getElementById("checkout");
  if (!checkout) return;

  let done = false;
  const onScroll = () => {
    if (done) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight || 1;
    const ratio = y / max; // 0..1
    if (ratio >= 0.45) {
      done = true;
      localStorage.setItem(KEY, "done");
      checkout.scrollIntoView({ behavior: "smooth", block: "start" });
      window.removeEventListener("scroll", onScroll);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
})();
// === Kauf-Cooldown: 30s wirklich blockieren (Form + PayPal + Clicks + Enter) ===
(() => {
  const COOLDOWN_MS = 30 * 1000; // 30 Sekunden

  const ppBox = document.getElementById("paypal-button-container");
  const form = document.querySelector(".tmc-pp-form");
  const btn = form?.querySelector('button[type="submit"]');

  // minimalistisches Overlay (nur über PayPal-Buttons)
  let blocker = null;
  function ensureBlocker() {
    if (blocker || !ppBox) return;
    blocker = document.createElement("div");
    blocker.className = "tmc-blocker";
    blocker.setAttribute("aria-hidden", "true");
    blocker.style.cssText = `
      position:absolute; inset:0; display:none; z-index:5;
      background: transparent; /* klicks abfangen, ohne Optik zu verändern */
    `;
    // ppBox ist meist position:static → Wrapper für pos:relative
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    ppBox.parentNode.insertBefore(wrap, ppBox);
    wrap.appendChild(ppBox);
    wrap.appendChild(blocker);
  }

  function inCooldown() {
    const used = sessionStorage.getItem("tmc:after:used") === "1";
    const usedAt = Number(sessionStorage.getItem("tmc:after:used_at") || 0);
    if (!used || !usedAt) return 0;
    return Math.max(0, COOLDOWN_MS - (Date.now() - usedAt));
  }

  function applyDisabled(disabled) {
    // Formular-Button: echtes Disable + Optik + ARIA
    if (btn) {
      btn.disabled = !!disabled;
      btn.classList.toggle("btn--disabled", !!disabled);
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
    }
    // PayPal-Container: Pointer-Events tot
    if (ppBox) {
      ppBox.style.pointerEvents = disabled ? "none" : "auto";
      ppBox.style.opacity = disabled ? "0.55" : "1";
    }
    // Optionales Overlay aktivieren
    if (blocker) blocker.style.display = disabled ? "block" : "none";
  }

  function startCooldownUI(remainMs) {
    applyDisabled(true);
    ensureBlocker();
    const toSec = (ms) => Math.ceil(ms / 1000);
    window.tmcShowToast?.(`Bitte einen Moment warten… (~${toSec(remainMs)}s)`, "info");

    const tick = setInterval(() => {
      const left = inCooldown();
      if (left <= 0) {
        clearInterval(tick);
        // Cooldown vorbei → Flags aufräumen & wieder freigeben
        sessionStorage.removeItem("tmc:after:used");
        sessionStorage.removeItem("tmc:after:used_at");
        applyDisabled(false);
        window.tmcShowToast?.("Bereit – du kannst erneut entsperren.", "info");
      }
    }, 500);
  }

  // --- Harte Guards --------------------------------------------------------

  // 1) Submit hart verhindern (auch Enter)
  if (form) {
    form.addEventListener(
      "submit",
      (e) => {
        const left = inCooldown();
        if (left > 0) {
          e.preventDefault();
          e.stopPropagation();
          window.tmcShowToast?.(`Bitte warte kurz… (~${Math.ceil(left / 1000)}s)`, "info");
        }
      },
      true
    ); // capturing → fängt alles ab, bevor etwas anderes greift

    // 1b) Enter-Key innerhalb der Form blocken
    form.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          const left = inCooldown();
          if (left > 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      },
      true
    );
  }

  // 2) Clicks innerhalb PayPal-Container & CTA-Form generell blocken (capturing)
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      const left = inCooldown();
      if (left <= 0) return;

      // trifft auf alles innerhalb des PayPal-Containers zu
      if (ppBox && ppBox.contains(t)) {
        e.preventDefault();
        e.stopPropagation();
        window.tmcShowToast?.(`Bitte warte kurz… (~${Math.ceil(left / 1000)}s)`, "info");
        return;
      }
      // trifft auf den CTA-Button/alles in der Form
      if (form && form.contains(t)) {
        e.preventDefault();
        e.stopPropagation();
        window.tmcShowToast?.(`Bitte warte kurz… (~${Math.ceil(left / 1000)}s)`, "info");
      }
    },
    true
  );

  // --- Initialer Zustand beim Laden ---------------------------------------
  const leftInit = inCooldown();
  if (leftInit > 0) startCooldownUI(leftInit);
  else applyDisabled(false);
})();

// --------------------------------------------------------------
// PAYPAL CHECKOUT (SANDBOX)
// --------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const paypalContainer = document.getElementById("paypal-button-container");
  if (!paypalContainer) return;

  paypal
    .Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [
            {
              amount: { value: "10.00", currency_code: "EUR" },
              description: "Digital Mystery Box – E-Book"
            }
          ]
        });
      },
      onApprove: function (data, actions) {
        // Nach erfolgreicher Zahlung weiterleiten zum Claim-Worker
        const claimUrl = `https://claim.themysterycode.de/paypal-claim?order_id=${data.orderID}`;
        window.location.href = claimUrl;
      },
      onError: function (err) {
        console.error("[PayPal]", err);
        alert("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
      }
    })
    .render("#paypal-button-container");
});
