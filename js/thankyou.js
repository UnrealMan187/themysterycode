// js/thankyou.js
// 1) Copy-Button für Instagram-Text
// 2) Einmaliges Telegram-/Analytics-Log bei Aufruf der Danke-Seite
// 3) Smooth-Scroll (optional)

(function () {
  // ---------- Copy IG Text ----------
  const copyBtn = document.getElementById("copy");
  const igTextEl = document.getElementById("igtext");

  async function copyIGText() {
    if (!igTextEl) return;
    const text = igTextEl.value || igTextEl.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      alert("Text kopiert.");
    } catch {
      prompt("Manuell kopieren:", text);
    }
  }
  copyBtn?.addEventListener("click", copyIGText);

  // ---------- Telegram-/Analytics-Log ----------
  const WORKER_URL = "https://themysterycode.p-ohrner89.workers.dev/";
  const SECRET = "D9f3c2a7d6e5b41f2c9a1d0e8b3c4d5f6";
  const THX_KEY_PREFIX = "tmc:thankyou:sent:";

  async function logThankYouOnce() {
    try {
      const p = new URLSearchParams(location.search);
      const from = p.get("from") || "unknown";

      // pro (from) nur 1x
      const key = THX_KEY_PREFIX + from;
      if (localStorage.getItem(key)) return;

      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tmc-secret": SECRET
        },
        body: JSON.stringify({
          src: "thankyou",
          code: from,
          ua: navigator.userAgent
        })
      });

      if (res.ok) {
        localStorage.setItem(key, String(Date.now()));
      } else {
        console.warn("[thankyou] worker response:", res.status);
      }
    } catch (err) {
      console.error("[thankyou] log error", err);
    }
  }

  logThankYouOnce();

  // ---------- Smooth Scroll (optional) ----------
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();
