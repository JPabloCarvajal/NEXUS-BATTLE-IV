import express, { Express } from "express";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

/**
 * HttpServer:
 * Sets up an Express-based HTTP server.
 * - Serves static files from the `/www` directory.
 * - Can be used as the base for a Socket.IO server.
 */
export class HttpServer {
    public app: Express;
    public server: HTTPServer;

    /**
     * Creates a new HTTP server instance.
     * @param port - The port number where the server will listen for requests.
     */
    constructor(public port: number) {
        this.app = express();
        const staticPath = path.join(__dirname, "../www");
        this.app.use(express.static(staticPath));
        this.server = createServer(this.app);
    }

    /**
     * Starts the server and begins listening on the specified port.
     * @param callback - Optional function to run after the server starts listening.
     */
    public listen(callback?: () => void): void {
        this.server.listen(this.port, callback);
    }
}
