// src/utils/pdfGenerator.ts
// Generates official, publication-ready GeM/GFR 2017 compliant Tender Specification PDFs

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TenderDocumentModel } from "../types/api";

export function generateTenderPdf(docData: TenderDocumentModel): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(8, 33, 45); // Gov Navy #08212D
  doc.rect(0, 0, pageWidth, 28, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("GOVERNMENT e-MARKETPLACE (GeM) TENDER SPECIFICATION", margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Formulated in strict adherence to GFR 2017 Rule 144 & Bureau of Indian Standards (BIS) Mandates",
    margin,
    17
  );
  doc.text(
    `Tender Ref: ${docData.tenderRefNo}  |  Generated: ${docData.generatedDate}`,
    margin,
    23
  );

  let cursorY = 35;

  // 1. Executive Tender Summary Box
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, cursorY, contentWidth, 34, 2, 2, "FD");

  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. PROCUREMENT OVERVIEW & CONSIGNEE DETAILS", margin + 4, cursorY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const leftColX = margin + 4;
  const rightColX = margin + contentWidth / 2 + 2;

  doc.text(`Tender Title: ${docData.additionalInfo.tenderTitle || docData.productName}`, leftColX, cursorY + 14);
  doc.text(`Procuring Dept: ${docData.additionalInfo.department || "General Public Administration"}`, leftColX, cursorY + 20);
  doc.text(`Consignee Location: ${docData.additionalInfo.consigneeLocation || "Central Store Depot"}`, leftColX, cursorY + 26);

  doc.text(`Total Quantity: ${docData.quantity} Units`, rightColX, cursorY + 14);
  doc.text(`Delivery Schedule: Within ${docData.additionalInfo.deliveryPeriodDays || 30} Days`, rightColX, cursorY + 20);
  doc.text(`Warranty: ${docData.additionalInfo.warrantyMonths || 24} Months Comprehensive On-site`, rightColX, cursorY + 26);

  cursorY += 40;

  // 2. Bill of Items & Extracted Technical Parameters
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 136, 201); // Gov Blue #1688C9
  doc.text("2. BILL OF REQUIREMENTS & TECHNICAL SPECIFICATIONS", margin, cursorY);
  cursorY += 3;

  const technicalRows: Array<[string, string]> = [
    ["Product Classification", `${docData.productName} (${docData.productCategory || "Industrial & Consumer Goods"})`],
    ["Requisitioned Quantity", `${docData.quantity} Units`],
  ];

  if (docData.additionalInfo.operationalDuty) {
    technicalRows.push(["Operating Duty / Environment", docData.additionalInfo.operationalDuty]);
  }
  if (docData.additionalInfo.powerRating) {
    technicalRows.push(["Power Rating / Supply", docData.additionalInfo.powerRating]);
  }
  if (docData.additionalInfo.headRange) {
    technicalRows.push(["Operating Head Range", docData.additionalInfo.headRange]);
  }
  if (docData.additionalInfo.dischargeCapacity) {
    technicalRows.push(["Discharge Rate / Capacity", docData.additionalInfo.dischargeCapacity]);
  }
  if (docData.additionalInfo.materialEnclosure) {
    technicalRows.push(["Enclosure / Material Construction", docData.additionalInfo.materialEnclosure]);
  }

  // Include parameters extracted by AI engine
  docData.understanding.parameters?.forEach((p) => {
    if (p.name && p.value) {
      technicalRows.push([String(p.name), String(p.value)]);
    }
  });

  // Custom user specs
  docData.additionalInfo.customSpecs?.forEach((cs) => {
    if (cs.name && cs.value) {
      technicalRows.push([cs.name, cs.value]);
    }
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [["Technical Parameter / Attribute", "Procurement Requirement / Value"]],
    body: technicalRows,
    theme: "striped",
    headStyles: {
      fillColor: [8, 33, 45], // Gov Navy #08212D
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [23, 35, 43], // Gov Text #17232B
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: "auto" },
    },
  });

  // Get position after table
  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Check if we need a page break for the Standards table
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = 20;
  }

  // 3. Mandatory & Allied Indian Standards (BIS)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 136, 201); // Gov Blue #1688C9
  doc.text("3. MANDATORY BIS STANDARDS COMPLIANCE MATRIX", margin, cursorY);
  cursorY += 3;

  const standardsRows = docData.selectedStandards.map((std) => [
    std.standard_number,
    std.title,
    std.match_type.toUpperCase(),
    `${std.relevance_score}%`,
    std.status || "Mandatory Standard (Verify latest edition before bid submission)",
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [["Standard Number", "Standard Title", "Type", "Relevance", "Compliance Status"]],
    body: standardsRows,
    theme: "grid",
    headStyles: {
      fillColor: [13, 52, 69], // Gov Navy Light #0D3445
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [23, 35, 43], // Gov Text #17232B
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      1: { cellWidth: 65 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: "auto" },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Check if we need a page break for the Grounded Clause
  if (cursorY > pageHeight - 65) {
    doc.addPage();
    cursorY = 20;
  }

  // 4. Grounded GeM Procurement Clause
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 136, 201); // Gov Blue #1688C9
  doc.text("4. FORMAL TECHNICAL SPECIFICATION CLAUSE (FOR GeM BID UPLOAD)", margin, cursorY);
  cursorY += 5;

  const clauseText =
    docData.specification.clause ||
    docData.specification.specification_text ||
    "All supplied items must strictly adhere to the designated Indian Standards. The vendor must submit authentic BIS certification marks and accredited laboratory test certificates conforming to GFR 2017.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const splitClause = doc.splitTextToSize(clauseText, contentWidth - 4);
  const clauseBoxHeight = splitClause.length * 4.2 + 8;

  // Check if box fits
  if (cursorY + clauseBoxHeight > pageHeight - 40) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, contentWidth, clauseBoxHeight, 2, 2, "FD");

  doc.text(splitClause, margin + 3, cursorY + 6);
  cursorY += clauseBoxHeight + 8;

  // 5. Inspection, Quality & Policy Mandates
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 136, 201); // Gov Blue #1688C9
  doc.text("5. SPECIAL TERMS, INSPECTION & POLICY MANDATES", margin, cursorY);
  cursorY += 5;

  const stcItems = [
    `Inspection Agency: ${docData.additionalInfo.inspectionAgency || "Pre-dispatch inspection by BIS-recognized laboratory / Consignee Nominee"}.`,
    `Testing Mandate: Type test certificates and routine test reports strictly conforming to applicable BIS standards must be submitted prior to dispatch.`,
    `Make in India (MII): ${docData.additionalInfo.makeInIndiaClause ? "Applicable — Purchase preference to Class-I / Class-II local suppliers under Public Procurement (Preference to Make in India) Order." : "Standard procurement provisions apply."}`,
    `MSME Benefits: ${docData.additionalInfo.msmePreference ? "Applicable — Exemption from tender fee and EMD submission as per MSME procurement policy." : "As per standard GeM terms."}`,
    `Audit Hash: Digital SHA-256 integrity fingerprint: ${docData.sha256Hash}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  stcItems.forEach((item) => {
    const splitItem = doc.splitTextToSize(`•  ${item}`, contentWidth);
    doc.text(splitItem, margin, cursorY);
    cursorY += splitItem.length * 4.2;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `IS-Assist Engine (SIH 2026 PS-26108) | Digitally Sealed SHA-256: ${docData.sha256Hash.slice(0, 16)}... | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  return doc;
}
