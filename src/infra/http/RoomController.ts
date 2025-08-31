import { Request, Response, Router } from "express";
import { CreateRoom } from "../../app/useCases/rooms/CreateRoom";
import { JoinRoom } from "../../app/useCases/rooms/JoinRoom";
import { LeaveRoom } from "../../app/useCases/rooms/LeaveRoom";
import { GetAllRooms } from "../../app/useCases/rooms/GetAllRooms";
//import RedisRoomRepository from "../db/RedisRoomRepository";
import { InMemoryRoomRepository } from "../db/InMemoryRoomRepository";

const repo = InMemoryRoomRepository.getInstance();
const createRoom = new CreateRoom(repo);
const joinRoom = new JoinRoom(repo);
const leaveRoom = new LeaveRoom(repo);
const getAllRooms = new GetAllRooms(repo);

export const roomRouter = Router();



roomRouter.get("/rooms", async (_req: Request, res: Response) => {
  try {
    const rooms = await getAllRooms.execute();
    res.status(200).json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}); 

roomRouter.post("/rooms", async (req: Request, res: Response) => {
  try {
    const { id, mode, allowAI, credits, heroLevel, ownerId } = req.body;
    const room = createRoom.execute({ id, mode, allowAI, credits, heroLevel, ownerId });
    res.status(201).json({ roomId: room.id, settings: room.settings });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

roomRouter.post("/rooms/:roomId/join", async(req: Request, res: Response) => {
  try {
    const { playerId, heroLevel, heroStats } = req.body;
    const roomId = req.params['roomId'];
    if (!roomId) {
      throw new Error("Parametro 'roomId' es requerido");
    }
    await joinRoom.execute(roomId, { username: playerId, heroLevel, ready: false, heroStats: heroStats });
    res.status(200).json({ message: "Jugador unido" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

roomRouter.post("/rooms/:roomId/leave", async (req: Request, res: Response) => {
  try {
    const roomId = req.params['roomId'];
    const { playerId } = req.body;
    if (!roomId) throw new Error("Missing roomId parameter");
    if (!playerId) throw new Error("Missing playerId in body");

    const closed = await leaveRoom.execute(roomId, playerId);
    res.status(200).json({ message: "Player left", roomClosed: closed });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});