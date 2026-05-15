import type { z } from 'zod';
import type {
  agentConfigSchema,
  turnDetectionConfigSchema,
  flowNodeInstructionsSchema,
} from '@/schemas';

export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type TurnDetectionConfig = z.infer<typeof turnDetectionConfigSchema>;
export type FlowNodeInstructions = z.infer<typeof flowNodeInstructionsSchema>;

// Runtime flow
export interface FlowConversationNode {
  type: 'conversation';
  name: string;
  isStart?: true;
  startSpeaker?: 'agent' | 'user';
  instructions: FlowNodeInstructions;
  outgoingEdges: FlowEdge[];
}

export interface FlowEndNode {
  type: 'end';
  name: string;
}

export type FlowNode = FlowConversationNode | FlowEndNode;

export interface FlowEdge {
  condition: string;
  transitionToolName: string;
  targetNode: FlowNode;
}

export interface FlowGraph {
  globalPrompt?: string;
  startNode: FlowConversationNode;
}
