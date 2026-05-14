import { RoomServiceClient } from 'livekit-server-sdk';
import { getJobContext } from '@livekit/agents';

export async function endCall() {
  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  );

  const ctx = getJobContext();
  const roomName = ctx.room.name!;
  const [participant] = Array.from(ctx.room.remoteParticipants.values());

  if (participant) {
    await roomService.removeParticipant(roomName, participant.identity);
  }

  ctx.shutdown();
}
