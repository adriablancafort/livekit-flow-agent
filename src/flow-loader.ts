import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { flowConfigSchema } from '@/flow-schemas';
import type { FlowConfig, FlowEdge, FlowGraph, FlowNode } from '@/flow-types';

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

  for (const node of config.nodes) {
    let flowNode: FlowNode;

    if (node.type === 'start') {
      flowNode = {
        type: node.type,
        name: node.data.name,
        instructions: node.data.instructions,
        outgoingEdges: [],
      };
    } else if (node.type === 'conversation') {
      flowNode = {
        type: node.type,
        name: node.data.name,
        instructions: node.data.instructions,
        outgoingEdges: [],
      };
    } else {
      flowNode = {
        type: node.type,
        name: node.data.name,
        outgoingEdges: [],
      };
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

    nodesById.get(edge.source)!.outgoingEdges.push(flowEdge);
  }

  const startNodeId = config.nodes.find((node) => node.type === 'start')!.id;
  const startNode = nodesById.get(startNodeId)!;

  return {
    globalPrompt: config.globalPrompt,
    startNode,
  } as FlowGraph;
}
