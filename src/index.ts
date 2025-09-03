import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import setupRoomSocket from "./infra/ws/RoomSocket";
import { roomRouter } from "./infra/http/RoomController";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import swaggerConfig from "../swagger";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const acceptedOrigins = process.env["ACCEPTED_ORIGINS"]?.split(",") ?? [];

app.use(
  cors({
    origin: acceptedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(
  process.env["DOC_PATH"] || "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerConfig)
);

const io = new Server(httpServer, {
  cors: {
    origin: acceptedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupRoomSocket(io);

app.use(express.json());
app.use(process.env["PATH_API"] || "/api", roomRouter);

const PORT = process.env["PORT"] || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
