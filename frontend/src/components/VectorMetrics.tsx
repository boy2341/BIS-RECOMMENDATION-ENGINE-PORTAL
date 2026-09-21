// src/components/VectorMetrics.tsx
// Dense, scannable list of the backend's recommended_standards.

import { Gauge, ShieldCheck } from "lucide-react";
import type { RecommendedStandard } from "../types/api";

interface VectorMetricsProps {
  standards: RecommendedStandard[];
  selectedCodes: string[];
  onToggleSelect: (code: string) => void;
}

export default function VectorMetrics({
  standards,
  selectedCodes,
  onToggleSelect,
}: VectorMetricsProps) {
  if (!standards.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <Gauge size={22} className="mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-500">
          Recommended standards will appear after analysis.
        </p>
      </div>
    );
  }

  // relevance_score isn't a 0-1 ratio in this backend (observed range ~0-10),
  // so bar width is normalized against the highest score in this result set
  // rather than assumed to be a percentage.
  const maxScore = Math.max(...standards.map((s) => s.relevance_score), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-800">
            Recommended standards
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {standards.length} results
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {standards.map((s, idx) => {
          const isSelected = selectedCodes.includes(s.standard_number);
          const isPrimary = s.match_type === "primary";
          return (
            <li
              key={`${s.standard_number}-${idx}`}
              className={[
                "px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors",
                isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50",
              ].join(" ")}
              onClick={() => onToggleSelect(s.standard_number)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(s.standard_number)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                aria-label={`Select ${s.standard_number} for specification generation`}
              />

              <div className="flex flex-col items-center w-7 shrink-0">
                <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">
                    {s.standard_number}
                  </span>
                  {s.year && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {s.year}
                    </span>
                  )}
                  {isPrimary && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      <ShieldCheck size={10} /> Primary match
                    </span>
                  )}
                  {!isPrimary && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {s.match_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-1">
                  {s.title}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPrimary ? "bg-indigo-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.min((s.relevance_score / maxScore) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-500 w-10 text-right">
                    {s.relevance_score.toFixed(1)}
                  </span>
                </div>

                {s.rationale && (
                  <p className="text-[11px] text-slate-400 leading-snug mt-1.5 line-clamp-2">
                    {s.rationale}
                  </p>
                )}

                {s.status && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                    {s.status}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
