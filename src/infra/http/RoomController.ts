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

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Obtiene todas las salas
 *     description: Obtiene todas las salas registradas dentro del servidor
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: Lista de salas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
roomRouter.get("/rooms", async (_req: Request, res: Response) => {
  try {
    const rooms = await getAllRooms.execute();
    res.status(200).json(rooms);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
});

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Crea una nueva sala
 *     description: Crea una nueva sala en el servidor
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               mode:
 *                 type: string
 *               allowAI:
 *                 type: boolean
 *               credits:
 *                 type: integer
 *               heroLevel:
 *                 type: integer
 *               ownerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Detalles de la sala creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
roomRouter.post("/rooms", async (req: Request, res: Response) => {
  try {
    const { id, mode, allowAI, credits, heroLevel, ownerId } = req.body;
    const room = createRoom.execute({
      id,
      mode,
      allowAI,
      credits,
      heroLevel,
      ownerId,
    });
    res.status(201).json({ roomId: room.id, settings: room.settings });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
});

/**
 * @swagger
 * /rooms/{roomId}/join:
 *   post:
 *     summary: Unirse a una sala
 *     description: Permite a un jugador unirse a una sala existente
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sala a la que se desea unir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               heroLevel:
 *                 type: integer
 *               heroStats:
 *                 $ref: '#/components/schemas/HeroStats'
 *     responses:
 *       200:
 *         description: Mensaje de éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
roomRouter.post("/rooms/:roomId/join", async (req: Request, res: Response) => {
  try {
    const { playerId, heroLevel, heroStats } = req.body;
    const roomId = req.params["roomId"];
    if (!roomId) {
      throw new Error("Parametro 'roomId' es requerido");
    }
    await joinRoom.execute(roomId, {
      username: playerId,
      heroLevel,
      ready: false,
      heroStats: heroStats,
    });
    res.status(200).json({ message: "Jugador unido" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: String(error) });
    }
  }
});

/**
 * @swagger
 * /rooms/{roomId}/leave:
 *   post:
 *     summary: Abandonar una sala
 *     description: Permite a un jugador abandonar una sala existente
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sala a la que se desea abandonar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje de éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 roomClosed:
 *                   type: boolean
 */
roomRouter.post("/rooms/:roomId/leave", async (req: Request, res: Response) => {
  try {
    const roomId = req.params["roomId"];
    const { playerId } = req.body;
    if (!roomId) throw new Error("Missing roomId parameter");
    if (!playerId) throw new Error("Missing playerId in body");

    const closed = await leaveRoom.execute(roomId, playerId);
    res.status(200).json({ message: "Player left", roomClosed: closed });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: String(error) });
    }
  }
});
