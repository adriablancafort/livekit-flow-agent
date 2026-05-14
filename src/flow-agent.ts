import { llm, voice } from '@livekit/agents';
import type { FlowGraph, FlowNode } from '@/flow-types';
import { FLOW_INSTRUCTIONS } from '@/prompts';

function buildNodeInstructions(graph: FlowGraph, node: FlowNode): string {
  let nodeInstructions = '';

  if (graph.globalPrompt) {
    nodeInstructions += graph.globalPrompt + '\n\n';
  }

  nodeInstructions += FLOW_INSTRUCTIONS + '\n\n';

  const hasInstructions = node.type === 'start' || node.type === 'conversation';
  if (hasInstructions && node.instructions.type === 'prompt') {
    nodeInstructions += node.instructions.text;
  }

  return nodeInstructions;
}

export class FlowAgent extends voice.Agent {
  private readonly graph: FlowGraph;

  constructor(graph: FlowGraph) {
    super({
      instructions: buildNodeInstructions(graph, graph.startNode),
    });

    this.graph = graph;
    this._tools = this._buildNodeTools(graph.startNode);
  }

  private _buildNodeTools(node: FlowNode): llm.ToolContext {
    return Object.fromEntries(
      node.outgoingEdges.map((edge) => [
        edge.transitionToolName,
        llm.tool({
          description: `Transition to "${edge.targetNode.name}" when: ${edge.condition}`,
          execute: async () => {
            await this._transitionTo(edge.targetNode);
            return `Transitioned to "${edge.targetNode.name}"`;
          },
        }),
      ]),
    );
  }

  private async _transitionTo(node: FlowNode) {
    if (node.type === 'end') {
      this.session.shutdown();
      return;
    }

    this._instructions = buildNodeInstructions(this.graph, node);
    await this.updateTools(this._buildNodeTools(node));

    if (node.instructions.type === 'say') {
      await this.session.say(node.instructions.text);
    }
  }

  override async onEnter() {
    const startNode = this.graph.startNode;

    if (startNode.instructions.type === 'say') {
      await this.session.say(startNode.instructions.text);
    } else {
      await this.session.generateReply();
    }
  }
}
