import { Server } from "socket.io";
import { SetPlayerReady } from "../../app/useCases/rooms/SetPlayerReady";
import { AssignHeroStats } from "../../app/useCases/rooms/AssignHeroStats";
import { BattleService } from "../../app/services/BattleService";
import { LeaveRoom } from "../../app/useCases/rooms/LeaveRoom";
import { BattleSocket } from "./BattleSocket";
// import RedisRoomRepository from "../db/RedisRoomRepository";
// import RedisBattleRepository from "../db/RedisBattleRepository";
import { InMemoryRoomRepository } from "../db/InMemoryRoomRepository";
import InMemoryBattleRepository from "../db/InMemoryBattleRepository";

const roomRepo = InMemoryRoomRepository.getInstance();
const battleRepo = InMemoryBattleRepository.getInstance();
const setReady = new SetPlayerReady(roomRepo);
const assignStats = new AssignHeroStats(roomRepo);
const battleService = new BattleService(roomRepo, battleRepo);
const leaveRoom = new LeaveRoom(roomRepo);

export function setupRoomSocket(io: Server) {

  const battleSocket = new BattleSocket(io, battleService);
  
  io.on("connection", (socket) => {

    console.log(`Client connected ${socket.id}`);
    
    socket.on("joinRoom", ({ roomId, player }) => {
      socket.join(roomId);
      io.to(roomId).emit("playerJoined", player);
    });

    socket.on("playerReady", async ({ roomId, playerId, team }) => {
      try {
        const allReady = await setReady.execute(roomId, playerId, team);
        io.to(roomId).emit("playerReady", { playerId });

        if (allReady) {
          io.to(roomId).emit("allReady", { message: "All players ready, preparing battle..." });
          const battle = await battleService.createBattleFromRoom(roomId);
          const sockets = await io.in(roomId).fetchSockets();
          sockets.forEach((remoteSocket) => {
            const realSocket = io.sockets.sockets.get(remoteSocket.id);
            if (realSocket) {
              battleSocket.attachHandlers(realSocket);
            }
          });
          console.log("Battle created, notifying players...");
          io.to(roomId).emit("battleStarted", 
            { 
              message: "Battle has started!",
              turns: battle.turnOrder,
            });
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

     socket.on("leaveRoom", async ({ roomId, playerId }: { roomId: string, playerId: string }) => {
      try {
        socket.leave(roomId);
        io.to(roomId).emit("playerLeft", { playerId });
      } catch (err: any) {
        socket.emit("error", { error: err.message });
      }
    });
  
    socket.on("leaveRoom", async ({ roomId, playerId }: { roomId: string, playerId: string }) => {
      try {
        const closed = await leaveRoom.execute(roomId, playerId);

        socket.leave(roomId);

        io.to(roomId).emit("playerLeft", { playerId, roomClosed: closed });
        if (closed) {
          io.to(roomId).emit("roomClosed", { roomId });
        }
      } catch (err: any) {
        socket.emit("error", { error: err.message });
      }
    });
  });
}
