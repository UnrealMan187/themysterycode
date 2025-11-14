// js/thankyou.js
(function () {
  // ---------- Copy IG Text (Basis) ----------
  const copyBtn = document.getElementById("copy");
  const igTextEl = document.getElementById("igtext");

  // ---------- Telegram-/Analytics-Log ----------
  const WORKER_URL = "https://themysterycode.p-ohrner89.workers.dev/";
  const SECRET = "9f3c2a7d6e5b41f2c9a1d0e8b3c4d5f6";
  const THX_KEY_PREFIX = "tmc:thankyou:sent:";
  const PROD_ORIGIN = "https://themysterycode.de";

  async function logThankYouOnce() {
    // Nur im Live-Betrieb loggen – lokal NICHT
    if (location.origin !== PROD_ORIGIN) {
      return;
    }

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

  // ---------- Komfortable Copy-Logik für <pre> ----------
  (function () {
    const el = document.getElementById("igtext"); // <pre id="igtext">
    const btn = document.getElementById("copy");
    if (!el || !btn) return;

    async function copyText() {
      const text = el.textContent.trim();

      // Moderner Weg
      try {
        await navigator.clipboard.writeText(text);
        pulse();
        return;
      } catch (e) {
        // Fallback (ältere Browser / Safari)
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try {
          document.execCommand("copy");
        } catch (_) {}
        sel.removeAllRanges();
        pulse();
      }
    }

    function pulse(message = "Text kopiert") {
      const toast = document.getElementById("tmcToast");
      if (!toast) return;

      toast.textContent = message;
      toast.classList.add("show");

      // nach 1.8s ausblenden
      setTimeout(() => {
        toast.classList.remove("show");
      }, 1800);
    }

    btn.addEventListener("click", copyText);

    // Optional: Klick auf den Text selbst markiert alles
    el.addEventListener("click", () => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  })();
})();
