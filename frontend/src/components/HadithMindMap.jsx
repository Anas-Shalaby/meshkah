import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "@xyflow/react";
import dagre from "dagre";
import PropTypes from "prop-types";
import "@xyflow/react/dist/style.css";

const EDGE_COLOR = "rgba(0, 129, 167, 0.7)";
const EDGE_COLOR_HOVER = "rgba(0, 129, 167, 1)";
const SHADOW = "0 6px 24px 0 rgba(0,129,167,0.18)";
const FONT_FAMILY = "'Poppins', 'Inter', sans-serif";
const MAX_NODE_WIDTH = 200;

// تصميم العقدة البيضاوية مع Tooltip
function MindMapNode({ data, selected }) {
  return (
    <div
      style={{
        maxWidth: MAX_NODE_WIDTH,
        minWidth: 80,
        padding: "16px 18px",
        borderRadius: 9999,
        background: "linear-gradient(135deg, #85d8ff 0%, #0081a7 100%)",
        color: "#fff",
        fontWeight: "bold",
        fontSize: data.type === "root" ? 19 : 15,
        fontFamily: FONT_FAMILY,
        textAlign: "center",
        boxShadow: SHADOW,
        border: selected ? "2.5px solid #0081a7" : "2px solid transparent",
        wordBreak: "break-word",
        whiteSpace: "normal",
        lineHeight: 1.7,
        cursor: "pointer",
        transition:
          "box-shadow 0.2s, border 0.2s, background 0.2s, transform 0.2s",
        transform: selected ? "scale(1.08)" : "scale(1)",
        position: "relative",
        zIndex: 2,
      }}
      title={data.tooltip || data.label}
    >
      {data.label}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {selected && data.tooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0081a7",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: SHADOW,
            zIndex: 10,
          }}
        >
          {data.tooltip}
        </div>
      )}
    </div>
  );
}
MindMapNode.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

const nodeTypes = {
  mindMapNode: MindMapNode,
};

// تحويل بيانات JSON إلى nodes وedges
function jsonToElements(mindMap) {
  const nodes = [];
  const edges = [];
  // العقدة الرئيسية
  nodes.push({
    id: "root",
    type: "mindMapNode",
    data: { label: mindMap.node, type: "root", tooltip: "نص الحديث" },
    position: { x: 0, y: 0 },
  });

  mindMap.branches.forEach((branch, branchIdx) => {
    const branchId = `branch-${branchIdx}`;
    nodes.push({
      id: branchId,
      type: "mindMapNode",
      data: { label: branch.text, type: "branch", tooltip: branch.text },
      position: { x: 0, y: 0 },
    });
    edges.push({
      id: `e-root-${branchId}`,
      source: "root",
      target: branchId,
      style: { stroke: EDGE_COLOR, strokeWidth: 3 },
      type: "bezier",
    });

    branch.children.forEach((child, childIdx) => {
      const childId = `${branchId}-child-${childIdx}`;
      let label, tooltip;
      if (typeof child === "string") {
        label = child;
        tooltip = branch.text + ": " + child;
      } else {
        label = child.word;
        tooltip = `${child.word}: ${child.meaning}`;
      }
      nodes.push({
        id: childId,
        type: "mindMapNode",
        data: { label, type: "leaf", tooltip },
        position: { x: 0, y: 0 },
      });
      edges.push({
        id: `e-${branchId}-${childId}`,
        source: branchId,
        target: childId,
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
        type: "bezier",
      });
    });
  });
  return { nodes, edges };
}

// ترتيب العقد تلقائياً باستخدام dagre
function getLayoutedElements(nodes, edges, direction = "LR") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: MAX_NODE_WIDTH, height: 60 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - MAX_NODE_WIDTH / 2,
        y: nodeWithPosition.y - 30,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export default function HadithMindMap({ data }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => jsonToElements(data),
    [data]
  );
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, "LR"),
    [initialNodes, initialEdges]
  );
  const [rfNodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(layoutedEdges);

  // تأثير hover على الحواف (edges)
  const edgeStyles = (edge) => ({
    ...edge.style,
    transition: "stroke 0.2s, stroke-width 0.2s",
  });

  const defaultViewport = { x: 0, y: 0, zoom: 1 };
  const fitViewOptions = { padding: 0.2 };

  return (
    <div
      style={{
        width: "100%",
        height: 700,
        direction: "rtl",
        background: "#f8f9fa",
        borderRadius: 32,
        boxShadow: SHADOW,
        padding: 8,
        position: "relative",
      }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges.map((e) => ({ ...e, style: edgeStyles(e) }))}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        defaultViewport={defaultViewport}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={24} size={1.5} color="#cce6f6" />
      </ReactFlow>
      <style>{`
        .react-flow__node-mindMapNode:hover {
          box-shadow: 0 12px 36px 0 rgba(0,129,167,0.25) !important;
          border-color: #0081a7 !important;
          z-index: 10;
        }
        .react-flow__edge-path:hover {
          stroke: ${EDGE_COLOR_HOVER} !important;
          stroke-width: 4 !important;
        }
      `}</style>
    </div>
  );
}

HadithMindMap.propTypes = {
  data: PropTypes.shape({
    node: PropTypes.string.isRequired,
    branches: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        children: PropTypes.array.isRequired,
      })
    ).isRequired,
  }).isRequired,
};
