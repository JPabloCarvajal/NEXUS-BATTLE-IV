import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupRoomSocket } from "./infra/ws/RoomSocket";
import { roomRouter } from "./infra/http/RoomController";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

setupRoomSocket(io);

app.use(express.json());
app.use("/api", roomRouter);

const PORT = 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

