const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const errorMessage = document.getElementById("error-message");
const results = document.getElementById("results");

const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");
const requirementsList = document.getElementById("requirements-list");
const standardsList = document.getElementById("standards-list");
const relatedStandardsList = document.getElementById("related-standards-list");
const complianceList = document.getElementById("compliance-list");
const explanationSummary = document.getElementById("explanation-summary");

async function loadAnalysis() {
  const storedData = await chrome.storage.local.get([
    "latestAnalysis",
    "analysisError",
    "analysisStatus"
  ]);

  renderPanel(storedData);
}

function renderPanel({ latestAnalysis, analysisError, analysisStatus }) {
  hideAllStates();

  if (analysisStatus === "loading") {
    loadingState.classList.remove("hidden");
    return;
  }

  if (analysisStatus === "error") {
    errorMessage.textContent = analysisError || "An unknown error occurred.";
    errorState.classList.remove("hidden");
    return;
  }

  if (analysisStatus !== "complete" || !latestAnalysis) {
    emptyState.classList.remove("hidden");
    return;
  }

  renderResults(latestAnalysis);
  results.classList.remove("hidden");
}

function hideAllStates() {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  results.classList.add("hidden");
}

function renderResults(analysis) {
  const understanding = analysis.understanding || {};

  productName.textContent = understanding.product || "Product not identified";
  productCategory.textContent =
    understanding.product_category || "Category not identified";

  explanationSummary.textContent =
    analysis.explanation?.summary ||
    "The recommendations are based on the extracted tender requirements.";

  renderRequirements(understanding.parameters || []);
  renderRecommendedStandards(analysis.recommended_standards || []);
  renderRelatedStandards(analysis.related_standards || []);
  renderCompliance(analysis.compliance || []);
}

function renderRequirements(parameters) {
  clearElement(requirementsList);

  if (parameters.length === 0) {
    addEmptyMessage(requirementsList, "No structured requirements were extracted.");
    return;
  }

  parameters.forEach((parameter) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `${parameter.name}: ${parameter.value}`;
    requirementsList.appendChild(tag);
  });
}

function renderRecommendedStandards(standards) {
  clearElement(standardsList);

  if (standards.length === 0) {
    addEmptyMessage(standardsList, "No standards were recommended.");
    return;
  }

  standards.forEach((standard) => {
    const item = createListItem();

    addText(item, "item-title", `${standard.standard_number} — ${standard.title}`);

    const score = document.createElement("p");
    score.className = "item-meta score";
    score.textContent = `${standard.relevance_score}% relevance • ${standard.match_type}`;
    item.appendChild(score);

    if (standard.rationale) {
      addText(item, "item-note", standard.rationale);
    }

    if (standard.status || standard.amendment) {
      const details = [standard.status, standard.amendment]
        .filter(Boolean)
        .join(" • ");

      addText(item, "item-meta", details);
    }

    if (standard.source_url) {
      item.appendChild(createSourceLink(standard.source_url));
    }

    standardsList.appendChild(item);
  });
}

function renderRelatedStandards(standards) {
  clearElement(relatedStandardsList);

  if (standards.length === 0) {
    addEmptyMessage(relatedStandardsList, "No related standards were identified.");
    return;
  }

  standards.forEach((standard) => {
    const item = createListItem();

    addText(item, "item-title", `${standard.standard_number} — ${standard.title}`);
    addText(item, "item-meta", `Relationship: ${standard.relationship}`);

    if (standard.source_url) {
      item.appendChild(createSourceLink(standard.source_url));
    }

    relatedStandardsList.appendChild(item);
  });
}

function renderCompliance(items) {
  clearElement(complianceList);

  if (items.length === 0) {
    addEmptyMessage(complianceList, "No compliance checks were returned.");
    return;
  }

  items.forEach((itemData) => {
    const item = createListItem();

    const status = document.createElement("span");
    status.className = "status";
    status.textContent = itemData.status;
    item.appendChild(status);

    addText(item, "item-title", itemData.item);
    addText(item, "item-note", itemData.note);

    complianceList.appendChild(item);
  });
}

function createListItem() {
  const item = document.createElement("article");
  item.className = "list-item";
  return item;
}

function addText(parent, className, text) {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
}

function addEmptyMessage(parent, message) {
  addText(parent, "item-note", message);
}

function createSourceLink(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "View source ↗";
  return link;
}

function clearElement(element) {
  element.replaceChildren();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const relevantChange =
    changes.latestAnalysis ||
    changes.analysisError ||
    changes.analysisStatus;

  if (relevantChange) {
    loadAnalysis();
  }
});

loadAnalysis();