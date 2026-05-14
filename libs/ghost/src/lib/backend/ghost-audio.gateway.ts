import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

/**
 * Gateway WebSocket pour le streaming audio SpiritBox temps réel.
 *
 * Rooms :
 *   spiritbox:player:{deviceId}  — émetteur (la tablette joueur)
 *   spiritbox:admin:{deviceId}   — écouteurs admin pour ce device
 *
 * Events player → server : 'spiritbox:audio-chunk'
 * Events server → admin  : 'spiritbox:audio-chunk'
 */
@WebSocketGateway({
  namespace: '/ghost-audio',
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class GhostAudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket): void {
    const deviceId = client.handshake.query['deviceId'] as string | undefined
    const role = client.handshake.query['role'] as 'player' | 'admin' | undefined

    if (!deviceId || !role) {
      client.disconnect(true)
      return
    }

    const room = `spiritbox:${role}:${deviceId}`
    void client.join(room)
  }

  handleDisconnect(_client: Socket): void {
    // cleanup géré automatiquement par socket.io (leave rooms)
  }

  /**
   * Le joueur envoie un chunk audio binaire ou base64.
   * Le serveur le relaie immédiatement à tous les admins qui écoutent ce device.
   */
  @SubscribeMessage('spiritbox:audio-chunk')
  handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { deviceId: string; chunk: ArrayBuffer | string; mimeType: string }
  ): void {
    const { deviceId, chunk, mimeType } = payload
    if (!deviceId || !chunk) {
      return
    }

    // Relai vers tous les admins connectés sur ce deviceId
    this.server.to(`spiritbox:admin:${deviceId}`).emit('spiritbox:audio-chunk', {
      deviceId,
      chunk,
      mimeType,
    })
  }
}
