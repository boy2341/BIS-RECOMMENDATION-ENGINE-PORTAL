// src/components/StandardsDashboard.tsx
// Full-page BIS Standards Knowledge Base & Rules Dashboard.
// Features: expansive layout, instant multi-field search, category & rule filters,
// quick-filter chips, Grid vs Table view modes, normative relation mapping, and 1-click tender formulation.

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Network,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { fetchAllStandards, type StandardRecord } from "../services/api";

interface StandardsDashboardProps {
  onFormulateTender?: (standard: StandardRecord) => void;
}

const POPULAR_TAGS = [
  "pump",
  "induction motor",
  "three phase",
  "IE2",
  "IE3",
  "IP55",
  "efficiency",
  "testing",
  "dimensions",
  "earthing",
  "agricultural",
];

export default function StandardsDashboard({ onFormulateTender }: StandardsDashboardProps) {
  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch standards from API
  const loadStandards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllStandards();
      setStandards(res.standards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load standards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandards();
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(standards.map((s) => s.category));
    return ["All", ...Array.from(cats).sort()];
  }, [standards]);

  // Filtered & searched standards
  const filtered = useMemo(() => {
    let result = standards;

    if (selectedCategory !== "All") {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (activeTag) {
      const tagLower = activeTag.toLowerCase();
      result = result.filter(
        (s) =>
          s.keywords.some((kw) => kw.toLowerCase().includes(tagLower)) ||
          s.scope.toLowerCase().includes(tagLower) ||
          s.title.toLowerCase().includes(tagLower)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.standard_number.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.scope.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.status && s.status.toLowerCase().includes(q)) ||
          s.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
          s.relations?.some(
            (r) =>
              r.standard_number.toLowerCase().includes(q) ||
              r.relationship.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }, [standards, searchQuery, selectedCategory, activeTag]);

  // Statistics
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    standards.forEach((s) => {
      map[s.category] = (map[s.category] || 0) + 1;
    });
    return map;
  }, [standards]);

  const totalRelations = useMemo(
    () => standards.reduce((acc, s) => acc + (s.relations?.length || 0), 0),
    [standards]
  );

  const totalKeywords = useMemo(
    () => standards.reduce((acc, s) => acc + (s.keywords?.length || 0), 0),
    [standards]
  );

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="relative mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-gov-blue/10 text-gov-blue">
            <Loader2 className="h-8 w-8 animate-spin text-gov-blue" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gov-navy">Connecting to BIS Knowledge Base</h3>
            <p className="text-xs text-gov-text-secondary mt-1">
              Querying ChromaDB vector storage and Indian Standards JSON datastore...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 px-4 flex items-center justify-center">
        <div className="gov-card max-w-lg text-center space-y-4 p-8">
          <AlertCircle className="h-12 w-12 text-gov-red mx-auto" />
          <h3 className="text-lg font-bold text-gov-navy">Failed to Load Standards Database</h3>
          <p className="text-xs text-gov-text-secondary">{error}</p>
          <button
            type="button"
            onClick={loadStandards}
            className="gov-btn-primary mx-auto text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ================================================================ */}
      {/* TOP HERO BANNER: Full-Width Government Portal Aesthetics          */}
      {/* ================================================================ */}
      <div className="rounded-xl bg-gradient-to-r from-gov-navy via-gov-navy-light to-[#13495f] p-6 sm:p-8 text-white shadow-lg border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-0.5 text-xs font-bold text-gov-orange">
                <Database className="h-3.5 w-3.5" /> National Standards Database Explorer
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gov-green/20 border border-gov-green/40 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                ● Live ChromaDB Store
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bureau of Indian Standards (BIS) Repository
            </h2>

            <p className="text-sm text-white/80 leading-relaxed">
              Explore the complete directory of Indian Standards indexed in the IS-Assist system. Search mandatory technical clauses, examine normative inter-relationships (dimensions, testing, safety), and directly launch GeM tender formulation.
            </p>
          </div>

          {/* Quick Metrics Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-white">{standards.length}</p>
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mt-0.5">
                Indian Standards
              </p>
            </div>

            <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-gov-orange">
                {Object.keys(categoryStats).length}
              </p>
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mt-0.5">
                Categories
              </p>
            </div>

            <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#5eead4]">{totalRelations}</p>
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mt-0.5">
                Normative Rules
              </p>
            </div>

            <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#fbcfe8]">{totalKeywords}</p>
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mt-0.5">
                Indexed Terms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEARCH, FILTER, AND VIEW CONTROLS                                */}
      {/* ================================================================ */}
      <div className="gov-card space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gov-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IS code (e.g. 'IS 12615', 'IS 7538'), keyword, scope, testing rules..."
              className="gov-input pl-10 pr-10 text-sm font-medium py-2.5"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gov-text-secondary hover:text-gov-navy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gov-text-secondary shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gov-text focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? `All Categories (${standards.length})` : `${cat} (${categoryStats[cat] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gov-gray p-1 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "grid"
                  ? "bg-white text-gov-navy shadow-sm"
                  : "text-gov-text-secondary hover:text-gov-navy"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-white text-gov-navy shadow-sm"
                  : "text-gov-text-secondary hover:text-gov-navy"
              }`}
              title="Detailed Table View"
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>

        {/* Quick Keyword / Tag Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold text-gov-text-secondary mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              activeTag === null
                ? "bg-gov-navy text-white font-bold"
                : "bg-gov-gray text-gov-text hover:bg-gray-200"
            }`}
          >
            All Terms
          </button>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                activeTag === tag
                  ? "bg-gov-blue text-white font-bold shadow-sm"
                  : "bg-gov-gray text-gov-text hover:bg-gov-blue-bg hover:text-gov-blue"
              }`}
            >
              #{tag}
            </button>
          ))}
          {(searchQuery || selectedCategory !== "All" || activeTag) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setActiveTag(null);
              }}
              className="text-xs text-gov-red hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Active Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-wider text-gov-text-secondary">
          Showing {filtered.length} of {standards.length} Indian Standards
        </p>
        {filtered.length > 0 && (
          <span className="text-xs text-gov-text-secondary">
            Click a standard card to expand full normative rules
          </span>
        )}
      </div>

      {/* ================================================================ */}
      {/* RESULTS DISPLAY: GRID VIEW                                       */}
      {/* ================================================================ */}
      {filtered.length === 0 ? (
        <div className="gov-card text-center py-16 space-y-3">
          <Search className="h-12 w-12 text-gov-text-secondary mx-auto opacity-40" />
          <h3 className="text-base font-bold text-gov-navy">No Matching Standards Found</h3>
          <p className="text-xs text-gov-text-secondary max-w-md mx-auto">
            No Indian Standard in the prototype database matches your criteria. Try searching for "pump", "motor", "IS 12615", or resetting the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setActiveTag(null);
            }}
            className="gov-btn-secondary text-xs mt-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((std) => {
            const isExpanded = expandedId === std.standard_number;

            return (
              <div
                key={std.standard_number}
                className={`rounded-xl border transition-all bg-white shadow-sm flex flex-col justify-between ${
                  isExpanded
                    ? "border-gov-blue ring-1 ring-gov-blue shadow-md"
                    : "border-gray-200 hover:border-gov-blue/60 hover:shadow"
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar: Code, Category, Year, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gov-navy px-2.5 py-1 text-sm font-black tracking-wide text-white">
                          <Shield className="h-3.5 w-3.5 text-gov-orange" />
                          {std.standard_number}
                        </span>
                        <span className="rounded bg-gov-blue/10 border border-gov-blue/20 px-2.5 py-0.5 text-xs font-semibold text-gov-blue">
                          {std.category}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gov-text-secondary">
                          Year: {std.year}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : std.standard_number)}
                      className="text-gov-text-secondary hover:text-gov-blue p-1 rounded-lg hover:bg-gov-gray transition shrink-0"
                      title={isExpanded ? "Collapse" : "Expand details"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gov-blue" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Standard Title */}
                  <h3 className="text-base font-bold text-gov-navy leading-snug">
                    {std.title}
                  </h3>

                  {/* Status Indicator */}
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {std.status}
                    {std.amendment && ` • ${std.amendment}`}
                  </div>

                  {/* Scope Summary */}
                  <p className="text-xs text-gov-text leading-relaxed bg-gov-gray/80 p-3 rounded-lg border border-gray-100">
                    <strong className="text-gov-navy font-semibold">Scope &amp; Technical Mandate: </strong>
                    {isExpanded ? std.scope : `${std.scope.slice(0, 180)}...`}
                  </p>

                  {/* Keywords Pills */}
                  {std.keywords && std.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {std.keywords.slice(0, isExpanded ? undefined : 6).map((kw, i) => (
                        <span
                          key={i}
                          onClick={() => {
                            setSearchQuery(kw);
                          }}
                          className="cursor-pointer rounded bg-gov-blue-bg px-2 py-0.5 text-[10px] font-medium text-gov-blue border border-gov-blue/20 hover:bg-gov-blue hover:text-white transition"
                          title={`Click to search for '${kw}'`}
                        >
                          {kw}
                        </span>
                      ))}
                      {!isExpanded && std.keywords.length > 6 && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gov-text-secondary">
                          +{std.keywords.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Detail: Cross-References & Technical Rules */}
                  {isExpanded && std.relations && std.relations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center gap-1.5">
                        <Network className="h-3.5 w-3.5 text-gov-blue" />
                        Mandatory Normative Relations ({std.relations.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {std.relations.map((rel, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSearchQuery(rel.standard_number)}
                            className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-2 text-xs hover:border-gov-blue cursor-pointer transition shadow-2xs"
                            title={`Search for ${rel.standard_number}`}
                          >
                            <span className="font-bold text-gov-navy">{rel.standard_number}</span>
                            <span className="rounded bg-gov-orange/10 text-gov-orange border border-gov-orange/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
                              {rel.relationship}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="bg-gov-gray/60 px-5 py-3 border-t border-gray-200 rounded-b-xl flex flex-wrap items-center justify-between gap-2">
                  {std.source_url ? (
                    <a
                      href={std.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      BIS Portal Reference
                    </a>
                  ) : (
                    <span className="text-[11px] text-gov-text-secondary">Verified Record</span>
                  )}

                  {onFormulateTender && (
                    <button
                      type="button"
                      onClick={() => onFormulateTender(std)}
                      className="gov-btn-accent text-xs py-1.5 px-3"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Formulate GeM Tender</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================================================================ */
        /* RESULTS DISPLAY: DETAILED TABLE VIEW                             */
        /* ================================================================ */
        <div className="gov-card overflow-hidden p-0 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gov-navy text-white uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Standard Number</th>
                  <th className="px-4 py-3">Title &amp; Year</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Normative Cross-References</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((std) => (
                  <tr key={std.standard_number} className="hover:bg-gov-blue-bg/40 transition">
                    <td className="px-4 py-3 font-bold text-gov-navy whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gov-navy px-2 py-0.5 text-white font-black text-xs">
                          {std.standard_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="font-semibold text-gov-text text-xs leading-snug">{std.title}</p>
                      <p className="text-[11px] text-gov-text-secondary line-clamp-1 mt-0.5">
                        {std.scope}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-gov-blue/10 border border-gov-blue/20 px-2 py-0.5 text-[11px] font-semibold text-gov-blue">
                        {std.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {std.relations?.map((r, i) => (
                          <span
                            key={i}
                            onClick={() => setSearchQuery(r.standard_number)}
                            className="cursor-pointer rounded bg-gov-gray border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gov-navy hover:border-gov-blue"
                            title={`Relation: ${r.relationship}`}
                          >
                            {r.standard_number} ({r.relationship})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {std.source_url && (
                          <a
                            href={std.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-gray-300 p-1.5 text-gov-text-secondary hover:text-gov-blue hover:border-gov-blue transition"
                            title="View official BIS document"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {onFormulateTender && (
                          <button
                            type="button"
                            onClick={() => onFormulateTender(std)}
                            className="gov-btn-accent text-xs py-1 px-2.5"
                          >
                            Formulate Tender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
