const API_BASE_URL = "http://127.0.0.1:8000";

chrome.sidePanel.setPanelBehavior({
  openPanelOnActionClick: true
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "ANALYZE_TENDER") {
    return;
  }

  analyzeTender(message.text)
    .then((result) => {
      sendResponse({
        success: true,
        result
      });
    })
    .catch((error) => {
      sendResponse({
        success: false,
        error: error.message
      });
    });

  return true;
});

async function analyzeTender(tenderText) {
  if (!tenderText || tenderText.trim().length < 5) {
    throw new Error("No usable tender text was found on this page.");
  }

  await chrome.storage.local.set({
    latestAnalysis: null,
    analysisError: null,
    analysisStatus: "loading",
    analyzedText: tenderText
  });

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: tenderText,
        top_k: 5
      })
    });
  } catch {
    const errorMessage =
      "Could not reach the IS-Assist backend. Start it at http://127.0.0.1:8000.";

    await chrome.storage.local.set({
      analysisStatus: "error",
      analysisError: errorMessage
    });

    throw new Error(errorMessage);
  }

  const responseData = await response.json();

  if (!response.ok) {
    const errorMessage =
      responseData.detail || "The backend could not analyze this tender.";

    await chrome.storage.local.set({
      analysisStatus: "error",
      analysisError: errorMessage
    });

    throw new Error(errorMessage);
  }

  await chrome.storage.local.set({
    latestAnalysis: responseData,
    analysisError: null,
    analysisStatus: "complete"
  });

  return responseData;
}