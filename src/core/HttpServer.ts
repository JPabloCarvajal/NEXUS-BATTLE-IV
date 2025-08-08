import express, {Express} from "express";
import {createServer, Server as HTTPServer} from "http";
import path from "path";

export class HttpServer{
    public app: Express;
    public server: HTTPServer;

    constructor(public port: number){
        this.app = express();
        const staticPath = path.join(__dirname, "../www");
        this.app.use(express.static(staticPath));
        this.server= createServer(this.app);
    }   

    public listen(callback?: () => void): void{
        this.server.listen(this.port, callback)
    }

}