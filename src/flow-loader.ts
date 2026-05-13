import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { flowConfigSchema } from '@/flow-schemas';
import type { FlowConfig, FlowEdge, FlowGraph, FlowNode } from '@/flow-types';

export async function loadFlowConfig(configPath: string) {
  const fullPath = resolve(process.cwd(), configPath);
  const raw = await readFile(fullPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return flowConfigSchema.parse(parsed) as FlowConfig;
}

function buildTransitionToolName(name: string) {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');
  return `transition_to_${normalized}`;
}

export function buildFlowGraph(config: FlowConfig) {
  const nodesById = new Map<string, FlowNode>();
  for (const node of config.nodes) {
    const flowNode: FlowNode = {
      type: node.type,
      name: node.data.name,
      outgoingEdges: [],
    };

    if (node.data.instructions) {
      flowNode.instructions = node.data.instructions;
    }

    nodesById.set(node.id, flowNode);
  }

  for (const edge of config.edges) {
    const targetNode = nodesById.get(edge.target)!;
    const toolName = buildTransitionToolName(targetNode.name);

    const graphEdge: FlowEdge = {
      targetNode,
      condition: edge.data.condition,
      toolName,
    };

    nodesById.get(edge.source)!.outgoingEdges.push(graphEdge);
  }

  const startNode = config.nodes.find((node) => node.type === 'start')!;

  return {
    globalPrompt: config.globalPrompt,
    startNode: nodesById.get(startNode.id)!,
  } as FlowGraph;
}
