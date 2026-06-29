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
