const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
    let filePath = req.url === "/" ? "index.html" : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const typeMap = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript"
    };

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
        } else {
            res.writeHead(200, { "Content-Type": typeMap[ext] || "text/plain" });
            res.end(content);
        }
    });
});

const wss = new WebSocket.Server({ server });

const rooms = {}; // roomName -> Set of clients

wss.on("connection", (ws) => {
    ws.send(JSON.stringify({
        type: "rooms",
        rooms: Object.keys(rooms)
    }));

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "create") {
            if (!rooms[data.room]) rooms[data.room] = new Set();
            broadcastRooms();
        }

        if (data.type === "join") {
            if (ws.room && rooms[ws.room]) {
                rooms[ws.room].delete(ws);
            }

            ws.username = data.username;
            ws.room = data.room;

            if (!rooms[data.room]) rooms[data.room] = new Set();
            rooms[data.room].add(ws);
        }

        if (data.type === "message") {
            rooms[ws.room]?.forEach(client => {
                client.send(JSON.stringify({
                    type: "message",
                    username: ws.username,
                    text: data.text,
                    time: new Date().toLocaleTimeString()
                }));
            });
        }
    });

    ws.on("close", () => {
        if (ws.room && rooms[ws.room]) {
            rooms[ws.room].delete(ws);
        }
    });
});

function broadcastRooms() {
    const roomList = Object.keys(rooms);
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: "rooms",
            rooms: roomList
        }));
    });
}

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
