import { Request, Response, Router } from "express";
import { CreateRoom } from "../../app/useCases/rooms/CreateRoom";
import { JoinRoom } from "../../app/useCases/rooms/JoinRoom";
import { InMemoryRoomRepository } from "../db/InMemoryRoomRepository";
import { LeaveRoom } from "../../app/useCases/rooms/LeaveRoom";
import { GetAllRooms } from "../../app/useCases/rooms/GetAllRooms";

const repo = InMemoryRoomRepository.getInstance();
const createRoom = new CreateRoom(repo);
const joinRoom = new JoinRoom(repo);
const leaveRoom = new LeaveRoom(repo);
const getAllRooms = new GetAllRooms(repo);

export const roomRouter = Router();



roomRouter.get("/rooms", (_req: Request, res: Response) => {
  try {
    const rooms = getAllRooms.execute();
    res.status(200).json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}); 

roomRouter.post("/rooms", (req: Request, res: Response) => {
  try {
    const { id, mode, allowAI, credits, heroLevel, ownerId } = req.body;
    const room = createRoom.execute({ id, mode, allowAI, credits, heroLevel, ownerId });
    res.status(201).json({ roomId: room.id, settings: room.settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

roomRouter.post("/rooms/:roomId/join", (req: Request, res: Response) => {
  try {
    const { playerId, heroLevel, heroStats } = req.body;
    const roomId = req.params['roomId'];
    if (!roomId) {
      throw new Error("Missing roomId parameter");
    }
    joinRoom.execute(roomId, { username: playerId, heroLevel, ready: false, heroStats: heroStats });
    res.status(200).json({ message: "Player joined" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

roomRouter.post("/rooms/:roomId/leave", (req: Request, res: Response) => {
  try {
    const roomId = req.params['roomId'];
    const { playerId } = req.body;
    if (!roomId) throw new Error("Missing roomId parameter");
    if (!playerId) throw new Error("Missing playerId in body");

    const closed = leaveRoom.execute(roomId, playerId);
    res.status(200).json({ message: "Player left", roomClosed: closed });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});