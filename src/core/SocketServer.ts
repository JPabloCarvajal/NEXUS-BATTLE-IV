import { Server as IOServer, Socket } from "socket.io";
import BattleRoomManager from "./BattleRoomManager";

/**
 * SocketServer:
 * - Creates the Socket.IO server.
 * - Listens for client events ("createRoom", "joinRoom").
 * - Passes the logic to BattleRoomManager.
 */
export default class SocketServer {
    private io: IOServer;
    private battleRoomManager: BattleRoomManager;

    constructor(httpServer: any) {
        // Create Socket.IO server linked to the HTTP server
        this.io = new IOServer(httpServer, {
            cors: { origin: "*" } // Allow all origins, while testing
        });

        this.battleRoomManager = new BattleRoomManager(this.io);

        this.configureSockets();
    }

    /**
     * Configure listeners for new connections and game events.
     */
    private configureSockets(): void {
        // Triggered when a client connects
        this.io.on('connection', (socket: Socket) => {
            console.log(`Client connected:`, socket.id);
            
            // Client wants to create a room
            socket.on("createRoom", (data, callback) => {
                const { player, options } = data;
                const room = this.battleRoomManager.createBattleRoom(socket, player, options);
                callback({ success: !!room, room });
            });

            // Client wants to join a room
            socket.on("joinRoom", (data) => {
                const { roomId, player } = data;
                this.battleRoomManager.joinBattleRoom(socket, roomId, player);
            });

            // Client wants to close a room
            socket.on("leaveBattleRoom", (data) =>{
                const {roomId, player} = data;
                this.battleRoomManager.leaveBattleRoom(socket ,roomId, player);
            })
        });
    }
}
