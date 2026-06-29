document.querySelectorAll("[data-font-tester]").forEach((tester) => {
  const textInput = tester.querySelector("[data-tester-text]");
  const sizeInput = tester.querySelector("[data-tester-size]");
  const lineInput = tester.querySelector("[data-tester-line]");
  const fontSelect = tester.querySelector("[data-tester-font]");
  const output = tester.querySelector("[data-tester-output]");
  const outputFrame = tester.querySelector(".tester-output");
  const sizeValue = tester.querySelector("[data-size-value]");
  const lineValue = tester.querySelector("[data-line-value]");
  const invert = tester.querySelector("[data-invert]");
  const alignButtons = tester.querySelectorAll("[data-align]");

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function syncSizeFromValue() {
    const value = clamp(Number(sizeValue.value) || Number(sizeInput.value), Number(sizeInput.min), Number(sizeInput.max));
    sizeInput.value = String(value);
    sizeValue.value = String(value);
    update();
  }

  function syncLineFromValue() {
    const min = Number(lineValue.min);
    const max = Number(lineValue.max);
    const value = clamp(Number(lineValue.value) || Number(lineInput.value) / 100, min, max);
    lineValue.value = value.toFixed(2);
    lineInput.value = String(Math.round(value * 100));
    update();
  }

  function update() {
    if (textInput) output.textContent = textInput.value || textInput.placeholder || "";
    if (sizeInput) {
      output.style.fontSize = `${sizeInput.value}px`;
      if (sizeValue) sizeValue.value = sizeInput.value;
    }
    if (lineInput) {
      const line = Number(lineInput.value) / 100;
      const size = Number(sizeInput?.value) || 96;
      output.style.lineHeight = String(line);
      output.style.setProperty("--line-top-compensation", `${(1 - line) * size * 0.5}px`);
      if (lineValue) lineValue.value = line.toFixed(2);
    }
    if (fontSelect) {
      output.classList.remove("font-aki-roman", "font-aki-italic", "font-lihei");
      output.classList.add(fontSelect.value);
    }
    outputFrame.classList.toggle("output-invert", Boolean(invert?.checked));
  }

  textInput?.addEventListener("input", update);
  sizeInput?.addEventListener("input", update);
  lineInput?.addEventListener("input", update);
  sizeValue?.addEventListener("change", syncSizeFromValue);
  sizeValue?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") syncSizeFromValue();
  });
  lineValue?.addEventListener("change", syncLineFromValue);
  lineValue?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") syncLineFromValue();
  });
  fontSelect?.addEventListener("change", update);
  invert?.addEventListener("change", update);
  alignButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alignButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      output.style.textAlign = button.dataset.align;
      outputFrame.style.justifyContent =
        button.dataset.align === "center" ? "center" : button.dataset.align === "right" ? "flex-end" : "flex-start";
    });
  });
  update();
});
