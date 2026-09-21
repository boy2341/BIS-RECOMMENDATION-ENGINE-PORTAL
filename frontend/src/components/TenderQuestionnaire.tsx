// src/components/TenderQuestionnaire.tsx
// Guided procurement questionnaire to collect additional technical, commercial, and consignee details.

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileCheck2,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  RecommendedStandard,
  TenderAdditionalInfo,
  UnderstandingBlock,
} from "../types/api";

interface TenderQuestionnaireProps {
  understanding: UnderstandingBlock;
  selectedStandards: RecommendedStandard[];
  info: TenderAdditionalInfo;
  onChangeInfo: (updated: TenderAdditionalInfo) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
  error: string | null;
}

export default function TenderQuestionnaire({
  understanding,
  selectedStandards,
  info,
  onChangeInfo,
  onGenerate,
  onBack,
  isGenerating,
  error,
}: TenderQuestionnaireProps) {
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomVal, setNewCustomVal] = useState("");

  const updateField = <K extends keyof TenderAdditionalInfo>(
    field: K,
    value: TenderAdditionalInfo[K]
  ) => {
    onChangeInfo({
      ...info,
      [field]: value,
    });
  };

  const handleAddCustomSpec = () => {
    if (!newCustomKey.trim() || !newCustomVal.trim()) return;
    updateField("customSpecs", [
      ...(info.customSpecs || []),
      { name: newCustomKey.trim(), value: newCustomVal.trim() },
    ]);
    setNewCustomKey("");
    setNewCustomVal("");
  };

  const handleRemoveCustomSpec = (index: number) => {
    updateField(
      "customSpecs",
      info.customSpecs.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-lg bg-gov-navy-light p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded bg-gov-orange/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Step 2 of 3: Tender Formulation
            </span>
            <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
              Specify Additional Procurement Details
            </h2>
            <p className="mt-1 text-xs text-white/70 max-w-2xl">
              We extracted initial parameters for{" "}
              <span className="font-semibold text-white">{understanding.product}</span>.
              Provide your delivery terms, operational duty, and inspection conditions to draft the full
              GeM tender specification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Standards
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-gov-red/30 bg-gov-red/5 p-4 text-xs text-gov-red">
          <p className="font-semibold">Generation Error:</p>
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        className="space-y-5"
      >
        {/* Section 1: Procurement & Consignee Particulars */}
        <section className="gov-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gov-text flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Building2 className="h-4 w-4 text-gov-blue" />
            1. Procurement Overview & Consignee Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Official Tender Title
              </label>
              <input
                type="text"
                value={info.tenderTitle}
                onChange={(e) => updateField("tenderTitle", e.target.value)}
                placeholder="e.g. Supply & Commissioning of 50 Water Pumps"
                className="gov-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Procuring Department / Public Agency
              </label>
              <input
                type="text"
                value={info.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="e.g. State Water Supply and Sanitation Department"
                className="gov-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Consignee Delivery Location & PIN
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gov-text-secondary" />
                <input
                  type="text"
                  value={info.consigneeLocation}
                  onChange={(e) => updateField("consigneeLocation", e.target.value)}
                  placeholder="e.g. Central Store Depot, Pune Division (PIN 411001)"
                  className="gov-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Estimated Tender Value (Optional)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gov-text-secondary" />
                <input
                  type="text"
                  value={info.estimatedBudget}
                  onChange={(e) => updateField("estimatedBudget", e.target.value)}
                  placeholder="e.g. ₹ 15,00,000"
                  className="gov-input pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Technical & Operating Parameters */}
        <section className="gov-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gov-text flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Wrench className="h-4 w-4 text-gov-blue" />
            2. Technical & Operational Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Operating Duty / Application
              </label>
              <input
                type="text"
                value={info.operationalDuty}
                onChange={(e) => updateField("operationalDuty", e.target.value)}
                placeholder="e.g. Continuous Duty (S1), Agricultural Irrigation"
                className="gov-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Power Rating & Electrical Supply
              </label>
              <input
                type="text"
                value={info.powerRating}
                onChange={(e) => updateField("powerRating", e.target.value)}
                placeholder="e.g. 3-Phase 415 V, 50 Hz AC, 5.0 HP (3.7 kW)"
                className="gov-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Total Head Range
              </label>
              <input
                type="text"
                value={info.headRange}
                onChange={(e) => updateField("headRange", e.target.value)}
                placeholder="e.g. 20 to 35 meters head"
                className="gov-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Discharge Capacity / Flow Rate
              </label>
              <input
                type="text"
                value={info.dischargeCapacity}
                onChange={(e) => updateField("dischargeCapacity", e.target.value)}
                placeholder="e.g. 10 to 15 Litres/sec"
                className="gov-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Enclosure Protection & Construction Material
              </label>
              <input
                type="text"
                value={info.materialEnclosure}
                onChange={(e) => updateField("materialEnclosure", e.target.value)}
                placeholder="e.g. IP55 ingress protection, Cast Iron casing, Bronze impeller"
                className="gov-input"
              />
            </div>
          </div>

          {/* Custom Specifications list */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs font-semibold text-gov-text mb-2">
              Add Custom Key-Value Parameters
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                placeholder="Parameter Name (e.g. Suction Size)"
                className="gov-input flex-1 min-w-[160px]"
              />
              <input
                type="text"
                value={newCustomVal}
                onChange={(e) => setNewCustomVal(e.target.value)}
                placeholder="Value (e.g. 65 mm NB)"
                className="gov-input flex-1 min-w-[160px]"
              />
              <button
                type="button"
                onClick={handleAddCustomSpec}
                className="gov-btn-secondary text-xs py-2"
              >
                <Plus className="h-4 w-4" /> Add Parameter
              </button>
            </div>

            {info.customSpecs && info.customSpecs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {info.customSpecs.map((cs, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 rounded-lg bg-gov-gray border border-gray-200 px-3 py-1 text-xs text-gov-text"
                  >
                    <span className="font-semibold text-gov-blue">{cs.name}:</span>
                    <span>{cs.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSpec(idx)}
                      className="text-gov-text-secondary hover:text-gov-red"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Commercial Terms, Inspection & Quality Mandates */}
        <section className="gov-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gov-text flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <ShieldCheck className="h-4 w-4 text-gov-blue" />
            3. Quality, Inspection & Delivery Terms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Delivery Schedule (Days)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gov-text-secondary" />
                <input
                  type="number"
                  value={info.deliveryPeriodDays}
                  onChange={(e) => updateField("deliveryPeriodDays", Number(e.target.value))}
                  min={1}
                  className="gov-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Comprehensive Warranty (Months)
              </label>
              <input
                type="number"
                value={info.warrantyMonths}
                onChange={(e) => updateField("warrantyMonths", Number(e.target.value))}
                min={0}
                className="gov-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gov-text mb-1.5">
                Pre-dispatch Inspection Agency
              </label>
              <input
                type="text"
                value={info.inspectionAgency}
                onChange={(e) => updateField("inspectionAgency", e.target.value)}
                placeholder="e.g. BIS-approved lab / RITES / Consignee"
                className="gov-input"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={info.makeInIndiaClause}
                onChange={(e) => updateField("makeInIndiaClause", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gov-blue focus:ring-gov-blue cursor-pointer"
              />
              <span className="text-xs text-gov-text">
                Enforce <strong className="text-gov-navy">Make in India (MII) Preference</strong> — Purchase preference to Class-I and Class-II local suppliers under Public Procurement Order.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={info.msmePreference}
                onChange={(e) => updateField("msmePreference", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gov-blue focus:ring-gov-blue cursor-pointer"
              />
              <span className="text-xs text-gov-text">
                Grant <strong className="text-gov-navy">MSME Benefits</strong> — Exemption from tender fee & EMD requirements as per government policy.
              </span>
            </label>
          </div>
        </section>

        {/* Selected Standards Preview */}
        <div className="rounded-lg border border-gov-blue/20 bg-gov-blue-bg p-4 text-xs text-gov-text flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-gov-blue" />
            <span>
              Tender will mandate{" "}
              <strong className="text-gov-navy">{selectedStandards.length}</strong> selected Indian Standard(s):{" "}
              <span className="text-gov-blue font-semibold">
                {selectedStandards.map((s) => s.standard_number).join(", ") || "None"}
              </span>
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="gov-btn-secondary"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={isGenerating || selectedStandards.length === 0}
            className="gov-btn-accent"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting Tender Specification with Groq...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Generate GeM Tender Specification & PDF
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
