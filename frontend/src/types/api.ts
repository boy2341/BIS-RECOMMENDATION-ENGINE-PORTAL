// src/types/api.ts
// Fully aligned with FastAPI backend routes (/api/analyze, /api/upload, /api/specification/generate)

export interface AnalyzeRequest {
  text: string;
  top_k: number;
}

export interface ExtractedParameter {
  name: string;
  value: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface UnderstandingBlock {
  product: string;
  product_category: string;
  application?: string;
  language: string;
  confidence: number;
  parameters: ExtractedParameter[];
  keywords: string[];
}

export type MatchType = "primary" | "related" | "test" | "safety" | "installation" | "reference" | string;

export interface RecommendedStandard {
  standard_number: string;
  title: string;
  year?: number | string;
  relevance_score: number;
  match_type: MatchType;
  rationale: string;
  status?: string;
  amendment?: string | null;
  source_url?: string | null;
}

export interface RelatedStandard {
  standard_number: string;
  title: string;
  relationship: string;
  source_url?: string | null;
}

export type ComplianceStatus = "verify" | "applicable" | "not-applicable" | "unknown" | string;

export interface ComplianceItem {
  item: string;
  status: ComplianceStatus;
  note: string;
}

export interface ExplanationBlock {
  summary: string;
  primary_reason?: string;
  matching_factors?: string[];
  caution?: string;
  [key: string]: unknown;
}

export interface AnalysisAiMeta {
  provider: string;
  model: string;
  llm_enabled?: boolean;
  retrieval?: string;
  grounding?: string;
  [key: string]: unknown;
}

export interface AnalysisResponse {
  understanding: UnderstandingBlock;
  recommended_standards: RecommendedStandard[];
  related_standards: RelatedStandard[];
  compliance: ComplianceItem[];
  explanation: ExplanationBlock;
  procurement_checklist: string[];
  ai: AnalysisAiMeta;
}

export interface UploadResponse {
  filename: string;
  extracted_characters: number;
  result: AnalysisResponse;
}

export interface GenerateSpecificationRequest {
  product: string;
  requirements: ExtractedParameter[];
  selected_standards: string[];
  context: string;
}

export interface GenerateSpecificationResponse {
  title: string;
  clause: string;
  specification_text?: string;
  required_fields: string[];
  notes: string[];
  verification_notes?: string[];
  product?: string;
  selected_standards?: string[];
  generated_at?: string;
  ai: {
    provider: string;
    model: string;
    grounded: boolean;
    [key: string]: unknown;
  };
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down" | string;
  version?: string;
  uptime_seconds?: number;
  groq?: boolean;
  chroma?: boolean;
  standards_count?: number;
  [key: string]: unknown;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  detail?: unknown;
}

// ---------------------------------------------------------------------------
// Additional Information & Tender Document Models for Guided Refinement & PDF
// ---------------------------------------------------------------------------

export interface TenderAdditionalInfo {
  tenderTitle: string;
  department: string;
  consigneeLocation: string;
  deliveryPeriodDays: number;
  warrantyMonths: number;
  inspectionAgency: string;
  estimatedBudget: string;
  operationalDuty: string;
  powerRating: string;
  headRange: string;
  dischargeCapacity: string;
  materialEnclosure: string;
  qualityStandardClause: string;
  makeInIndiaClause: boolean;
  msmePreference: boolean;
  customSpecs: Array<{ name: string; value: string }>;
}

export interface TenderDocumentModel {
  tenderRefNo: string;
  generatedDate: string;
  productName: string;
  productCategory: string;
  quantity: string | number;
  understanding: UnderstandingBlock;
  selectedStandards: RecommendedStandard[];
  relatedStandards: RelatedStandard[];
  complianceChecks: ComplianceItem[];
  additionalInfo: TenderAdditionalInfo;
  specification: GenerateSpecificationResponse;
  sha256Hash: string;
}

// ---------------------------------------------------------------------------
// @xyflow/react Node / Edge converter types
// ---------------------------------------------------------------------------

export type GraphNodeKind = "primary" | "normative";

export interface StandardNodeData extends Record<string, unknown> {
  kind: GraphNodeKind;
  standard_number: string;
  title: string;
  relationship?: string;
  relevance_score?: number;
  match_type?: MatchType;
}

export interface StandardGraphNode {
  id: string;
  type: "standardNode";
  position: { x: number; y: number };
  data: StandardNodeData;
}

export interface StandardGraphEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  label?: string;
  style?: React.CSSProperties;
}

export function buildGraphFromStandard(
  primary: RecommendedStandard,
  related: RelatedStandard[]
): { nodes: StandardGraphNode[]; edges: StandardGraphEdge[] } {
  const centerX = 400;
  const centerY = 300;
  const radius = 260;

  const nodes: StandardGraphNode[] = [
    {
      id: `primary-${primary.standard_number}`,
      type: "standardNode",
      position: { x: centerX, y: centerY },
      data: {
        kind: "primary",
        standard_number: primary.standard_number,
        title: primary.title,
        relevance_score: primary.relevance_score,
        match_type: primary.match_type,
      },
    },
  ];

  const edges: StandardGraphEdge[] = [];
  const count = Math.max(related.length, 1);

  related.forEach((ref, idx) => {
    const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const nodeId = `ref-${ref.standard_number}-${idx}`;

    nodes.push({
      id: nodeId,
      type: "standardNode",
      position: { x, y },
      data: {
        kind: "normative",
        standard_number: ref.standard_number,
        title: ref.title,
        relationship: ref.relationship,
      },
    });

    edges.push({
      id: `edge-${nodeId}`,
      source: `primary-${primary.standard_number}`,
      target: nodeId,
      animated: true,
      label: ref.relationship,
    });
  });

  return { nodes, edges };
}
