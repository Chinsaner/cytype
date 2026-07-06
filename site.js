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

document.querySelectorAll("[data-glyph-field]").forEach((field) => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const glyphs = [
    "虫", "鱼", "爬", "字", "隶", "黑", "悠", "然", "书", "写", "系", "统",
    "文", "字", "笔", "画", "撇", "捺", "横", "竖", "点", "钩", "碑", "刻",
    "A", "B", "C", "G", "R", "S", "T", "Y", "a", "e", "g", "n", "r", "t",
    "ꀀ", "ꁱ", "ꂷ", "ꃅ", "ꄿ", "ꇁ", "ꈌ", "ꉙ", "ꊿ", "ꌠ", "ꎭ", "ꑭ"
  ];

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function buildField() {
    const isNarrow = window.matchMedia("(max-width: 640px)").matches;
    const columns = isNarrow ? 7 : 14;
    const rows = isNarrow ? 8 : 6;
    const count = columns * rows;

    field.style.setProperty("--glyph-columns", columns);
    field.replaceChildren();

    for (let index = 0; index < count; index += 1) {
      const glyph = document.createElement("span");
      glyph.textContent = randomGlyph();
      glyph.style.setProperty("--glyph-opacity", (0.14 + Math.random() * 0.24).toFixed(2));
      glyph.style.setProperty("--glyph-shift", `${(Math.random() * 0.28 - 0.14).toFixed(2)}em`);
      field.appendChild(glyph);
    }
  }

  buildField();
  window.addEventListener("resize", buildField);

  if (reduceMotion) return;

  window.setInterval(() => {
    const cells = Array.from(field.children);
    const changes = Math.max(4, Math.floor(cells.length * 0.13));

    for (let index = 0; index < changes; index += 1) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      if (!cell) continue;

      cell.classList.add("is-changing");
      window.setTimeout(() => {
        cell.textContent = randomGlyph();
        cell.style.setProperty("--glyph-opacity", (0.14 + Math.random() * 0.3).toFixed(2));
        cell.style.setProperty("--glyph-shift", `${(Math.random() * 0.28 - 0.14).toFixed(2)}em`);
        cell.classList.remove("is-changing");
      }, 140);
    }
  }, 420);
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

  window.setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 3400);
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
