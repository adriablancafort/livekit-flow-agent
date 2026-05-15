import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { loadAgentConfig } from '@/json-loader';
import { buildFlowGraph } from '@/flow-builder';
import { FlowAgent } from '@/flow-agent';
import type { TurnDetectionConfig } from '@/types';

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
    const agentConfig = await loadAgentConfig(FLOW_CONFIG_PATH);
    const flowGraph = buildFlowGraph(agentConfig);

    const session = new voice.AgentSession({
      stt: new inference.STT(agentConfig.stt),
      llm: new inference.LLM(agentConfig.llm),
      tts: new inference.TTS(agentConfig.tts),
      vad: ctx.proc.userData.vad,
      turnDetection: createTurnDetection(agentConfig.turnDetection),
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
