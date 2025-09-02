import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupRoomSocket } from "./infra/ws/RoomSocket";
import { roomRouter } from "./infra/http/RoomController";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const aceptedOrigins = [
  "http://localhost:4200",
  "http://207.248.81.78:4200",
  "http://207.248.81.78:8080",
  "http://207.248.81.78:80",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:80",
  "http://egypt.bucaramanga.upb.edu.co",
  "http://egypt.bucaramanga.upb.edu.co:80",
  "http://egypt.bucaramanga.upb.edu.co:8080"
]

app.use(cors({
  origin: aceptedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(httpServer, {
    cors: {
    origin: aceptedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupRoomSocket(io);

app.use(express.json());
app.use("/api", roomRouter);

const PORT = 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

