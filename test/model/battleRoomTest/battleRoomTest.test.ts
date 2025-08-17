// import { io as ClientIO, Socket as ClientSocket } from "socket.io-client";
// import { HttpServer } from "../../../src/core/HttpServer";
// import SocketServer from "../../../src/core/SocketServer";
// import Player from "../../../src/model/battleRoomInterfaces/Player";
// import BattleRoom from "../../../src/model/battleRoomInterfaces/BattleRoom";
// import { GameMode, HeroState, HeroType} from "../../../src/model/Enums";

// let httpServer: HttpServer;
// let socketServer: SocketServer;
// let clientSocket: ClientSocket;
// const PORT = 5050;

// // beforeAll((done) => {
// //     // 1. Start real HTTP + Socket.IO server
//     httpServer = new HttpServer(PORT);
//     socketServer = new SocketServer(httpServer.server);
//     httpServer.listen(() => {
//         console.log(`Test server listening on port ${PORT}`);
//         done();
//     });
// });

// afterAll((done) => {
//     if (clientSocket.connected) clientSocket.disconnect();
//     httpServer.server.close(done);
// });

// describe("BattleRoomManager Integration Flow", () => {
//     beforeEach((done) => {
//         // Connect fresh client before each test
//         clientSocket = ClientIO(`http://localhost:${PORT}`);
//         clientSocket.on("connect", done);
//     });

//     afterEach(() => {
//         if (clientSocket.connected) clientSocket.disconnect();
//     });

//     it("should reject room creation if player has no hero", (done) => {
//         const playerWithoutHero: Player = {
//             playerId: "p1",
//             name: "NoHeroPlayer",
//             isLoggedIn: true,
//             credits: 100,
//             selectedHero: null as any, // No hero
//             inventory: []
//         };

//         const options: Partial<BattleRoom> = { maxPlayers: 2, mode: GameMode.PVP };

//         clientSocket.emit("createRoom", { player: playerWithoutHero, options }, (response: any) => {
//             expect(response.success).toBe(false);
//             expect(response.message).toMatch(/must have a hero/i);
//             done();
//         });
//     });

//     it("should allow creating a room if player has a hero", (done) => {
//         const playerWithHero: Player = {
//             playerId: "p2",
//             name: "HeroPlayer",
//             isLoggedIn: true,
//             credits: 100,
//             selectedHero: {
//                 id: "hero1",
//                 heroType: HeroType.WEAPONS_PAL,
//                 level: 1,
//                 experience: 0,
//                 health: 100,
//                 power: 50,
//                 attack: 15,
//                 defense: 10,
//                 damage: 20,
//                 equipment: { weapons: [], armors: [], items: [], epicAbility: { name: "Default Epic", compatibleHeroType: HeroType.TANK,effects:[], cooldown: 1, isAvailable: true  } },
//                 specialActions: [],
//                 state: HeroState.ALIVE
//             },
//             inventory: []
//         };

//         const options: Partial<BattleRoom> = { maxPlayers: 3, includesAi: true, rewardCredits: 50, mode: GameMode.COOP };

//         clientSocket.emit("createRoom", { player: playerWithHero, options }, (response: any) => {
//             expect(response.success).toBe(true);
//             expect(response.room).toBeDefined();
//             expect(response.room.maxPlayers).toBe(3);
//             expect(response.room.mode).toBe(GameMode.COOP);
//             done();
//         });
//     });
// });
