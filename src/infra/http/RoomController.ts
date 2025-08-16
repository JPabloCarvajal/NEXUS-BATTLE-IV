import { Request, Response, Router } from "express";
import { CreateRoom } from "../../app/rooms/CreateRoom";
import { JoinRoom } from "../../app/rooms/JoinRoom";
import { InMemoryRoomRepository } from "../db/InMemoryRoomRepository";

const repo = InMemoryRoomRepository.getInstance();
const createRoom = new CreateRoom(repo);
const joinRoom = new JoinRoom(repo);

export const roomRouter = Router();

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
