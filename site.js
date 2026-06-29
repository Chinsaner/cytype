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

  function tick(now) {
    const delta = now - last;
    last = now;
    if (!paused && rail.scrollWidth > rail.clientWidth) {
      rail.scrollLeft += delta * 0.09;
      const loopPoint = rail.scrollWidth / 2;
      if (rail.scrollLeft >= loopPoint) {
        rail.scrollLeft -= loopPoint;
      }
    }
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
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
    paused = true;
  });
  gallery.addEventListener("focusout", () => {
    paused = false;
  });

  function tick(now) {
    const delta = now - last;
    last = now;
    if (autoGallery && !paused && gallery.scrollWidth > gallery.clientWidth) {
      gallery.scrollLeft += delta * 0.075;
      const loopPoint = gallery.scrollWidth / 2;
      if (gallery.scrollLeft >= loopPoint) {
        gallery.scrollLeft -= loopPoint;
      }
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
