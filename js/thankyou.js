// Smooth-Scroll ohne Hash in der URL
(function () {
  // 1) Interne Anker-Klicks abfangen
  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const targetId = a.getAttribute("href").slice(1);
    const el = document.getElementById(targetId);
    if (!el) return;

    e.preventDefault(); // verhindert Hash in der URL
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // 2) URL sofort wieder „hash-frei“ halten
    // (falls du an anderer Stelle den Hash setzt)
    history.replaceState(null, "", location.pathname + location.search);
  });

  // 3) Falls die Seite mit Hash geladen wurde (z. B. durch externen Link):
  if (location.hash) {
    // optional: erst rendern lassen, dann nach oben
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      history.replaceState(null, "", location.pathname + location.search);
    });
  }

  // 4) Keine automatische Scroll-Wiederherstellung vom Browser
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
})();

(async () => {
  try {
    const p = new URLSearchParams(location.search);
    const from = p.get("from") || "unknown";
    await fetch("https://themysterycode.p-ohrner89.workers.dev/", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tmc-secret": "DEIN_TMC_INGEST_SECRET" },
      body: JSON.stringify({ src: "thankyou", code: from, ua: navigator.userAgent })
    });
  } catch {}
})();

document.getElementById("copy").addEventListener("click", async () => {
  const v = document.getElementById("igtext").value;
  try {
    await navigator.clipboard.writeText(v);
    alert("Text kopiert.");
  } catch {
    prompt("Manuell kopieren:", v);
  }
});
