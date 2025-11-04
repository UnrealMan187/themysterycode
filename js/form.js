const form = document.getElementById("addressForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // verhindert Standard-Redirect und Seitenreload
  const data = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    });

    if (res.ok) {
      // Danke-Seite mit Herkunftsmarker (fürs Analytics/Telegram-Log)
      window.location.href = "https://themysterycode.de/thankyou.html?from=form";
    } else {
      const err = await res.json().catch(() => null);
      const msg =
        err && err.errors
          ? err.errors.map((e) => e.message).join("\n")
          : "Uups – das Absenden ist fehlgeschlagen.";
      alert(msg);
    }
  } catch (error) {
    alert("Netzwerkfehler. Bitte später erneut versuchen.");
  }
});
