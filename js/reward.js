// js/reward.js
(function () {
  const wrap = document.getElementById("reward");
  const btn = document.getElementById("btnDownload");
  const state = document.getElementById("state");
  const fallback = document.getElementById("fallback");
  const fallbackLink = document.getElementById("fallbackLink");

  const pdfPath = wrap?.dataset?.pdf || "/downloads/tmc-digital.pdf";
  const LOCK_KEY = "tmc:reward:downloaded";

  // Sofortiger Redirect, wenn bereits geladen (Soft-Lock)
  try {
    if (localStorage.getItem(LOCK_KEY)) {
      location.replace("/thankyou.html?from=reward");
      return;
    }
  } catch {}

  function setState(t) {
    if (state) state.textContent = t;
  }
  function showFallback() {
    fallback?.classList.remove("is-hidden");
    if (fallbackLink) fallbackLink.href = pdfPath;
  }

  async function handleDownload() {
    try {
      btn.disabled = true;
      setState("Lade PDF …");

      const res = await fetch(pdfPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      // sehr kleine Größe -> wahrscheinlich HTML-Fehlerseite statt PDF
      if (blob.size < 1024) throw new Error("Blob too small (likely error page)");

      // Download anstoßen (ohne zu navigieren)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfPath.split("/").pop() || "download.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Soft-Lock setzen
      try {
        localStorage.setItem(LOCK_KEY, String(Date.now()));
      } catch {}

      setState("Download gestartet. Weiterleitung …");

      setTimeout(() => {
        location.replace("/thankyou.html?from=reward");
      }, 1200);
    } catch (err) {
      console.error("[reward]", err);
      setState("Der automatische Download konnte nicht gestartet werden.");
      showFallback();
      btn.disabled = false;
    }
  }

  btn?.addEventListener("click", handleDownload);

  // (Optional) „Zurück“-Navigation blocken, falls du es unbedingt willst:
  // history.pushState(null, '', location.href);
  // window.addEventListener('popstate', () => history.go(1));
})();
