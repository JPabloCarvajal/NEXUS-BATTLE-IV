import BattleRoom from "../model/battleRoomInterfaces/BattleRoom";
import { Server, Socket } from "socket.io";
import { GameMode, RoomState } from "../model/Enums";
import Player from "../model/battleRoomInterfaces/Player";
import { randomInt } from "node:crypto";

export default class BattleRoomManager{

    private battleRooms: BattleRoom[] = [];

    constructor(private io: Server){}
    
    public joinBattleRoom(socket: Socket, battleRoomId: string, player: Player): void{
        let battleRoom = this.battleRooms.find(r => r.id === battleRoomId);
        

        if(battleRoom){
            let availableparticipants :number = battleRoom?.maxPlayers - battleRoom?.participants?.length
            if(availableparticipants>0){
                if (!battleRoom.participants.includes(player)) {
                    battleRoom.participants.push(player);
                }
                socket.join(battleRoomId);
                this.io.to(battleRoomId).emit("message", ` ${player.name} se unió a la sala "${battleRoomId}"`)
            }
            else{
                this.io.to(battleRoomId).emit("message", ` ${player.name} trato de unirse a la sala pero no hay asientos disponibles"`)
            }
        }
        else{
            this.io.to(socket.id).emit("message", `La sala con ID "${battleRoomId}" no existe.`);
        }
    }

    public createBattleRoom(socket: Socket, player: Player, options: BattleRoom) {
        const roomId = randomInt(0x1000000).toString(16).padStart(10, "0XD0");
        const existingRoom = this.battleRooms.find(r => r.id === roomId);
        if (existingRoom) {
        console.warn(`❗️ Sala con ID "${roomId}" ya existe.`);
        return null;
        }

        // modificar esto para que las battleRoom
        const newRoom: BattleRoom = {
            id: roomId,
            maxPlayers: options.maxPlayers ?? 2,
            includesAi: options.includesAi ?? false,
            rewardCredits: options.rewardCredits ?? 0,
            participants: [player],
            mode: options.mode ?? GameMode.PVP,
            state: RoomState.CREATED
        };

        this.battleRooms.push(newRoom);

        socket.join(roomId);

        this.io.to(roomId).emit("message", `Sala "${roomId}" creada por ${player.name}`);

        return newRoom;
  }
    
    public leaveBattleRoom(socket: Socket, battleRoomId : string, player: Player){
        const battleRoom = this.battleRooms.find((r => r.id === battleRoomId));

        if(!battleRoom){
            this.io.to(socket.id).emit("message", ` Room with ID "${battleRoomId}" does not exist.`);
            return;
        }

        const index = this.battleRooms.findIndex(p=> p.id = player.playerId);
        if(index !== -1){
            battleRoom.participants.splice(index, 1);
        }

        socket.leave(battleRoomId);

        this.io.to(battleRoomId).emit("message", ` ${player.name} left room "${battleRoomId}"`);

        if (battleRoom.participants.length === 0) {
            this.battleRooms = this.battleRooms.filter(r => r.id !== battleRoomId);
            console.log(`Room "${battleRoomId}" deleted (empty).`);
        }
    }
}