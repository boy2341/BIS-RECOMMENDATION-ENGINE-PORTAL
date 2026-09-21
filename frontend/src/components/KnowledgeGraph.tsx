// src/components/KnowledgeGraph.tsx
// Primary recommended standard as hub, related_standards radiating as spokes.

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  BackgroundVariant,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ShieldCheck, FlaskConical, Link2 } from "lucide-react";
import type {
  RecommendedStandard,
  RelatedStandard,
  StandardNodeData,
} from "../types/api";
import { buildGraphFromStandard } from "../types/api";

interface KnowledgeGraphProps {
  primaryStandard: RecommendedStandard | null;
  relatedStandards: RelatedStandard[];
}

function StandardNode({ data }: NodeProps) {
  const nodeData = data as StandardNodeData;
  const isPrimary = nodeData.kind === "primary";

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 shadow-sm min-w-[190px] max-w-[220px]",
        isPrimary
          ? "bg-[#08212D] border-[#1688C9] text-white ring-2 ring-[#1688C9]/40"
          : "bg-[#E8F4FA] border-[#F5A623] text-[#17232B]",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />

      <div className="flex items-center gap-1.5 mb-1">
        {isPrimary ? (
          <ShieldCheck size={14} className="text-[#1688C9] shrink-0" />
        ) : (
          <FlaskConical size={14} className="text-[#F5A623] shrink-0" />
        )}
        <span
          className={[
            "text-[10px] font-medium tracking-wide",
            isPrimary ? "text-[#1688C9]" : "text-[#F5A623]",
          ].join(" ")}
        >
          {isPrimary ? "Primary standard" : nodeData.relationship || "Related standard"}
        </span>
      </div>

      <p
        className={[
          "text-sm font-semibold leading-snug",
          isPrimary ? "text-white" : "text-[#17232B]",
        ].join(" ")}
      >
        {nodeData.standard_number}
      </p>
      <p
        className={[
          "text-xs leading-snug mt-0.5 line-clamp-2",
          isPrimary ? "text-white/70" : "text-[#56636D]",
        ].join(" ")}
      >
        {nodeData.title}
      </p>

      {isPrimary && typeof nodeData.relevance_score === "number" && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1688C9]/20 text-[#1688C9] font-mono">
            score {nodeData.relevance_score.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { standardNode: StandardNode };

export default function KnowledgeGraph({
  primaryStandard,
  relatedStandards,
}: KnowledgeGraphProps) {
  const { nodes, edges } = useMemo(() => {
    if (!primaryStandard) return { nodes: [], edges: [] };
    return buildGraphFromStandard(primaryStandard, relatedStandards);
  }, [primaryStandard, relatedStandards]);

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        style: { stroke: "#1688C9", strokeWidth: 1.5 },
        labelStyle: { fill: "#17232B", fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
      })),
    [edges]
  );

  const onInit = useCallback(() => {
    // reserved for future analytics/telemetry hook
  }, []);

  if (!primaryStandard) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[360px] rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <Link2 size={28} className="mb-2 opacity-60" />
        <p className="text-sm font-medium text-slate-500">
          Knowledge graph will render here
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Run a compliance analysis to map related standards
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[420px] rounded-xl border border-slate-200 bg-white overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) =>
            (n.data as StandardNodeData)?.kind === "primary" ? "#08212D" : "#F5A623"
          }
          maskColor="rgba(241, 245, 249, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
