import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { FlowAgent } from '@/flow-agent';
import { buildFlowGraph, loadFlowConfig } from '@/flow-loader';
import type { FlowGraph } from '@/flow-types';

dotenv.config({ path: '.env.local' });

const FLOW_CONFIG_PATH = process.env.FLOW_CONFIG ?? 'agent-config.json';

interface ProcessUserData {
  vad: silero.VAD;
  flowGraph: FlowGraph;
}

export default defineAgent<ProcessUserData>({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
    const config = await loadFlowConfig(FLOW_CONFIG_PATH);
    proc.userData.flowGraph = buildFlowGraph(config);
  },
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: 'deepgram/nova-3',
        language: 'multi',
      }),

      llm: new inference.LLM({
        model: 'openai/gpt-5.2-chat-latest',
      }),

      tts: new inference.TTS({
        model: 'cartesia/sonic-3',
        voice: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
      }),

      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad,
    });

    await session.start({
      agent: new FlowAgent(ctx.proc.userData.flowGraph),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: audioEnhancement({ model: 'quailVfL' }),
      },
    });

    await ctx.connect();
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
  }),
);
