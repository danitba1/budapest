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
