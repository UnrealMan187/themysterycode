// js/reward.js
// - Startet KEINEN Autodownload. Der Nutzer klickt bewusst.
// - Lädt die PDF per fetch() vollständig in den Speicher (blob).
// - Stößt den lokalen Download an (ohne Browser-Navigation).
// - Leitet erst NACH erfolgreichem Start des Downloads (kleiner Delay) weiter.

(function () {
  const wrap = document.getElementById("reward");
  const btn = document.getElementById("btnDownload");
  const state = document.getElementById("state");
  const fallback = document.getElementById("fallback");
  const fallbackLink = document.getElementById("fallbackLink");

  // Pfad aus HTML-Attribut (wartbar ohne JS-Änderung)
  const pdfPath = wrap?.dataset?.pdf || "/downloads/tmc-digital.pdf";

  function setState(txt) {
    if (state) state.textContent = txt;
  }
  function showFallback() {
    fallback?.classList.remove("is-hidden");
    if (fallbackLink) fallbackLink.href = pdfPath;
  }

  async function handleDownload() {
    try {
      btn.disabled = true;
      setState("Lade PDF …");

      // 1) Datei laden (keine Browser-Navigation)
      const res = await fetch(pdfPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Download fehlgeschlagen (HTTP ${res.status})`);

      // Optionaler Content-Type-Check
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("pdf")) {
        // Schutz: wenn der Server z. B. eine HTML-Fehlerseite liefert,
        // brechen wir ab und zeigen den Fallback-Link.
        throw new Error(`Unerwarteter Inhaltstyp: ${ct}`);
      }

      const blob = await res.blob(); // Datei ist vollständig geladen

      // 2) Lokalen Download anstoßen (ohne Seite zu verlassen)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfPath.split("/").pop() || "download.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setState("Download gestartet. Du wirst gleich weitergeleitet …");

      // 3) Weiterleitung NACH dem Auslösen des Downloads
      setTimeout(() => {
        location.href = "/thankyou.html?from=reward";
      }, 1500);
    } catch (err) {
      console.error("[reward]", err);
      setState("Der automatische Download konnte nicht gestartet werden.");
      showFallback();
    } finally {
      btn.disabled = false;
    }
  }

  btn?.addEventListener("click", handleDownload);
})();
