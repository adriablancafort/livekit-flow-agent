export type FlowNodeType = 'start' | 'conversation' | 'end';

export interface FlowNodeInstructions {
  type: 'prompt' | 'say';
  text: string;
}

export interface FlowNodeConfig {
  id: string;
  type: FlowNodeType;
  data: {
    name: string;
    instructions?: FlowNodeInstructions;
  };
}

export interface FlowEdgeConfig {
  id: string;
  source: string;
  target: string;
  data: {
    condition: string
  };
}

export interface FlowConfig {
  name: string;
  globalPrompt?: string;
  nodes: FlowNodeConfig[];
  edges: FlowEdgeConfig[];
}

// Runtime graph shape
export interface FlowNode {
  type: FlowNodeType;
  name: string;
  instructions?: FlowNodeInstructions;
  outgoingEdges: FlowEdge[];
}

export interface FlowEdge {
  condition: string;
  toolName: string;
  targetNode: FlowNode;
}

export interface FlowGraph {
  globalPrompt?: string;
  startNode: FlowNode;
}
