/* =======================================================
   offer.js – JS für offer.html
   Struktur:
   1) Fade-in der Sektionen
   2) Hero-Feuerwerk (7s) + Mini-Glitter (alle 5s)
   3) Countdown (12h) mit Ziffernblatt + Zeiger
   4) FAQ-Accordion: nur ein <details> offen
   5) QR-Scan-Logging (Worker)
   6) PayPal Checkout (robustes Rendering)
======================================================= */

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

/* 3) Countdown (12h) --------------------------------------*/
(() => {
  const SECS_TOTAL = 12 * 60 * 60;
  const KEY = "tmc_offer_expiry_v2_12h";

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

    const angle = -90 + (1 - p) * 360;
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

/* 5) TMC: QR-Scan Logging mit 20s-Throttle -----------------*/
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
          alert("Die Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
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

// 7) === Sticky CTA steuern: sichtbar, wenn #checkout NICHT im Viewport ===
(function () {
  const bar = document.getElementById("stickyCta");
  const target = document.getElementById("checkout");
  if (!bar || !target) return;

  function setVisible(v) {
    bar.style.display = v ? "flex" : "none";
    bar.setAttribute("aria-hidden", v ? "false" : "true");
  }

  // Wenn IntersectionObserver verfügbar ist: eleganter Modus
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        // ist der Checkout zu >= 20% sichtbar? Dann Sticky ausblenden
        setVisible(!(e && e.isIntersecting && e.intersectionRatio > 0.2));
      },
      { threshold: [0, 0.2, 0.6, 1] }
    );
    io.observe(target);
  } else {
    // Fallback: Scroll-Position (zeigt CTA ab 35% Scrolltiefe)
    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      const ratio = scrolled / max;
      setVisible(ratio > 0.35);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Bei „Zurück“ aus bfcache prüfen
  window.addEventListener("pageshow", () => {
    // sofort neu bewerten (Observer löst evtl. nicht direkt aus)
    const rect = target.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = rect.top < vh * 0.8 && rect.bottom > vh * 0.2;
    setVisible(!visible);
  });
})();
// === Social Proof: "Heute X Codes gefunden" – live, monoton, ohne Reload ===
(function () {
  const STR = document.querySelector(".proof__text strong");
  if (!STR) return;

  // ------- Konfiguration -------
  const BASE_MIN = 12,
    BASE_MAX = 38; // Startwert pro Tag
  const INTERVAL_MS = 60 * 1000; // alle 1 min kleiner Drift
  const INTERVAL_DELTA_MIN = 1,
    INTERVAL_DELTA_MAX = 2;
  const REVISIT_COOLDOWN_MS = 60 * 1000; // min. 1 min zwischen größeren Bumps (Tab-Wechsel/Rückkehr)
  const REVISIT_DELTA_MIN = 3,
    REVISIT_DELTA_MAX = 7;
  const CAP_TODAY = 180; // Obergrenze pro Nutzer+Tag
  const KEY = "tmc:proof:v2"; // neue Version -> sauberes Reset

  // ------- Helpers -------
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const ymd = (t) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };
  const today = ymd(Date.now());

  // Aus Storage laden / neu initialisieren
  let st;
  try {
    st = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    st = null;
  }
  if (!st || st.date !== today) {
    st = { date: today, value: rnd(BASE_MIN, BASE_MAX), lastBump: Date.now() };
  }

  // SAFETY: Falls im DOM (z.B. durch altes Rendern) ein höherer Wert steht, niemals zurückgehen
  const domVal = parseInt((STR.textContent || "").replace(/\D/g, ""), 10);
  if (!Number.isNaN(domVal)) {
    st.value = Math.max(st.value, domVal);
  }

  // Persist & initial render
  function persist() {
    localStorage.setItem(KEY, JSON.stringify(st));
  }
  function renderImmediate() {
    STR.textContent = String(st.value);
  }

  // Sanfte CountUp-Animation (nur nach oben, nie zurück)
  function animateTo(next) {
    next = Math.min(CAP_TODAY, next);
    if (next <= st.value) {
      // nie rückwärts animieren
      st.value = next;
      persist();
      renderImmediate();
      return;
    }
    const start = st.value;
    const diff = next - start;
    const steps = Math.min(12, diff);
    const stepVal = Math.max(1, Math.floor(diff / steps));
    let cur = start;
    STR.classList.add("tmc-proof-pulse");
    const tick = () => {
      cur = Math.min(next, cur + stepVal);
      st.value = cur; // State folgt Anzeige (monoton)
      persist();
      STR.textContent = String(cur);
      if (cur < next) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => STR.classList.remove("tmc-proof-pulse"), 120);
      }
    };
    requestAnimationFrame(tick);
  }

  // Initial anzeigen
  renderImmediate();
  persist();

  // Wiederkehr-Bump (Tab wird aktiv / Back-Forward-Cache)
  function maybeRevisitBump() {
    const now = Date.now();
    if (now - (st.lastBump || 0) >= REVISIT_COOLDOWN_MS && st.value < CAP_TODAY) {
      const add = rnd(REVISIT_DELTA_MIN, REVISIT_DELTA_MAX);
      animateTo(Math.min(CAP_TODAY, st.value + add));
      st.lastBump = Date.now();
      persist();
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") maybeRevisitBump();
  });
  window.addEventListener("pageshow", () => {
    maybeRevisitBump();
  });

  // Drift-Intervall (läuft, solange Seite offen ist)
  let timer;
  function scheduleDrift() {
    clearTimeout(timer);
    const jitter = rnd(-10, 10) * 1000; // +-10s Jitter
    const delay = Math.max(20_000, INTERVAL_MS + jitter);
    timer = setTimeout(() => {
      if (st.value < CAP_TODAY) {
        const add = rnd(INTERVAL_DELTA_MIN, INTERVAL_DELTA_MAX);
        animateTo(Math.min(CAP_TODAY, st.value + add));
        st.lastBump = Date.now();
        persist();
      }
      scheduleDrift();
    }, delay);
  }
  scheduleDrift();

  // Extra-Safety: Nie unter aktuell sichtbaren Wert gehen (falls extern manipuliert)
  new MutationObserver(() => {
    const shown = parseInt((STR.textContent || "").replace(/\D/g, ""), 10);
    if (!Number.isNaN(shown) && shown > st.value) {
      st.value = shown;
      persist();
    } else if (!Number.isNaN(shown) && shown < st.value) {
      // Korrigiere DOM nach oben (sollte nie passieren, aber sicher ist sicher)
      STR.textContent = String(st.value);
    }
  }).observe(STR, { characterData: true, subtree: true, childList: true });
})();
