import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupRoomSocket } from "./infra/ws/RoomSocket";
import { roomRouter } from "./infra/http/RoomController";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: ["http://localhost:4200", "http://207.248.81.78:4200"],
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(httpServer, {
    cors: {
    origin: ["http://localhost:4200", "http://207.248.81.78:4200"],
    methods: ["GET", "POST"],
    credentials: false
  }
});

setupRoomSocket(io);

app.use(express.json());
app.use("/api", roomRouter);

const PORT = 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

