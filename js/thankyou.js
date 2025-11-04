// js/thankyou.js
// Funktionen:
// 1) Copy-Button für Instagram-Text
// 2) Einmaliges Telegram-/Analytics-Log bei Aufruf der Danke-Seite
//    - src: "thankyou"
//    - code: URL-Param "from"  ("reward" | "form" | ...)
// 3) Sanfte UX-Helfer (optional)

(function () {
  // ---------- 1) Instagram Copy ----------
  const copyBtn = document.getElementById("copy");
  const igTextEl = document.getElementById("igtext");

  async function copyIGText() {
    if (!igTextEl) return;
    const text = igTextEl.value || igTextEl.textContent || "";

    try {
      await navigator.clipboard.writeText(text);
      alert("Text kopiert.");
    } catch {
      // Fallback für ältere Browser/Berechtigungen
      prompt("Manuell kopieren:", text);
    }
  }
  copyBtn?.addEventListener("click", copyIGText);

  // ---------- 2) Telegram-/Analytics-Log (einmalig) ----------
  const WORKER_URL = "https://themysterycode.p-ohrner89.workers.dev/"; // deine Worker-Root
  const SECRET = "9f3c2a7d6e5b41f2c9a1d0e8b3c4d5f6"; // <--- HIER deinen echten Secret einsetzen
  const THX_KEY_PREFIX = "tmc:thankyou:sent:"; // Dedupe-Key

  async function logThankYouOnce() {
    try {
      const p = new URLSearchParams(location.search);
      const from = p.get("from") || "unknown";

      // Dedupe: pro (from) nur einmal je Browser
      const key = THX_KEY_PREFIX + from;
      if (localStorage.getItem(key)) return;

      const payload = {
        src: "thankyou",
        code: from,
        ua: navigator.userAgent
      };

      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tmc-secret": SECRET
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        localStorage.setItem(key, String(Date.now()));
      } else {
        // Bei 401/403/500 speichern wir NICHT, damit ein Reload erneut versucht.
        console.warn("[thankyou] worker response:", res.status);
      }
    } catch (err) {
      console.error("[thankyou] log error", err);
    }
  }

  // Beim Laden der Danke-Seite automatisch loggen
  logThankYouOnce();

  // ---------- 3) Kleine UX-Helfer (optional) ----------
  // Smooth Scrolling für evtl. interne Links mit href="#..."
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
