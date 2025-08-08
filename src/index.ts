import SocketServer from "../src/core/SocketServer";
import { HttpServer } from "./core/HttpServer";

const PORT = 3000;
const httpServer = new HttpServer(PORT);
httpServer.listen(() => {
	console.log(`Servidor HTTP escuchando en http://localhost:${PORT}`);
});

new SocketServer(httpServer.server);