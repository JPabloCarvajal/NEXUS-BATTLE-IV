// infrastructure/websockets/BattleSocket.ts
import { Server, Socket } from "socket.io";
import { BattleService } from "../../app/services/BattleService";

export class BattleSocket {
  constructor(
    private io: Server,
    private battleService: BattleService
  ) {}

  attachHandlers(socket: Socket) {
    socket.on("submitAction", ({ roomId, action }) => {
      try {
        const result = this.battleService.handleAction(roomId, action);
        // notificar resultado a todos en la sala
        this.io.to(roomId).emit("actionResolved", result);
      } catch (err: any) {
        socket.emit("error", { error: err.message });
      }
    });

    // Ejemplo: abandonar partida
    socket.on("leaveBattle", ({ roomId, playerId }) => {
      this.io.to(roomId).emit("playerLeftBattle", { playerId });
      socket.leave(roomId);
    });
  }
}
