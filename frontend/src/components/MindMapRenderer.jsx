import { ReactFlow, Background } from "@xyflow/react";
import { useCallback } from "react";
import PropTypes from "prop-types";
import "@xyflow/react/dist/style.css";

// ألوان وهوية مشكاة
const MAIN_COLOR = "#7440E9";
const BRANCH_COLORS = [
  "#34d399", // أخضر
  "#60a5fa", // أزرق
  "#fbbf24", // برتقالي
  "#a78bfa", // بنفسجي
  "#f472b6", // وردي
  "#f87171", // أحمر فاتح
  "#38bdf8", // أزرق سماوي
  "#facc15", // أصفر
];
const SHADOW = "0 6px 24px 0 rgba(116,64,233,0.13)";

// أيقونة العقدة الرئيسية (SVG)
// (تمت إزالة MainNodeIcon)

const BranchIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" fill={color} stroke="#fff" strokeWidth="2" />
  </svg>
);
BranchIcon.propTypes = { color: PropTypes.string.isRequired };

function buildMindMapElements(mindMap) {
  const nodes = [];
  const edges = [];
  // العقدة الرئيسية
  nodes.push({
    id: "root",
    type: "mainNode",
    data: { label: mindMap.node },
    position: { x: 0, y: 0 },
  });
  // توزيع الفروع حول دائرة
  const branchCount = mindMap.branches.length;
  const RADIUS = 220;
  mindMap.branches.forEach((branch, branchIdx) => {
    const angle = (2 * Math.PI * branchIdx) / branchCount - Math.PI / 2;
    const branchColor = BRANCH_COLORS[branchIdx % BRANCH_COLORS.length];
    const bx = RADIUS * Math.cos(angle);
    const by = RADIUS * Math.sin(angle);
    const branchId = `branch-${branchIdx}`;
    nodes.push({
      id: branchId,
      type: "branchNode",
      data: { label: branch.text, color: branchColor },
      position: { x: bx, y: by },
    });
    edges.push({
      id: `e-root-${branchId}`,
      source: "root",
      target: branchId,
      animated: true,
      style: { stroke: branchColor, strokeWidth: 4 },
      type: "bezier",
    });
    // توزيع العقد الفرعية حول كل فرع بشكل متدرج حول الفرع
    const childR = 90;
    branch.children.forEach((child, childIdx) => {
      const childAngle =
        angle + (Math.PI / 8) * (childIdx - (branch.children.length - 1) / 2);
      const cx = bx + childR * Math.cos(childAngle);
      const cy = by + childR * Math.sin(childAngle);
      const childId = `${branchId}-child-${childIdx}`;
      let label =
        typeof child === "string" ? child : `${child.word}: ${child.meaning}`;
      nodes.push({
        id: childId,
        type: "childNode",
        data: { label, color: branchColor },
        position: { x: cx, y: cy },
      });
      edges.push({
        id: `e-${branchId}-${childId}`,
        source: branchId,
        target: childId,
        style: { stroke: branchColor, strokeWidth: 2 },
        type: "bezier",
      });
    });
  });
  return { nodes, edges };
}

// مكونات العقد المخصصة
const MainNode = ({ data }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #ede9fe 60%, #fff 100%)",
      border: `5px solid ${MAIN_COLOR}`,
      boxShadow: SHADOW,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: MAIN_COLOR,
      fontWeight: "bold",
      fontSize: 20,
      textAlign: "center",
      zIndex: 2,
      position: "relative",
    }}
  >
    <span style={{ fontSize: 32, marginBottom: 8 }}>🟣</span>
    <span>{data.label}</span>
  </div>
);
MainNode.propTypes = {
  data: PropTypes.shape({ label: PropTypes.string.isRequired }).isRequired,
};

const BranchNode = ({ data }) => (
  <div
    style={{
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: `linear-gradient(135deg, #fff 60%, ${data.color} 100%)`,
      border: `3px solid ${data.color}`,
      boxShadow: SHADOW,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: data.color,
      fontWeight: "bold",
      fontSize: 15,
      textAlign: "center",
      zIndex: 1,
      position: "relative",
    }}
  >
    {data.label}
  </div>
);
BranchNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
};

const ChildNode = ({ data }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: `linear-gradient(135deg, #fff 60%, ${data.color} 100%)`,
      border: `2px solid ${data.color}`,
      boxShadow: SHADOW,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: data.color,
      fontWeight: "bold",
      fontSize: 11,
      textAlign: "center",
      zIndex: 1,
      position: "relative",
    }}
  >
    {data.label}
  </div>
);
ChildNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
};

const nodeTypes = {
  mainNode: MainNode,
  branchNode: BranchNode,
  childNode: ChildNode,
};

const MindMapRenderer = ({ mindMap }) => {
  const { nodes, edges } = buildMindMapElements(mindMap);
  const defaultViewport = { x: 0, y: 0, zoom: 1 };
  const fitViewOptions = { padding: 0.3 };
  const onNodeDragStop = useCallback(() => {}, []);
  const onConnect = useCallback(() => {}, []);

  return (
    <div
      style={{
        width: "100%",
        height: 540,
        direction: "rtl",
        background: "linear-gradient(120deg, #fff 90%, #f3edff 100%)",
        borderRadius: 32,
        boxShadow: SHADOW,
        padding: 8,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        defaultViewport={defaultViewport}
        panOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#f3edff" gap={24} />
      </ReactFlow>
      <style>{`
        .react-flow__node:hover {
          box-shadow: 0 10px 32px 0 rgba(116,64,233,0.18) !important;
          border-color: #7440E9 !important;
        }
      `}</style>
    </div>
  );
};

MindMapRenderer.propTypes = {
  mindMap: PropTypes.shape({
    node: PropTypes.string.isRequired,
    branches: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        children: PropTypes.array.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default MindMapRenderer;
