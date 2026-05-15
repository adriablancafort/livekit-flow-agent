import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { FlowAgent } from '@/flow-agent';
import { buildFlowGraph, loadFlowConfig } from '@/flow-loader';
import type { TurnDetectionConfig } from '@/flow-types';

dotenv.config({ path: '.env.local' });

const FLOW_CONFIG_PATH = process.env.FLOW_CONFIG ?? 'agent-config.json';

interface ProcessUserData {
  vad: silero.VAD;
}

function createTurnDetection(config: TurnDetectionConfig) {
  switch (config.model) {
    case 'multilingual':
      return new livekit.turnDetector.MultilingualModel();
    case 'english':
      return new livekit.turnDetector.EnglishModel();
  }
}

export default defineAgent<ProcessUserData>({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    const config = await loadFlowConfig(FLOW_CONFIG_PATH);
    const flowGraph = buildFlowGraph(config);

    const session = new voice.AgentSession({
      stt: new inference.STT(flowGraph.sessionConfig.stt),
      llm: new inference.LLM(flowGraph.sessionConfig.llm),
      tts: new inference.TTS(flowGraph.sessionConfig.tts),
      vad: ctx.proc.userData.vad,
      turnDetection: createTurnDetection(flowGraph.sessionConfig.turnDetection),
    });

    await session.start({
      agent: new FlowAgent(flowGraph),
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
