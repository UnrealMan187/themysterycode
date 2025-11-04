// js/reward.js
// Klick → fetch→blob→Download → Redirect
// Soft-Lock: pro Browser/Device nur 1x (lokal). Für harte Limits bräuchten wir später einen Worker mit Einmal-Token.

(function () {
  const wrap = document.getElementById("reward");
  const btn = document.getElementById("btnDownload");
  const state = document.getElementById("state");
  const fallback = document.getElementById("fallback");
  const fallbackLink = document.getElementById("fallbackLink");

  // PDF-Pfad aus HTML
  const pdfPath = wrap?.dataset?.pdf || "/downloads/tmc-digital.pdf";

  // Soft-Lock-Key
  const LOCK_KEY = "tmc:reward:downloaded";

  // Wer schon geladen hat, kommt nicht mehr auf reward.html
  try {
    if (localStorage.getItem(LOCK_KEY)) {
      location.replace("/thankyou.html?from=reward"); // ersetzt History -> back bringt dich NICHT zurück
      return;
    }
  } catch {}

  function setState(txt) {
    if (state) state.textContent = txt;
  }
  function showFallback() {
    fallback?.classList.remove("is-hidden");
    if (fallbackLink) fallbackLink.href = pdfPath;
  }

  async function handleDownload() {
    try {
      // Doppel-Klicks verhindern
      btn.disabled = true;

      setState("Lade PDF …");

      // Datei laden – live testen: https://themysterycode.de/downloads/tmc-digital.pdf
      const res = await fetch(pdfPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Download fehlgeschlagen (HTTP ${res.status})`);

      // Manche lokalen Server setzen falschen Content-Type.
      // Statt strikt auf "application/pdf" zu bestehen, prüfen wir grob die Größe.
      const blob = await res.blob();
      if (blob.size < 1024) {
        // 48 Byte = HTML-Fehlerseite o.ä. → Fallback anzeigen
        throw new Error("Datei zu klein – vermutlich Fehlerseite statt PDF");
      }

      // Lokalen Download anstoßen (ohne Navigieren)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfPath.split("/").pop() || "download.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Soft-Lock setzen: ab jetzt ist der Download als „erledigt“ markiert
      try {
        localStorage.setItem(LOCK_KEY, String(Date.now()));
      } catch {}

      setState("Download gestartet. Du wirst gleich weitergeleitet …");

      // Redirect erst nach dem Anstoßen des Downloads
      setTimeout(() => {
        // replace statt assign → Back bringt dich nicht zurück auf reward.html
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
})();
