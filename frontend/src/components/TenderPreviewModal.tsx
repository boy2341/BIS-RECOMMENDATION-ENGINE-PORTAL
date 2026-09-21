// src/components/TenderPreviewModal.tsx
// Renders the finalized GeM tender document with interactive PDF download, clause copying, and cryptographic SHA-256 hash.

import { useState } from "react";
import {
  Check,
  ClipboardCopy,
  Download,
  FileDown,
  Fingerprint,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type { TenderDocumentModel } from "../types/api";
import { generateTenderPdf } from "../utils/pdfGenerator";

interface TenderPreviewModalProps {
  document: TenderDocumentModel;
  onClose: () => void;
  onReset: () => void;
}

export default function TenderPreviewModal({
  document,
  onClose,
  onReset,
}: TenderPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      const doc = generateTenderPdf(document);
      const filename = `GeM_Tender_${document.productName.replace(/\s+/g, "_")}_${document.tenderRefNo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(filename);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleCopyClause = async () => {
    const textToCopy =
      document.specification.clause ||
      document.specification.specification_text ||
      "";
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl text-gov-text flex flex-col">
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gov-navy px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Official GeM Tender Specification Document
              </h2>
              <p className="text-xs text-white/60">
                Tender Ref: <span className="text-white/90 font-mono">{document.tenderRefNo}</span> • GFR 2017 & BIS Grounded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="gov-btn-accent text-xs py-2"
            >
              <Download className="h-4 w-4" />
              Download Official PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Indian Tricolour Accent */}
        <div className="flex h-0.5">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Modal Body: Document Preview */}
        <div className="p-6 space-y-6">
          {/* Header Card */}
          <div className="rounded-lg border border-gray-200 bg-gov-gray p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gov-blue">
                  Government e-Marketplace (GeM) Requisition
                </span>
                <h3 className="text-lg font-bold text-gov-navy">
                  {document.additionalInfo.tenderTitle || document.productName}
                </h3>
              </div>
              <span className="rounded bg-white border border-gray-200 px-2.5 py-1 text-xs text-gov-text font-mono">
                Date: {document.generatedDate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gov-text-secondary font-medium">Requisitioned Quantity</p>
                <p className="font-bold text-gov-blue text-sm">{document.quantity} Units</p>
              </div>
              <div>
                <p className="text-gov-text-secondary font-medium">Department</p>
                <p className="font-semibold text-gov-text truncate">{document.additionalInfo.department || "Public Works"}</p>
              </div>
              <div>
                <p className="text-gov-text-secondary font-medium">Delivery Destination</p>
                <p className="font-semibold text-gov-text truncate">{document.additionalInfo.consigneeLocation || "Central Store"}</p>
              </div>
              <div>
                <p className="text-gov-text-secondary font-medium">Warranty</p>
                <p className="font-semibold text-gov-text">{document.additionalInfo.warrantyMonths} Months On-site</p>
              </div>
            </div>
          </div>

          {/* Section 1: Bill of Requirements Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gov-text-secondary">
              Bill of Requirements & Specifications
            </h4>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gov-navy text-white font-semibold">
                  <tr>
                    <th className="p-3">Specification Parameter</th>
                    <th className="p-3">Mandated Value / Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gov-text">
                  <tr className="bg-white">
                    <td className="p-3 font-semibold">Item Name / Class</td>
                    <td className="p-3">{document.productName} ({document.productCategory})</td>
                  </tr>
                  <tr className="bg-gov-gray">
                    <td className="p-3 font-semibold">Requisition Quantity</td>
                    <td className="p-3 font-bold text-gov-blue">{document.quantity} Units</td>
                  </tr>
                  {document.additionalInfo.operationalDuty && (
                    <tr className="bg-white">
                      <td className="p-3 font-semibold">Operational Duty</td>
                      <td className="p-3">{document.additionalInfo.operationalDuty}</td>
                    </tr>
                  )}
                  {document.additionalInfo.powerRating && (
                    <tr className="bg-gov-gray">
                      <td className="p-3 font-semibold">Power Rating & Supply</td>
                      <td className="p-3">{document.additionalInfo.powerRating}</td>
                    </tr>
                  )}
                  {document.additionalInfo.headRange && (
                    <tr className="bg-white">
                      <td className="p-3 font-semibold">Operating Head Range</td>
                      <td className="p-3">{document.additionalInfo.headRange}</td>
                    </tr>
                  )}
                  {document.additionalInfo.dischargeCapacity && (
                    <tr className="bg-gov-gray">
                      <td className="p-3 font-semibold">Discharge Capacity</td>
                      <td className="p-3">{document.additionalInfo.dischargeCapacity}</td>
                    </tr>
                  )}
                  {document.additionalInfo.materialEnclosure && (
                    <tr className="bg-white">
                      <td className="p-3 font-semibold">Enclosure & Construction</td>
                      <td className="p-3">{document.additionalInfo.materialEnclosure}</td>
                    </tr>
                  )}
                  {document.understanding.parameters?.map((p, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gov-gray" : "bg-white"}>
                      <td className="p-3 font-semibold">{p.name}</td>
                      <td className="p-3">{String(p.value)}</td>
                    </tr>
                  ))}
                  {document.additionalInfo.customSpecs?.map((cs, idx) => (
                    <tr key={`cs-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gov-gray"}>
                      <td className="p-3 font-semibold">{cs.name}</td>
                      <td className="p-3">{cs.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Mandated Standards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gov-text-secondary">
              Mandatory Indian Standards (BIS Compliance)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {document.selectedStandards.map((std) => (
                <div
                  key={std.standard_number}
                  className="rounded-lg border border-gov-blue/20 bg-gov-blue-bg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gov-blue text-xs">{std.standard_number}</span>
                    <span className="rounded bg-gov-green/10 border border-gov-green/30 px-2 py-0.5 text-[10px] text-gov-green font-semibold uppercase">
                      {std.match_type}
                    </span>
                  </div>
                  <p className="text-xs text-gov-text font-medium line-clamp-1">{std.title}</p>
                  <p className="text-[11px] text-gov-text-secondary line-clamp-2">{std.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Grounded Clause */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gov-text-secondary">
                Official GeM Technical Specification Clause
              </h4>
              <button
                type="button"
                onClick={handleCopyClause}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gov-blue hover:underline transition"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-gov-green" />
                    Copied Clause
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy Clause
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gov-gray p-4 font-mono text-xs leading-relaxed text-gov-text whitespace-pre-wrap">
              {document.specification.clause || document.specification.specification_text}
            </div>
          </div>

          {/* Section 4: Security Hash */}
          <div className="rounded-lg border border-gray-200 bg-gov-gray p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-gov-text-secondary">
              <Fingerprint className="h-4 w-4 text-gov-blue" />
              <span>Digital SHA-256 Audit Fingerprint:</span>
              <span className="font-mono text-gov-text font-semibold">{document.sha256Hash}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs text-gov-text-secondary hover:text-gov-text transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start New Tender
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="gov-btn-secondary text-xs"
            >
              Close Preview
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="gov-btn-accent text-xs"
            >
              <FileDown className="h-4 w-4" />
              Download Official Tender PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
