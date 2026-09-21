const BUTTON_ID = "is-assist-analyze-button";

function getTenderText() {
  const pageText = document.body.innerText
    .replace(/\s+/g, " ")
    .trim();

  return pageText.slice(0, 100000);
}

function createAnalyzeButton() {
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement("button");

  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "Analyze Tender";

  button.style.position = "fixed";
  button.style.right = "24px";
  button.style.bottom = "24px";
  button.style.zIndex = "999999";
  button.style.padding = "12px 18px";
  button.style.border = "none";
  button.style.borderRadius = "8px";
  button.style.background = "#0f766e";
  button.style.color = "#ffffff";
  button.style.fontSize = "14px";
  button.style.fontWeight = "600";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";

  button.addEventListener("click", async () => {
    const originalLabel = button.textContent;
    button.textContent = "Analyzing...";
    button.disabled = true;

    try {
      const tenderText = getTenderText();

      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_TENDER",
        text: tenderText
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      button.textContent = "Analysis complete";
    } catch (error) {
      button.textContent = "Analysis failed";
      alert(`IS-Assist: ${error.message}`);
    } finally {
      setTimeout(() => {
        button.textContent = originalLabel;
        button.disabled = false;
      }, 2000);
    }
  });

  document.body.appendChild(button);
}

createAnalyzeButton();