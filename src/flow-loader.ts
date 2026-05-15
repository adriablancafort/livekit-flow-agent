import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { flowConfigSchema } from '@/flow-schemas';
import type { FlowConfig, FlowConversationNode, FlowEdge, FlowGraph, FlowNode } from '@/flow-types';

export async function loadFlowConfig(configPath: string) {
  const fullPath = resolve(process.cwd(), configPath);
  const raw = await readFile(fullPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return flowConfigSchema.parse(parsed);
}

function buildTransitionToolName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');
}

export function buildFlowGraph(config: FlowConfig) {
  const nodesById = new Map<string, FlowNode>();
  let startNode: FlowConversationNode | undefined;

  for (const node of config.nodes) {
    let flowNode: FlowNode;

    if (node.type === 'conversation') {
      flowNode = {
        type: node.type,
        name: node.data.name,
        instructions: node.data.instructions,
        outgoingEdges: [],
      };

      if (node.data.startSpeaker) {
        flowNode.startSpeaker = node.data.startSpeaker;
      }

      if (node.data.isStart) {
        flowNode.isStart = true;
        startNode = flowNode;
      }
    } else if (node.type === 'end') {
      flowNode = {
        type: node.type,
        name: node.data.name,
      };
    } else {
      throw new Error("Unsupported node type");
    }

    nodesById.set(node.id, flowNode);
  }

  for (const edge of config.edges) {
    const targetNode = nodesById.get(edge.target)!;
    const transitionToolName = buildTransitionToolName(targetNode.name);

    const flowEdge: FlowEdge = {
      targetNode,
      condition: edge.data.condition,
      transitionToolName,
    };

    const sourceNode = nodesById.get(edge.source)!;
    if (sourceNode.type === 'conversation') {
      sourceNode.outgoingEdges.push(flowEdge);
    }
  }

  return {
    globalPrompt: config.globalPrompt,
    sessionConfig: config.sessionConfig,
    startNode,
  } as FlowGraph;
}
