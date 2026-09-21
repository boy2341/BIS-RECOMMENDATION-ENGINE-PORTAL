// src/components/ExtensionResultsView.tsx
// Renders the full 6-card intelligence view from the IS-Assist Chrome Extension with enhanced interactive selection.

import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Network,
  Shield,
  Tag,
} from "lucide-react";
import type { AnalysisResponse } from "../types/api";

interface ExtensionResultsViewProps {
  analysis: AnalysisResponse;
  selectedStandards: string[];
  onToggleStandard: (standardNumber: string) => void;
  onSelectAllStandards: () => void;
  showGraph: boolean;
  onToggleGraph: () => void;
}

export default function ExtensionResultsView({
  analysis,
  selectedStandards,
  onToggleStandard,
  onSelectAllStandards,
  showGraph,
  onToggleGraph,
}: ExtensionResultsViewProps) {
  const {
    understanding,
    recommended_standards = [],
    related_standards = [],
    compliance = [],
    explanation,
  } = analysis;

  const allSelected =
    recommended_standards.length > 0 &&
    recommended_standards.every((s) =>
      selectedStandards.includes(s.standard_number)
    );

  return (
    <div className="space-y-5">
      {/* Top Banner: Identified Product & Extension Badge */}
      <section className="rounded-lg bg-gov-navy-light p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                  Standards Intelligence Matrix
                </span>
                <span className="rounded bg-gov-green/20 px-2 py-0.5 text-[10px] font-semibold text-gov-green">
                  Confidence: {Math.round((understanding?.confidence ?? 0.85) * 100)}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {understanding?.product || "Product Identified"}
              </h2>
              <p className="text-xs text-white/60">
                Category: <span className="text-white/80 font-medium">{understanding?.product_category || "General Procurement"}</span>
                {understanding?.application && ` • Application: ${understanding.application}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleGraph}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all border ${
                showGraph
                  ? "bg-gov-blue text-white border-gov-blue"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              <Network className="h-4 w-4" />
              {showGraph ? "Hide Standards Graph" : "View Standards Graph"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Extracted Requirements / Parameters */}
      <section className="gov-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gov-text">
            <Tag className="h-4 w-4 text-gov-blue" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Extracted Requirements & Parameters
            </h3>
          </div>
          <span className="text-xs text-gov-text-secondary">
            {understanding?.parameters?.length ?? 0} attributes identified
          </span>
        </div>

        {(!understanding?.parameters || understanding.parameters.length === 0) ? (
          <p className="text-xs text-gov-text-secondary italic">No structured parameters extracted.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {understanding.parameters.map((param, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gov-gray px-3 py-1.5 text-xs text-gov-text"
              >
                <span className="font-semibold text-gov-blue">{param.name}:</span>
                <span>{String(param.value)}</span>
                {param.confidence !== undefined && (
                  <span className="ml-1 text-[10px] text-gov-text-secondary">
                    ({Math.round(Number(param.confidence) * 100)}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Keywords */}
        {understanding?.keywords && understanding.keywords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-gov-text-secondary">Keywords:</span>
            {understanding.keywords.map((kw, i) => (
              <span
                key={i}
                className="rounded bg-gov-blue-bg px-2 py-0.5 text-[11px] text-gov-blue border border-gov-blue/20"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 3. Recommended Standards */}
      <section className="gov-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-gov-text flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-gov-blue" />
              Recommended Indian Standards
            </h3>
            <p className="text-xs text-gov-text-secondary">
              Ranked via ChromaDB vector similarity + BIS metadata grounding
            </p>
          </div>

          <button
            type="button"
            onClick={onSelectAllStandards}
            className="text-xs font-semibold text-gov-blue hover:underline transition"
          >
            {allSelected ? "Deselect All" : "Select All for Tender"}
          </button>
        </div>

        {recommended_standards.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-xs text-gov-text-secondary">
            No specific standards match this criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {recommended_standards.map((std) => {
              const isSelected = selectedStandards.includes(std.standard_number);
              const isPrimary = std.match_type === "primary";

              return (
                <article
                  key={std.standard_number}
                  className={`rounded-lg border p-4 transition-all ${
                    isSelected
                      ? "border-gov-blue bg-gov-blue-bg shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleStandard(std.standard_number)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-gov-blue focus:ring-gov-blue cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gov-text text-sm">
                            {std.standard_number}
                          </span>
                          <span className="text-gov-text-secondary text-xs">—</span>
                          <span className="font-medium text-gov-text text-xs line-clamp-1">
                            {std.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isPrimary
                                ? "bg-gov-green/10 text-gov-green border border-gov-green/30"
                                : "bg-gov-blue/10 text-gov-blue border border-gov-blue/30"
                            }`}
                          >
                            {std.match_type}
                          </span>

                          <span className="rounded bg-gov-gray px-2 py-0.5 text-[10px] font-semibold text-gov-text border border-gray-200">
                            Relevance: {std.relevance_score}%
                          </span>

                          {std.year && (
                            <span className="text-[10px] text-gov-text-secondary">
                              Year: {std.year}
                            </span>
                          )}
                        </div>

                        {std.rationale && (
                          <p className="text-xs text-gov-text-secondary pt-1 leading-relaxed">
                            {std.rationale}
                          </p>
                        )}

                        {(std.status || std.amendment) && (
                          <p className="text-[11px] text-gov-text-secondary pt-0.5 italic">
                            {[std.status, std.amendment].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    </label>

                    {std.source_url && (
                      <a
                        href={std.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gov-blue hover:bg-gov-blue-bg transition"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Related Standards */}
      {related_standards.length > 0 && (
        <section className="gov-card">
          <h3 className="mb-3 text-sm font-bold text-gov-text flex items-center gap-2">
            <Layers className="h-4 w-4 text-gov-blue" />
            Related & Allied Standards ({related_standards.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {related_standards.map((rel, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gov-gray p-3.5 hover:border-gray-300 transition"
              >
                <div className="space-y-1">
                  <span className="font-bold text-gov-text text-xs">
                    {rel.standard_number}
                  </span>
                  <p className="text-xs text-gov-text-secondary line-clamp-1">{rel.title}</p>
                  <span className="inline-block rounded bg-gov-blue-bg px-2 py-0.5 text-[10px] font-medium text-gov-blue border border-gov-blue/20">
                    Relationship: {rel.relationship}
                  </span>
                </div>

                {rel.source_url && (
                  <a
                    href={rel.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[10px] text-gov-blue hover:underline flex items-center gap-0.5"
                  >
                    Link <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Compliance Checks & GFR 2017 Matrix */}
      {compliance.length > 0 && (
        <section className="gov-card">
          <h3 className="mb-3 text-sm font-bold text-gov-text flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gov-green" />
            Compliance & Verification Checks
          </h3>

          <div className="space-y-2.5">
            {compliance.map((item, idx) => {
              const isVerify = item.status === "verify";
              const isApplicable = item.status === "applicable";

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gov-gray p-3"
                >
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isApplicable
                        ? "bg-gov-green/10 text-gov-green border border-gov-green/30"
                        : isVerify
                        ? "bg-gov-orange/10 text-gov-orange border border-gov-orange/30"
                        : "bg-gray-100 text-gov-text-secondary border border-gray-200"
                    }`}
                  >
                    {isVerify && <AlertTriangle className="h-3 w-3" />}
                    {isApplicable && <CheckCircle2 className="h-3 w-3" />}
                    {item.status}
                  </span>

                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-gov-text">{item.item}</p>
                    <p className="text-xs text-gov-text-secondary">{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Recommendation Summary */}
      <section className="gov-card">
        <h3 className="mb-2 text-sm font-bold text-gov-text flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gov-blue" />
          Recommendation Summary & Grounding Rationale
        </h3>
        <p className="text-xs text-gov-text-secondary leading-relaxed">
          {explanation?.summary ||
            "The recommendations are formulated by matching extracted technical requirements strictly against the verified BIS knowledge base."}
        </p>

        {explanation?.caution && (
          <div className="mt-3 rounded-lg border border-gov-orange/30 bg-gov-orange/5 p-3 text-xs text-gov-orange flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{explanation.caution}</span>
          </div>
        )}
      </section>
    </div>
  );
}
