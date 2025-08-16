import { Server } from "socket.io";
import { InMemoryRoomRepository } from "../db/InMemoryRoomRepository";
import { SetPlayerReady } from "../../app/rooms/SetPlayerReady";
import { AssignHeroStats } from "../../app/rooms/AssignHeroStats";
import { BattleService } from "../../app/services/BattleService";

const repo = InMemoryRoomRepository.getInstance();
const setReady = new SetPlayerReady(repo);
const assignStats = new AssignHeroStats(repo);
const battleService = new BattleService(repo);

export function setupRoomSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log(`Client connected ${socket.id}`);
    socket.on("joinRoom", ({ roomId, player }) => {
      socket.join(roomId);
      io.to(roomId).emit("playerJoined", player);
    });

    socket.on("playerReady", ({ roomId, playerId, team }) => {
      try {
        const allReady = setReady.execute(roomId, playerId, team);
        io.to(roomId).emit("playerReady", { playerId });

        if (allReady) {
          io.to(roomId).emit("allReady", { message: "All players ready, preparing battle..." });
          battleService.createBattleFromRoom(roomId);
        }
      } catch (err: any) {
        socket.emit("error", { error: err.message });
      }
    });

    socket.on("setHeroStats", ({ roomId, playerId, stats }) => {
      try {
        assignStats.execute(roomId, playerId, stats);
        io.to(roomId).emit("heroStatsSet", { playerId, stats });
      } catch (err: any) {
        socket.emit("error", { error: err.message });
      }
    });
  });
}
