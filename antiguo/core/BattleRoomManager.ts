// import BattleRoom from "../model/battleRoomInterfaces/BattleRoom";
// import { Server, Socket } from "socket.io";
// import { GameMode, RoomState } from "../model/Enums";
// import Player from "../model/battleRoomInterfaces/Player";
// import { randomInt } from "node:crypto";

// /**
//  * BattleRoomManager:
//  * Handles the creation, joining, and leaving of battle rooms.
//  * Ensures rules such as "player must have a hero equipped" are enforced.
//  */
// export default class BattleRoomManager {
//     private battleRooms: BattleRoom[] = [];

//     /**
//      * @param io - The Socket.IO server instance used to emit and listen for events.
//      */
//     constructor(private io: Server) {}

//     /**
//      * Adds a player to an existing battle room if conditions are met:
//      * - Room exists.
//      * - Player has a hero equipped.
//      * - There are available slots in the room.
//      *
//      * @param socket - The client's socket instance.
//      * @param battleRoomId - The ID of the room to join.
//      * @param player - The player attempting to join.
//      */
//     public joinBattleRoom(socket: Socket, battleRoomId: string, player: Player): void {
//         const battleRoom = this.battleRooms.find(r => r.id === battleRoomId);

//         if (battleRoom && player.selectedHero !== undefined) {
//             const availableParticipants: number = battleRoom.maxPlayers - battleRoom.participants.length;
//             if (availableParticipants > 0) {
//                 if (!battleRoom.participants.includes(player)) {
//                     battleRoom.participants.push(player);
//                 }
//                 socket.join(battleRoomId);
//                 this.io.to(battleRoomId).emit("message", `${player.name} joined room "${battleRoomId}"`);
//             } else {
//                 this.io.to(battleRoomId).emit("message", `${player.name} tried to join room but no seats are available`);
//             }
//         } else {
//             this.io.to(socket.id).emit("message", `Room with ID "${battleRoomId}" does not exist or player has no hero equipped`);
//         }
//     }

//     /**
//      * Creates a new battle room if:
//      * - Player has a hero equipped.
//      * - Generated room ID is unique.
//      *
//      * @param socket - The client's socket instance.
//      * @param player - The player creating the room.
//      * @param options - Room configuration such as maxPlayers, mode, etc.
//      * @returns The created BattleRoom object or null if creation failed.
//      */
//     public createBattleRoom(socket: Socket, player: Player, options: BattleRoom) {
//         if (!player.selectedHero) {
//             const message = `Player "${player.name}" must have a hero equipped to create a room.`;
//             this.io.to(socket.id).emit("message", message);
//             return null;
//         }

//         const roomId = randomInt(0x1000000).toString(16).padStart(10, "0XD0");
//         const existingRoom = this.battleRooms.find(r => r.id === roomId);

//         if (existingRoom && player.selectedHero !== undefined) {
//             console.warn(`❗️ Room with ID "${roomId}" already exists.`);
//             return null;
//         }

//         const newRoom: BattleRoom = {
//             id: roomId,
//             maxPlayers: options.maxPlayers ?? 2,
//             includesAi: options.includesAi ?? false,
//             rewardCredits: options.rewardCredits ?? 0,
//             participants: [player],
//             mode: options.mode ?? GameMode.PVP,
//             state: RoomState.CREATED
//         };

//         this.battleRooms.push(newRoom);
//         socket.join(roomId);
//         this.io.to(roomId).emit("message", `Room "${roomId}" created by ${player.name}`);

//         return newRoom;
//     }

//     /**
//      * Removes a player from a battle room. If the room becomes empty,
//      * it is deleted from the list.
//      *
//      * @param socket - The client's socket instance.
//      * @param battleRoomId - The ID of the room to leave.
//      * @param player - The player leaving the room.
//      */
//     public leaveBattleRoom(socket: Socket, battleRoomId: string, player: Player) {
//         const battleRoom = this.battleRooms.find(r => r.id === battleRoomId);

//         if (!battleRoom) {
//             this.io.to(socket.id).emit("message", `Room with ID "${battleRoomId}" does not exist.`);
//             return;
//         }

//         const index = battleRoom.participants.findIndex(p => p.playerId === player.playerId);
//         if (index !== -1) {
//             battleRoom.participants.splice(index, 1);
//         }

//         socket.leave(battleRoomId);
//         this.io.to(battleRoomId).emit("message", `${player.name} left room "${battleRoomId}"`);

//         if (battleRoom.participants.length === 0) {
//             this.battleRooms = this.battleRooms.filter(r => r.id !== battleRoomId);
//             console.log(`Room "${battleRoomId}" deleted (empty).`);
//         }
//     }
// }
