// src/components/SpecificationBlock.tsx
// Renders the Groq-generated GeM technical specification with audit tooling.

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ClipboardCopy,
  FileDown,
  Fingerprint,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { GenerateSpecificationResponse } from "../types/api";

interface SpecificationBlockProps {
  spec: GenerateSpecificationResponse | null;
  qcoMandated: boolean;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function SpecificationBlock({
  spec,
  qcoMandated,
}: SpecificationBlockProps) {
  const [copied, setCopied] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const specText = spec ? (spec.clause || spec.specification_text || "") : "";
  const specDate = spec?.generated_at || new Date().toISOString();
  const notes = spec ? (spec.notes || spec.verification_notes || []) : [];
  const selectedStds = spec?.selected_standards || [];
  const prodName = spec?.product || spec?.title || "Product";

  useEffect(() => {
    setHash(null);
    setDownloaded(false);
    if (!spec) return;
    setHashing(true);
    sha256Hex(specText + specDate)
      .then(setHash)
      .finally(() => setHashing(false));
  }, [spec, specText, specDate]);

  if (!spec) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <Sparkles size={22} className="mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-500">
          Select standards and generate a GeM technical specification.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(specText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadCertificate = () => {
    setDownloading(true);
    setTimeout(() => {
      const blob = new Blob(
        [
          `CVC / GFR 2017 AUDIT CERTIFICATE\n`,
          `Product: ${prodName}\n`,
          `Generated: ${specDate}\n`,
          `Standards: ${selectedStds.join(", ")}\n`,
          `SHA-256: ${hash ?? "pending"}\n\n`,
          `--- SPECIFICATION TEXT ---\n\n`,
          specText,
        ],
        { type: "text/plain" }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-certificate-${prodName.replace(/\s+/g, "-").toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    }, 900);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-800">
            GeM Technical Specification
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" /> Copied
              </>
            ) : (
              <>
                <ClipboardCopy size={12} /> Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownloadCertificate}
            disabled={downloading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : downloaded ? (
              <Check size={12} />
            ) : (
              <FileDown size={12} />
            )}
            {downloaded ? "Downloaded" : "Audit cert"}
          </button>
        </div>
      </div>

      {/* QCO banner */}
      {qcoMandated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Quality Control Order active:</strong> BIS standard
            compliance is legally mandatory for this product. Uncertified goods
            may not be purchased under GFR 2017 Rule 144.
          </span>
        </div>
      )}

      {/* Spec text */}
      <div className="px-4 py-3">
        <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-72 overflow-y-auto">
          {specText}
        </pre>
      </div>

      {/* Verification notes */}
      {notes.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[11px] font-medium text-slate-500 mb-1.5">
            Verification notes
          </p>
          <ul className="space-y-1">
            {notes.map((note, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 flex items-start gap-1.5"
              >
                <Check size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hash badge */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-200">
          <Fingerprint size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">
            SHA-256: {hashing ? "computing…" : (hash ?? "n/a")}
          </span>
        </div>
      </div>
    </div>
  );
}
