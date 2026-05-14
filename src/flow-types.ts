import type { z } from 'zod';
import type {
  flowConfigSchema,
  flowNodeInstructionsSchema,
} from '@/flow-schemas';

export type FlowNodeInstructions = z.infer<typeof flowNodeInstructionsSchema>;
export type FlowConfig = z.infer<typeof flowConfigSchema>;

// Runtime flow
export interface FlowStartNode {
  type: 'start';
  name: string;
  instructions: FlowNodeInstructions;
  outgoingEdges: FlowEdge[];
}

export interface FlowConversationNode {
  type: 'conversation';
  name: string;
  instructions: FlowNodeInstructions;
  outgoingEdges: FlowEdge[];
}

export interface FlowEndNode {
  type: 'end';
  name: string;
  outgoingEdges: FlowEdge[];
}

export type FlowNode = FlowStartNode | FlowConversationNode | FlowEndNode;

export interface FlowEdge {
  condition: string;
  transitionToolName: string;
  targetNode: FlowNode;
}

export interface FlowGraph {
  globalPrompt?: string;
  startNode: FlowStartNode;
}
