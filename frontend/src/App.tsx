// src/App.tsx
// IS-Assist: AI-Powered Indian Standards (BIS) & GeM Tender Formulation Platform
// Supporting full-page expansive layout, dedicated BIS standards & rules directory,
// conversational prompt intake, extension parity intelligence, and official tender PDF generation.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Database,
  FileCheck,
  FileText,
  Loader2,
  Network,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  ApiError,
  analyzeText,
  checkHealth,
  fetchAllStandards,
  generateSpecification,
  type StandardRecord,
  uploadTenderPdf,
} from "./services/api";
import type {
  AnalysisResponse,
  ExtractedParameter,
  TenderAdditionalInfo,
  TenderDocumentModel,
} from "./types/api";

import ExtensionResultsView from "./components/ExtensionResultsView";
import KnowledgeGraph from "./components/KnowledgeGraph";
import StandardsDashboard from "./components/StandardsDashboard";
import TenderQuestionnaire from "./components/TenderQuestionnaire";
import TenderPreviewModal from "./components/TenderPreviewModal";

const PROMPT_CHIPS = [
  {
    label: "I want 50 pumps",
    prompt: "I want 50 pumps for agricultural and continuous water supply with high efficiency and reliability.",
    highlight: true,
  },
  {
    label: "500 Wooden Office Chairs",
    prompt: "500 wooden office chairs for government high school with ergonomic design and durable timber frame.",
    highlight: false,
  },
  {
    label: "60W LED Street Lighting Fixtures",
    prompt: "LED street lighting fixtures, 60W, 230V AC, IP66 rated for municipal roads with surge protection.",
    highlight: false,
  },
  {
    label: "Three Phase Induction Motors 5 kW",
    prompt: "Supply and installation of three phase induction motors, 5 kW, 415 V, 50 Hz, IP55 enclosure, suitable for continuous industrial operation.",
    highlight: false,
  },
];

type BackendStatus = "checking" | "online" | "offline";
type MainTab = "tender" | "database";
type ActiveStep = "intake" | "standards" | "questionnaire";

async function computeSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<MainTab>("tender");

  // Backend connectivity status
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  // Database standards cache
  const [dbStandards, setDbStandards] = useState<StandardRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await checkHealth();
        if (!cancelled) setBackendStatus("online");
      } catch {
        if (!cancelled) setBackendStatus("offline");
      }
    };
    check();
    const timer = setInterval(check, 15000);

    // Also fetch standards directory list
    fetchAllStandards()
      .then((res) => {
        if (!cancelled && res.standards) setDbStandards(res.standards);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Step flow state inside Tender Formulator
  const [activeStep, setActiveStep] = useState<ActiveStep>("intake");

  // Intake states
  const [promptText, setPromptText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Visual Knowledge Graph modal toggle
  const [showGraph, setShowGraph] = useState(false);

  // Questionnaire / Additional info state
  const [tenderInfo, setTenderInfo] = useState<TenderAdditionalInfo>({
    tenderTitle: "",
    department: "Department of Water Resources & Irrigation",
    consigneeLocation: "Central Store Depot, Division Office (PIN 411001)",
    deliveryPeriodDays: 30,
    warrantyMonths: 24,
    inspectionAgency: "Pre-dispatch inspection by BIS-authorized agency / Consignee Nominee",
    estimatedBudget: "₹ 15,00,000",
    operationalDuty: "Continuous Duty (S1), Agricultural Irrigation & Municipal Water Supply",
    powerRating: "Three-Phase 415 V ±10%, 50 Hz AC, 5.0 HP (3.7 kW)",
    headRange: "Total Head Range: 25 to 35 meters",
    dischargeCapacity: "Discharge: 10 to 16 Litres/second",
    materialEnclosure: "Cast Iron Casing, Bronze Impeller, IP55 Ingress Protection",
    qualityStandardClause: "All products must bear genuine BIS Standard Marks under valid license.",
    makeInIndiaClause: true,
    msmePreference: true,
    customSpecs: [],
  });

  // Specification Generation & Final Document
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [finalDoc, setFinalDoc] = useState<TenderDocumentModel | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Derived quantity from extracted parameters or prompt
  const detectedQuantity = useMemo(() => {
    if (!analysis) return "50";
    const qtyParam = analysis.understanding.parameters?.find((p) =>
      p.name?.toLowerCase().includes("quantity") ||
      p.name?.toLowerCase().includes("count") ||
      p.name?.toLowerCase().includes("unit")
    );
    if (qtyParam?.value) return String(qtyParam.value);

    const match = promptText.match(/(\d+)\s*(pumps|units|pieces|nos|chairs|fixtures)/i);
    return match ? match[1] : "50";
  }, [analysis, promptText]);

  // Handle analysis output
  const handleApplyAnalysis = (res: AnalysisResponse) => {
    setAnalysis(res);

    const defaults = res.recommended_standards
      .filter((s) => s.match_type === "primary" || s.relevance_score >= 60)
      .map((s) => s.standard_number);

    setSelectedCodes(defaults.length > 0 ? defaults : res.recommended_standards.map((s) => s.standard_number));

    const prod = res.understanding.product || "Equipment";
    setTenderInfo((prev) => ({
      ...prev,
      tenderTitle: `Procurement of ${detectedQuantity} Units of ${prod}`,
    }));

    setActiveStep("standards");
  };

  const handleRunAnalysis = useCallback(async (customText?: string) => {
    const textToRun = customText ?? promptText;

    if (pendingFile) {
      setAnalyzeLoading(true);
      setAnalyzeError(null);
      try {
        const res = await uploadTenderPdf(pendingFile);
        handleApplyAnalysis(res.result);
      } catch (err) {
        setAnalyzeError(err instanceof ApiError ? err.message : "Error analyzing tender PDF.");
      } finally {
        setAnalyzeLoading(false);
      }
      return;
    }

    if (!textToRun.trim()) {
      setAnalyzeError("Please enter your requirement prompt or select a sample above.");
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeError(null);
    try {
      const res = await analyzeText(textToRun, 5);
      handleApplyAnalysis(res);
    } catch (err) {
      setAnalyzeError(err instanceof ApiError ? err.message : "Error analyzing requirement text.");
    } finally {
      setAnalyzeLoading(false);
    }
  }, [pendingFile, promptText]);

  const handleChipClick = (chipPrompt: string) => {
    setPromptText(chipPrompt);
    setPendingFile(null);
    setAnalyzeError(null);
    handleRunAnalysis(chipPrompt);
  };

  const handleFormulateFromStandard = (std: StandardRecord) => {
    const prompt = `Procurement of ${std.title} strictly adhering to ${std.standard_number}. Quantity: 50 units for continuous public service installation.`;
    setPromptText(prompt);
    setPendingFile(null);
    setActiveTab("tender");
    setActiveStep("intake");
    handleRunAnalysis(prompt);
  };

  const toggleStandard = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllStandards = () => {
    if (!analysis) return;
    const all = analysis.recommended_standards.map((s) => s.standard_number);
    setSelectedCodes((prev) => (prev.length === all.length ? [] : all));
  };

  // Run tender generation with backend endpoint
  const handleGenerateTender = async () => {
    if (!analysis) return;
    if (selectedCodes.length === 0) {
      setSpecError("Select at least one BIS standard before formulating the tender.");
      return;
    }

    setSpecLoading(true);
    setSpecError(null);

    try {
      const compositeReqs: ExtractedParameter[] = [
        ...(analysis.understanding.parameters || []),
        { name: "Requisitioned Quantity", value: `${detectedQuantity} Units`, confidence: 1.0 },
        { name: "Operational Duty", value: tenderInfo.operationalDuty, confidence: 1.0 },
        { name: "Power Rating & Supply", value: tenderInfo.powerRating, confidence: 1.0 },
        { name: "Operating Head", value: tenderInfo.headRange, confidence: 1.0 },
        { name: "Discharge Capacity", value: tenderInfo.dischargeCapacity, confidence: 1.0 },
        { name: "Enclosure & Material", value: tenderInfo.materialEnclosure, confidence: 1.0 },
        { name: "Warranty Duration", value: `${tenderInfo.warrantyMonths} Months`, confidence: 1.0 },
        ...(tenderInfo.customSpecs?.map((cs) => ({
          name: cs.name,
          value: cs.value,
          confidence: 1.0,
        })) || []),
      ];

      const contextString = `Procurement under GFR 2017 Rule 144 for ${tenderInfo.department}. Consignee: ${tenderInfo.consigneeLocation}. Delivery: ${tenderInfo.deliveryPeriodDays} days. Inspection: ${tenderInfo.inspectionAgency}.`;

      const specResponse = await generateSpecification({
        product: analysis.understanding.product || "Industrial Procurement Item",
        requirements: compositeReqs,
        selected_standards: selectedCodes,
        context: contextString,
      });

      const chosenStandards = analysis.recommended_standards.filter((s) =>
        selectedCodes.includes(s.standard_number)
      );

      const hash = await computeSha256(
        `${specResponse.clause || specResponse.specification_text || ""}|${tenderInfo.tenderTitle}|${chosenStandards.map((s) => s.standard_number).join(",")}`
      );

      const refNo = `GEM/2026/B/${Math.floor(100000 + Math.random() * 900000)}`;
      const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const fullDoc: TenderDocumentModel = {
        tenderRefNo: refNo,
        generatedDate: today,
        productName: analysis.understanding.product,
        productCategory: analysis.understanding.product_category,
        quantity: detectedQuantity,
        understanding: analysis.understanding,
        selectedStandards: chosenStandards,
        relatedStandards: analysis.related_standards || [],
        complianceChecks: analysis.compliance || [],
        additionalInfo: tenderInfo,
        specification: specResponse,
        sha256Hash: hash,
      };

      setFinalDoc(fullDoc);
      setShowDocModal(true);
    } catch (err) {
      setSpecError(
        err instanceof ApiError ? err.message : "Failed to generate tender specification with Groq."
      );
    } finally {
      setSpecLoading(false);
    }
  };

  const handleResetAll = () => {
    setAnalysis(null);
    setSelectedCodes([]);
    setPromptText("");
    setPendingFile(null);
    setFinalDoc(null);
    setShowDocModal(false);
    setActiveStep("intake");
    setAnalyzeError(null);
    setSpecError(null);
  };

  const primaryStandard =
    analysis?.recommended_standards.find((s) => s.match_type === "primary") ??
    analysis?.recommended_standards[0] ??
    null;

  return (
    <div className="min-h-screen bg-gov-blue-bg text-gov-text flex flex-col">
      {/* ===== Top Government-style Header Bar ===== */}
      <header className="sticky top-0 z-40 bg-gov-navy px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
            <Shield className="h-6 w-6 text-gov-orange" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                IS-Assist <span className="font-light text-white/70 text-sm hidden sm:inline">| Bureau of Indian Standards &amp; GeM Portal</span>
              </h1>
              <span className="rounded bg-gov-orange px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                SIH 2026 • PS-26108
              </span>
            </div>
            <p className="text-xs text-white/70">
              Government of India Procurement Compliance Engine • GFR 2017 Rule 144
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analysis && activeTab === "tender" && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Procurement</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            {backendStatus === "online" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gov-green/20 border border-gov-green/40 px-3 py-1 text-xs font-semibold text-gov-green">
                <Wifi className="h-3.5 w-3.5" /> Backend Online (:8000)
              </span>
            )}
            {backendStatus === "offline" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gov-red/20 border border-gov-red/40 px-3 py-1 text-xs font-semibold text-gov-red">
                <WifiOff className="h-3.5 w-3.5" /> Backend Offline (:8000)
              </span>
            )}
            {backendStatus === "checking" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ping...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ===== Indian Tricolour Accent Line ===== */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* ===== High-Visibility Primary Navigation Tabs ===== */}
      <nav className="sticky top-[61px] z-30 bg-white border-b border-gray-200 px-4 sm:px-8 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tender")}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition ${
                activeTab === "tender"
                  ? "border-gov-blue text-gov-blue bg-gov-blue-bg/40"
                  : "border-transparent text-gov-text-secondary hover:text-gov-navy hover:bg-gray-50"
              }`}
            >
              <Sparkles className="h-4 w-4 text-gov-orange" />
              <span>GeM Tender Formulator &amp; AI Engine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition ${
                activeTab === "database"
                  ? "border-gov-blue text-gov-blue bg-gov-blue-bg/40"
                  : "border-transparent text-gov-text-secondary hover:text-gov-navy hover:bg-gray-50"
              }`}
            >
              <Database className="h-4 w-4 text-gov-blue" />
              <span>BIS Standards &amp; Rules Knowledge Base</span>
              <span className="rounded-full bg-gov-blue/15 border border-gov-blue/30 text-gov-blue px-2.5 py-0.5 text-xs font-black">
                {dbStandards.length > 0 ? dbStandards.length : "10"} Codes
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-gov-text-secondary py-2">
            <span className="inline-flex items-center gap-1 font-semibold text-gov-navy">
              <Shield className="h-3.5 w-3.5 text-gov-blue" /> National Standards Database Active
            </span>
            <span>•</span>
            <span>ChromaDB Vector Retrieval</span>
            <span>•</span>
            <span className="text-gov-green font-semibold">Ready for Tender Generation</span>
          </div>
        </div>
      </nav>

      {/* ===== Stepper Progress Bar (when in Tender workflow & analysis exists) ===== */}
      {activeTab === "tender" && analysis && (
        <div className="border-b border-gray-200 bg-white px-4 sm:px-8 py-3 shadow-xs">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveStep("intake")}
              className={`flex items-center gap-2.5 font-bold transition ${
                activeStep === "intake"
                  ? "text-gov-blue"
                  : "text-gov-text-secondary hover:text-gov-text"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  activeStep === "intake"
                    ? "bg-gov-blue text-white shadow-sm"
                    : "bg-gray-200 text-gov-text-secondary"
                }`}
              >
                1
              </span>
              <span>1. Requisition Prompt</span>
            </button>

            <span className="text-gray-300 font-bold">→</span>

            <button
              type="button"
              onClick={() => setActiveStep("standards")}
              className={`flex items-center gap-2.5 font-bold transition ${
                activeStep === "standards"
                  ? "text-gov-blue"
                  : "text-gov-text-secondary hover:text-gov-text"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  activeStep === "standards"
                    ? "bg-gov-blue text-white shadow-sm"
                    : "bg-gray-200 text-gov-text-secondary"
                }`}
              >
                2
              </span>
              <span>2. Standards Matrix ({selectedCodes.length} selected)</span>
            </button>

            <span className="text-gray-300 font-bold">→</span>

            <button
              type="button"
              onClick={() => setActiveStep("questionnaire")}
              className={`flex items-center gap-2.5 font-bold transition ${
                activeStep === "questionnaire"
                  ? "text-gov-blue"
                  : "text-gov-text-secondary hover:text-gov-text"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  activeStep === "questionnaire"
                    ? "bg-gov-blue text-white shadow-sm"
                    : "bg-gray-200 text-gov-text-secondary"
                }`}
              >
                3
              </span>
              <span>3. Tender Terms &amp; Refinement</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== Main Content Container (Full-Page Expansive Layout) ===== */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        {/* ================================================================ */}
        {/* TAB 2: DEDICATED FULL-PAGE BIS STANDARDS DATABASE DASHBOARD      */}
        {/* ================================================================ */}
        {activeTab === "database" && (
          <StandardsDashboard onFormulateTender={handleFormulateFromStandard} />
        )}

        {/* ================================================================ */}
        {/* TAB 1, STEP 1: Intake & Expansive Procurement Screen              */}
        {/* ================================================================ */}
        {activeTab === "tender" && (!analysis || activeStep === "intake") && (
          <div className="space-y-6">
            {/* Grand Full-Width Hero Banner */}
            <div className="rounded-xl bg-gradient-to-r from-gov-navy via-gov-navy-light to-[#0e3b4f] p-8 sm:p-10 text-white shadow-xl border border-white/10">
              <div className="max-w-4xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-bold text-gov-orange">
                    <Shield className="h-3.5 w-3.5" /> Bureau of Indian Standards (BIS) Smart Engine
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
                    ChromaDB Vector Retrieval • Groq Llama 3.3 70B
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Identify Applicable Indian Standards &amp; Formulate GeM Tenders
                </h2>

                <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-3xl">
                  State your procurement requirement or attach a GeM tender document. The engine automatically extracts technical specs, discovers mandatory BIS standards from the database, guides buyer refinement, and outputs legally compliant tender schedules.
                </p>

                {/* Quick Prompts Chips */}
                <div className="pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Quick Sample Requirements:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {PROMPT_CHIPS.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleChipClick(chip.prompt)}
                        disabled={analyzeLoading}
                        className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                          chip.highlight
                            ? "bg-gov-orange text-white hover:bg-[#e09520] ring-2 ring-white/20"
                            : "bg-white/15 text-white border border-white/20 hover:bg-white/25"
                        }`}
                      >
                        <span>{chip.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-1 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Expansive Form & Database Spotlight Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Requirement Form & PDF Upload (8 cols) */}
              <div className="lg:col-span-8 gov-card space-y-5 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider text-gov-navy flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gov-blue" />
                    Enter Procurement Requisition Prompt
                  </label>
                  {pendingFile && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gov-green/10 border border-gov-green/30 px-3 py-1 text-xs font-semibold text-gov-green">
                      <FileCheck className="h-4 w-4" /> PDF Attached: {pendingFile.name}
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="ml-1 text-gov-text-secondary hover:text-gov-red"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>

                <textarea
                  rows={5}
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    if (pendingFile) setPendingFile(null);
                    if (analyzeError) setAnalyzeError(null);
                  }}
                  placeholder="e.g. I want 50 pumps for agricultural irrigation and continuous municipal water supply with 3-phase 415V power, high energy efficiency (IE3), and IP55 enclosure protection..."
                  className="gov-input text-base leading-relaxed p-4 resize-none"
                />

                {/* PDF Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === "application/pdf") {
                      setPendingFile(file);
                      setPromptText("");
                      setAnalyzeError(null);
                    } else {
                      setAnalyzeError("Please upload a valid PDF document.");
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-gov-blue bg-gov-blue-bg"
                      : "border-gray-300 bg-gov-gray hover:border-gov-blue hover:bg-gov-blue-bg/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFile(file);
                        setPromptText("");
                        setAnalyzeError(null);
                      }
                    }}
                  />
                  <div className="h-12 w-12 rounded-full bg-gov-blue/10 flex items-center justify-center text-gov-blue mb-2">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-gov-navy">
                    Drag &amp; drop GeM tender PDF, or <span className="text-gov-blue underline">browse local files</span>
                  </p>
                  <p className="text-xs text-gov-text-secondary mt-1">
                    Directly parses specifications, technical parameters, and testing criteria from PDF
                  </p>
                </div>

                {analyzeError && (
                  <div className="rounded-xl border border-gov-red/30 bg-gov-red/5 p-4 text-xs font-semibold text-gov-red flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{analyzeError}</span>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunAnalysis()}
                    disabled={analyzeLoading || (!promptText.trim() && !pendingFile)}
                    className="gov-btn-primary px-6 py-3 text-base shadow-md"
                  >
                    {analyzeLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Querying ChromaDB &amp; Analyzing Requirements...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 fill-white" />
                        <span>Analyze &amp; Identify Applicable Standards</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Database Standards Quick Spotlight (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="gov-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gov-blue" />
                      <h3 className="text-sm font-bold text-gov-navy">
                        Loaded Database Standards ({dbStandards.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("database")}
                      className="text-xs font-bold text-gov-blue hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  <p className="text-xs text-gov-text-secondary leading-relaxed">
                    The ChromaDB vector index is primed with verified Indian Standards. Click any code below to instantly test tender formulation:
                  </p>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {dbStandards.slice(0, 5).map((std) => (
                      <div
                        key={std.standard_number}
                        onClick={() => handleFormulateFromStandard(std)}
                        className="group rounded-lg border border-gray-200 bg-gov-gray/60 p-3 hover:bg-gov-blue-bg/50 hover:border-gov-blue cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-gov-navy group-hover:text-gov-blue">
                            {std.standard_number}
                          </span>
                          <span className="rounded bg-gov-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-gov-blue">
                            {std.category}
                          </span>
                        </div>
                        <p className="text-xs text-gov-text font-medium line-clamp-1">
                          {std.title}
                        </p>
                        <p className="text-[11px] text-gov-text-secondary mt-1 flex items-center gap-1 group-hover:text-gov-blue">
                          <span>Click to formulate tender</span>
                          <ArrowRight className="h-3 w-3" />
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("database")}
                    className="w-full gov-btn-secondary text-xs justify-center py-2.5"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Open BIS Rules Explorer Dashboard
                  </button>
                </div>

                <div className="rounded-xl border border-gov-blue/30 bg-gov-blue-bg/70 p-4 text-xs space-y-1.5 text-gov-text">
                  <p className="font-bold text-gov-navy flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-gov-blue" />
                    GFR 2017 Rule 144 Compliant
                  </p>
                  <p className="text-[11px] text-gov-text-secondary leading-relaxed">
                    Mandates that all technical specifications for goods and services in public procurement must conform to national Indian Standards formulated by BIS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 1, STEP 2: Extension Parity & Standards View                 */}
        {/* ================================================================ */}
        {activeTab === "tender" && analysis && activeStep === "standards" && (
          <div className="space-y-6">
            {/* Main Extension-Parity Intelligence Display */}
            <ExtensionResultsView
              analysis={analysis}
              selectedStandards={selectedCodes}
              onToggleStandard={toggleStandard}
              onSelectAllStandards={selectAllStandards}
              showGraph={showGraph}
              onToggleGraph={() => setShowGraph((prev) => !prev)}
            />

            {/* Interactive Knowledge Graph Drawer/Card */}
            {showGraph && primaryStandard && (
              <div className="gov-card">
                <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gov-text flex items-center gap-2">
                      <Network className="h-4 w-4 text-gov-blue" />
                      Standards Dependency Graph
                    </h3>
                    <p className="text-xs text-gov-text-secondary">
                      Visualizing normative relationships for {primaryStandard.standard_number}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGraph(false)}
                    className="text-xs text-gov-text-secondary hover:text-gov-text"
                  >
                    Close Graph ✕
                  </button>
                </div>
                <div className="h-[460px] w-full rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <KnowledgeGraph
                    primaryStandard={primaryStandard}
                    relatedStandards={analysis.related_standards || []}
                  />
                </div>
              </div>
            )}

            {/* Bottom Floating Step Transition Bar */}
            <div className="sticky bottom-4 z-20 rounded-xl border border-gov-blue/40 bg-white p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gov-blue/15 text-gov-blue font-black text-base">
                  {selectedCodes.length}
                </div>
                <div>
                  <p className="text-sm font-bold text-gov-navy">
                    {selectedCodes.length} Indian Standard(s) Selected for Procurement
                  </p>
                  <p className="text-xs text-gov-text-secondary">
                    Next step: Provide delivery terms, operating parameters &amp; GFR compliance to formulate the GeM tender.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep("intake")}
                  className="gov-btn-secondary text-xs py-2.5 px-4"
                >
                  Edit Requirement
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep("questionnaire")}
                  disabled={selectedCodes.length === 0}
                  className="gov-btn-accent text-xs py-2.5 px-5"
                >
                  <span>Continue to Tender Formulation (Add More Info)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 1, STEP 3: Guided Questionnaire ("More Info")                */}
        {/* ================================================================ */}
        {activeTab === "tender" && analysis && activeStep === "questionnaire" && (
          <TenderQuestionnaire
            understanding={analysis.understanding}
            selectedStandards={analysis.recommended_standards.filter((s) =>
              selectedCodes.includes(s.standard_number)
            )}
            info={tenderInfo}
            onChangeInfo={setTenderInfo}
            onGenerate={handleGenerateTender}
            onBack={() => setActiveStep("standards")}
            isGenerating={specLoading}
            error={specError}
          />
        )}
      </main>

      {/* ===== Government Footer ===== */}
      <footer className="border-t border-gray-200 bg-gov-navy px-6 py-4 text-center mt-auto">
        <p className="text-xs text-white/70">
          "Safer Products for a Stronger India" — Inspired by GeM &amp; Bureau of Indian Standards | Built for a Compliant Tomorrow
        </p>
      </footer>

      {/* ================================================================ */}
      {/* FINAL STEP: Tender Specification & PDF Download Modal            */}
      {/* ================================================================ */}
      {showDocModal && finalDoc && (
        <TenderPreviewModal
          document={finalDoc}
          onClose={() => setShowDocModal(false)}
          onReset={handleResetAll}
        />
      )}
    </div>
  );
}
