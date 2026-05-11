(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var drawer = document.querySelector("[data-menu-drawer]");
  var overlay = document.querySelector("[data-menu-overlay]");
  var closeBtn = document.querySelector("[data-menu-close]");

  if (!toggle || !drawer || !overlay) return;

  var mq = window.matchMedia("(max-width: 899px)");

  function isMobile() {
    return mq.matches;
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("drawer-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("menu-toggle--open");
    overlay.setAttribute("aria-hidden", "false");
    var first = drawer.querySelector("a, button");
    if (first) window.setTimeout(function () { first.focus(); }, 50);
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("drawer-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("menu-toggle--open");
    overlay.setAttribute("aria-hidden", "true");
    toggle.focus();
  }

  function toggleDrawer() {
    if (!isMobile()) return;
    if (drawer.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  }

  toggle.addEventListener("click", toggleDrawer);
  overlay.addEventListener("click", closeDrawer);

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  drawer.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (isMobile()) closeDrawer();
    });
  });

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (!isMobile()) closeDrawer();
    });
  }
})();

(function () {
  // Make sure broken external images don't render as broken icons.
  var SVG_FALLBACK =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
        '<defs>' +
        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#0f172a"/>' +
        '<stop offset="1" stop-color="#334155"/>' +
        "</linearGradient>" +
        "</defs>" +
        '<rect width="1200" height="800" fill="url(#g)"/>' +
        '<g fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="10">' +
        '<path d="M140 560c120-120 220-180 320-180s200 60 320 180 220 180 320 180"/>' +
        "</g>" +
        '<text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="44">Image unavailable</text>' +
        '<text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.62)" font-family="Arial, sans-serif" font-size="26">Tap to retry</text>' +
      "</svg>"
    );

  function applyOne(img) {
    if (!img || img.__fallbackBound) return;
    img.__fallbackBound = true;
    // Some CDNs block hotlinking based on referrer.
    try {
      img.referrerPolicy = "no-referrer";
    } catch (e) {}

    img.addEventListener(
      "error",
      function () {
        if (img.__usingFallback) return;
        img.__usingFallback = true;
        img.dataset.originalSrc = img.getAttribute("src") || "";
        img.setAttribute("src", SVG_FALLBACK);
        img.style.objectFit = "cover";
        img.style.filter = "none";
      },
      { once: true }
    );

    img.addEventListener("click", function () {
      var orig = img.dataset.originalSrc;
      if (!orig) return;
      // Retry original on click
      img.__usingFallback = false;
      img.setAttribute("src", orig);
      delete img.dataset.originalSrc;
    });
  }

  function init() {
    document.querySelectorAll("img").forEach(applyOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
