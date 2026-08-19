(function () {
  const tabs = document.querySelectorAll("[data-way-tab]");
  const panels = document.querySelectorAll("[data-way-panel]");
  if (!tabs.length) return;

  function activate(tab) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.wayTab === tab));
    panels.forEach((p) => p.classList.toggle("is-hidden", p.dataset.wayPanel !== tab));
  }

  tabs.forEach((t) => {
    t.addEventListener("click", (e) => {
      e.preventDefault();
      activate(t.dataset.wayTab);
      history.replaceState(null, "", "#" + t.dataset.wayTab);
    });
  });

  activate(location.hash === "#forum" ? "forum" : "exhibition");
})();

(function () {
  const STORAGE_KEY = "cytypeLang";
  const buttons = document.querySelectorAll("[data-lang-btn]");
  if (!buttons.length) return;

  function applyLang(lang) {
    document.documentElement.classList.toggle("lang-zh", lang === "zh");
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.langBtn === lang);
    });
  }

  applyLang(localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "en");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.langBtn;
      localStorage.setItem(STORAGE_KEY, lang);
      applyLang(lang);
    });
  });
})();

document.querySelectorAll(".project-rail").forEach((rail) => {
  if (!rail.dataset.loopReady) {
    const items = Array.from(rail.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      rail.appendChild(clone);
    });
    rail.dataset.loopReady = "true";
  }

  let paused = false;
  let raf = 0;
  let last = performance.now();

  rail.addEventListener("mouseenter", () => {
    paused = true;
  });
  rail.addEventListener("mouseleave", () => {
    paused = false;
  });
  rail.addEventListener("focusin", () => {
    paused = true;
  });
  rail.addEventListener("focusout", () => {
    paused = false;
  });

  function updateRailActiveItem() {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      rail.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
      return;
    }

    const railBox = rail.getBoundingClientRect();
    const center = railBox.left + railBox.width / 2;
    let closest = null;
    let closestDistance = Infinity;

    Array.from(rail.children).forEach((item) => {
      const box = item.getBoundingClientRect();
      const itemCenter = box.left + box.width / 2;
      const distance = Math.abs(itemCenter - center);
      if (distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    });

    rail.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
    if (closest) closest.classList.add("is-active");
  }

  rail.addEventListener("scroll", updateRailActiveItem, { passive: true });
  window.addEventListener("resize", updateRailActiveItem);
  updateRailActiveItem();

  function tick(now) {
    const delta = now - last;
    last = now;
    if (!paused && rail.scrollWidth > rail.clientWidth) {
      rail.scrollLeft += delta * 0.09;
      const loopPoint = rail.scrollWidth / 2;
      if (rail.scrollLeft >= loopPoint) {
        rail.scrollLeft -= loopPoint;
      }
      updateRailActiveItem();
    }
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
});

document.querySelectorAll(".home-projects").forEach((projectList) => {
  const rows = Array.from(projectList.querySelectorAll(".feature-row"));
  if (!rows.length) return;

  function updateActiveProjectRow() {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      rows.forEach((row) => row.classList.remove("is-active"));
      return;
    }

    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let closestDistance = Infinity;

    rows.forEach((row) => {
      const box = row.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;

      const rowCenter = box.top + box.height / 2;
      const distance = Math.abs(rowCenter - viewportCenter);
      if (distance < closestDistance) {
        closest = row;
        closestDistance = distance;
      }
    });

    rows.forEach((row) => row.classList.toggle("is-active", row === closest));
  }

  window.addEventListener("scroll", updateActiveProjectRow, { passive: true });
  window.addEventListener("resize", updateActiveProjectRow);
  updateActiveProjectRow();
});


document.querySelectorAll("[data-specimen-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("img"));
  if (slides.length < 2) return;

  let index = slides.findIndex((slide) => slide.classList.contains("active"));
  if (index < 0) index = 0;
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const interval = Number(carousel.dataset.carouselInterval) || 3400;

  window.setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, interval);
});

document.querySelectorAll("[data-paired-specimen]").forEach((gallery) => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  Array.from(gallery.querySelectorAll(".paired-specimen-column")).forEach((column, columnIndex) => {
    const slides = Array.from(column.querySelectorAll("img"));
    if (slides.length < 2) return;

    let index = slides.findIndex((slide) => slide.classList.contains("active"));
    if (index < 0) index = 0;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));

    const advance = () => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    };

    const interval = 2800;
    const initialDelay = columnIndex === 0 ? interval : interval / 2;

    window.setTimeout(() => {
      advance();
      window.setInterval(advance, interval);
    }, initialDelay);
  });
});

document.querySelectorAll("[data-horizontal-gallery]").forEach((gallery) => {
  const autoGallery = gallery.hasAttribute("data-auto-gallery");

  if (autoGallery && !gallery.dataset.loopReady) {
    const items = Array.from(gallery.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      gallery.appendChild(clone);
    });
    gallery.dataset.loopReady = "true";
  }

  if (autoGallery) return;

  let paused = false;
  let raf = 0;
  let last = performance.now();

  gallery.addEventListener("mouseenter", () => {
    paused = !autoGallery;
  });
  gallery.addEventListener("mouseleave", () => {
    paused = false;
  });
  gallery.addEventListener("focusin", () => {
    paused = !autoGallery;
  });
  gallery.addEventListener("focusout", () => {
    paused = false;
  });

  function tick(now) {
    const delta = now - last;
    last = now;
    if (autoGallery && gallery.scrollWidth > gallery.clientWidth) {
      gallery.scrollLeft += delta * 0.075;
      const loopPoint = gallery.scrollWidth / 2;
      if (gallery.scrollLeft >= loopPoint) {
        gallery.scrollLeft -= loopPoint;
      }
    } else if (!paused && gallery.scrollWidth > gallery.clientWidth) {
      gallery.scrollLeft += delta * 0.075;
    }
    raf = requestAnimationFrame(tick);
  }

  if (autoGallery) {
    raf = requestAnimationFrame(tick);
    window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
  }

  gallery.addEventListener(
    "wheel",
    (event) => {
      if (window.matchMedia("(max-width: 980px)").matches) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScroll = gallery.scrollWidth - gallery.clientWidth;
      const nextScroll = gallery.scrollLeft + event.deltaY;
      const canScrollLeft = event.deltaY < 0 && gallery.scrollLeft > 0;
      const canScrollRight = event.deltaY > 0 && gallery.scrollLeft < maxScroll;

      if (canScrollLeft || canScrollRight) {
        event.preventDefault();
        gallery.scrollLeft = Math.max(0, Math.min(maxScroll, nextScroll));
      }
    },
    { passive: false }
  );
});

(() => {
  const header = document.querySelector(".site-header");
  if (!header || header.querySelector(".mobile-menu-toggle")) return;

  const items = [
    { href: "index.html#type-projects", icon: "字", en: "Type Projects", zh: "字体项目", match: ["index.html", ""] },
    { href: "brands.html", icon: "研", en: "Research", zh: "研究", match: ["brands.html"] },
    { href: "activities.html", icon: "课", en: "Teaching", zh: "教学", match: ["activities.html"] },
    { href: "talks.html", icon: "讲", en: "Talks", zh: "讲座", match: ["talks.html"] },
    { href: "index.html#about", icon: "关", en: "About", zh: "关于", match: [] },
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const toggle = document.createElement("button");
  toggle.className = "mobile-menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open mobile navigation");
  toggle.setAttribute("aria-controls", "mobile-drawer");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const headerRight = header.querySelector(".header-right");
  header.insertBefore(toggle, headerRight || null);

  const overlay = document.createElement("button");
  overlay.className = "mobile-drawer-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Close mobile navigation");

  const drawer = document.createElement("aside");
  drawer.className = "mobile-drawer";
  drawer.id = "mobile-drawer";
  drawer.setAttribute("aria-label", "Mobile navigation");
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <div class="mobile-drawer-brand">
      <a href="index.html">CY Type｜虫鱼爬字</a>
    </div>
    <nav class="mobile-drawer-nav">
      ${items
        .map((item) => {
          const active = item.match.includes(currentPage) ? " is-active" : "";
          const ariaCurrent = active ? ' aria-current="page"' : "";
          return `<a class="mobile-drawer-link${active}" href="${item.href}"${ariaCurrent}>
            <span class="mobile-drawer-icon">${item.icon}</span>
            <span><strong><span class="i18n-en">${item.en}</span><span class="i18n-zh">${item.zh}</span></strong><small>${item.en}</small></span>
          </a>`;
        })
        .join("")}
    </nav>
    <button class="mobile-drawer-close" type="button">
      <span class="mobile-drawer-icon">×</span>
      <span><strong><span class="i18n-en">Close</span><span class="i18n-zh">关闭</span></strong><small>Close menu</small></span>
    </button>
    <div class="mobile-drawer-foot">
      <strong>CY Type｜虫鱼爬字</strong>
      <p>Type, scripts, and digital writing systems.</p>
    </div>
  `;

  document.body.append(overlay, drawer);

  const setOpen = (open) => {
    document.body.classList.toggle("mobile-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    drawer.setAttribute("aria-hidden", String(!open));
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  overlay.addEventListener("click", () => setOpen(false));
  drawer.querySelector(".mobile-drawer-close").addEventListener("click", () => setOpen(false));
  drawer.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
})();
