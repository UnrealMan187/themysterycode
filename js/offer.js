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
          setInterval(() => celebrate(false), 5000);
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

/* 6) PayPal Checkout – robustes Rendering ------------------*/
(function () {
  let rendering = false;

  function resolveAfterPurchase() {
    const params = new URLSearchParams(location.search);
    const item = (params.get("item") || "").toLowerCase();
    if (item === "digital") return "/reward.html?from=paypal";
    if (item === "physical") return "/form.html?from=paypal";
    return "/thankyou.html?from=paypal";
  }

  function renderButtons() {
    const box = document.getElementById("paypal-button-container");
    if (!window.paypal || !box || rendering) return;
    rendering = true;
    box.innerHTML = "";

    paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "pay", tagline: false },
        createOrder: (data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                description: "The Mystery Code – Zugang",
                amount: { value: "10.00", currency_code: "EUR" }
              }
            ]
          }),
        onApprove: async (data, actions) => {
          await actions.order.capture();
          location.href = resolveAfterPurchase();
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

  // „Zurück“-Navigation & Tab-Wechsel
  window.addEventListener("pageshow", (e) => {
    const isBack =
      e.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward";
    if (isBack) renderButtons();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") renderButtons();
  });

  // Falls SDK schon vorher geladen war
  if (window.paypal) renderButtons();
})();
