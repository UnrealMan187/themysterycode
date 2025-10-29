// js/script.js
(() => {
  document.documentElement.classList.add("has-js");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced) {
    document.addEventListener(
      "click",
      (ev) => {
        const a = ev.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute("href").slice(1);
        if (!id) return;
        const el = document.getElementById(id);
        if (el) {
          ev.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", `#${id}`);
        }
      },
      { passive: false }
    );
  }

  document.querySelectorAll("img:not([loading])").forEach((img) => {
    img.loading = "lazy";
    if (img.closest(".qr")) img.loading = "eager";
  });

  const galleryImgs = document.querySelectorAll(".gallery__item img");
  if (galleryImgs.length) {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      galleryImgs.forEach((img) => {
        img.addEventListener(
          "touchstart",
          () => {
            const prevFilter = img.style.filter;
            const prevTransform = img.style.transform;
            const prevOpacity = img.style.opacity;
            img.style.filter = "blur(0) brightness(1)";
            img.style.transform = "scale(1.035)";
            img.style.opacity = "1";
            setTimeout(() => {
              img.style.filter = prevFilter || "";
              img.style.transform = prevTransform || "";
              img.style.opacity = prevOpacity || "";
            }, 1200);
          },
          { passive: true }
        );
      });
    }
  }

  const setVHUnit = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  setVHUnit();
  window.addEventListener("resize", setVHUnit);

  /* === 6) Scroll-Fade-in Animation === */
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in--visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15 // 15 % sichtbar → animieren
    }
  );

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  /* === Finder-Stimmen: Demo-Daten & Render-Funktionen === */
  const FINDER_MEDIA = [
    // Beispiel-Items – ersetze die Pfade durch deine eigenen
    {
      type: "video",
      src: "media/finder1.mp4",
      poster: "image/img/reise.png",
      caption: "Erster Scan – pure Gänsehaut."
    },
    {
      type: "image",
      src: "image/locations/ffm7.png",
      caption: "“Hätte nicht gedacht, dass das echt ist.”"
    },
    {
      type: "image",
      src: "image/locations/berlin1.png",
      caption: "Mehr als gedacht, aber genau richtig."
    },
    {
      type: "video",
      src: "media/finder2.mp4",
      poster: "image/img/kochbuch.png",
      caption: "Ein Moment, den man nicht plant."
    }
  ];

  const FINDER_COMMENTS = [
    {
      name: "Lena",
      handle: "@len4",
      text: "Hab den Code zufällig in der Stadt gesehen. Gescannt. Gelächelt. Reicht."
    },
    { name: "Mo", handle: "@m0", text: "Nicht groß, aber echt. Genau das hat mir gefällt." },
    {
      name: "Iris",
      handle: "@iris_ka",
      text: "Dachte erst: Marketing. War’s nicht. Angenehm ehrlich."
    },
    {
      name: "Ben",
      handle: "@bn",
      text: "Dieser Moment, bevor man weiß, was kommt – macht süchtig."
    }
  ];

  // Hilfsfunktion: Initialen aus Namen
  const initials = (name) =>
    name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  function renderFinderMedia(list) {
    const mount = document.getElementById("testimonials-media");
    if (!mount) return;

    mount.innerHTML = "";
    list.forEach((item) => {
      const card = document.createElement("figure");
      card.className = "t-media";

      if (item.type === "video") {
        const v = document.createElement("video");
        v.className = "t-media__frame";
        v.controls = true;
        v.playsInline = true;
        v.muted = true;
        if (item.poster) v.poster = item.poster;
        const source = document.createElement("source");
        source.src = item.src;
        source.type = "video/mp4";
        v.appendChild(source);
        card.appendChild(v);
      } else {
        const img = document.createElement("img");
        img.className = "t-media__frame";
        img.src = item.src;
        img.alt = item.caption || "Finder-Moment";
        img.loading = "lazy";
        card.appendChild(img);
      }

      if (item.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "t-media__caption";
        cap.textContent = item.caption;
        card.appendChild(cap);
      }

      mount.appendChild(card);
    });
  }

  function renderFinderComments(list) {
    const mount = document.getElementById("testimonials-feed");
    if (!mount) return;

    mount.innerHTML = "";
    list.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "feed-item";

      const av = document.createElement("div");
      av.className = "feed-avatar";
      av.textContent = initials(entry.name);

      const body = document.createElement("div");
      body.className = "feed-body";

      const meta = document.createElement("div");
      meta.className = "feed-meta";

      const name = document.createElement("span");
      name.className = "feed-name";
      name.textContent = entry.name;

      const handle = document.createElement("span");
      handle.className = "feed-handle";
      handle.textContent = entry.handle;

      const text = document.createElement("div");
      text.className = "feed-text";
      text.textContent = entry.text;

      meta.appendChild(name);
      meta.appendChild(handle);
      body.appendChild(meta);
      body.appendChild(text);

      li.appendChild(av);
      li.appendChild(body);
      mount.appendChild(li);
    });
  }

  // Beim DOM-Ready rendern
  document.addEventListener("DOMContentLoaded", () => {
    renderFinderMedia(FINDER_MEDIA);
    renderFinderComments(FINDER_COMMENTS);
  });

  // Shimmer nur aktivieren, wenn Cards sichtbar sind
  (() => {
    const cards = document.querySelectorAll("#testimonials .card");
    if (!cards.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-shimmering");
          } else if (!prefersReduced) {
            e.target.classList.remove("is-shimmering");
          }
        });
      },
      { threshold: 0.2 }
    );

    cards.forEach((c) => obs.observe(c));
  })();
})();

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
