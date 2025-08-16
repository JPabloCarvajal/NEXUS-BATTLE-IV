import { Server as IOServer, Socket } from "socket.io";
import BattleRoomManager from "./BattleRoomManager";

/**
 * SocketServer
 * 
 * Manages all Socket.IO communication between clients and the game server.
 * Responsibilities:
 * - Creates the Socket.IO server and links it to the provided HTTP server.
 * - Listens for client events such as creating, joining, or leaving a battle room.
 * - Delegates business logic to the BattleRoomManager.
 */
export default class SocketServer {
    private io: IOServer;
    private battleRoomManager: BattleRoomManager;

    /**
     * Creates a new SocketServer instance.
     * @param httpServer - The HTTP server to attach Socket.IO to.
     */
    constructor(httpServer: any) {
        this.io = new IOServer(httpServer, {
            cors: { origin: "*" } // while develpment this wouldnt change
        });

        this.battleRoomManager = new BattleRoomManager(this.io);

        this.configureSockets();
    }

    /**
     * Configures event listeners for client connections and game-related events.
     * Events handled:
     * - "createRoom": Creates a new battle room (only if the player has a hero).
     * - "joinRoom": Joins an existing battle room.
     * - "leaveBattleRoom": Leaves a battle room and removes it if empty.
     */
    private configureSockets(): void {
        // Fired when a new client connects
        this.io.on('connection', (socket: Socket) => {
            console.log(`Client connected:`, socket.id);
            
            socket.on("createRoom", (data, callback) => {
                const { player, options } = data;
                const room = this.battleRoomManager.createBattleRoom(socket, player, options);

                if (!room) {
                    callback({ success: false, message: "Player must have a hero equipped to create a room." });
                    return;
                }

                callback({ success: true, room });
            });

            /**
             * Handles requests to join an existing room.
             */
            socket.on("joinRoom", (data) => {
                const { roomId, player } = data;
                this.battleRoomManager.joinBattleRoom(socket, roomId, player);
            });

            /**
             * Handles requests to leave a room.
             */
            socket.on("leaveBattleRoom", (data) =>{
                const { roomId, player } = data;
                this.battleRoomManager.leaveBattleRoom(socket, roomId, player);
            });
        });
    }
}
