"use strict";

const serverPort = 3000,
    http = require("http"),
    express = require("express"),
    app = express(),
    server = http.createServer(app),
    WebSocket = require("ws"),
    path = require('path'),
    websocketServer = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, '', 'demo.html'));
});

// Add the following middleware to enable CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// Store the connected users
const connectedUsers = [];

// When a websocket connection is established
websocketServer.on("connection", (webSocketClient) => {
    // When a message is received
    webSocketClient.on("message", (username) => {
        // Add the user to the connected users array
        connectedUsers.push(username);

        // Broadcast the updated user list to all clients
        broadcastUserList();

        // Send feedback to the incoming connection
        webSocketClient.send(`User ${username} added successfully`);
    });

    webSocketClient.on("close", () => {
    });

    // Send feedback to the incoming connection
    webSocketClient.send("Connection: ok");
});

websocketServer.on('error', function() {
  // Handle the error.
});

websocketServer.on('close', function() {
});

// Define the /users endpoint to send the list of connected users
app.get("/users", (req, res) => {
    res.json(connectedUsers);
});

// Define the /lottery endpoint to perform a lottery draw
app.get("/lottery", (req, res) => {
    if (connectedUsers.length === 0) {
        res.status(404).send("No users connected");
        return;
    }

    const winnerIndex = Math.ceil(Math.random() * connectedUsers.length);
    console.log(winnerIndex);
    console.log(Math.random() + " " + connectedUsers.length);

    const winner = connectedUsers[winnerIndex];

    // Reset the connected users array for the next draw
    connectedUsers.length = 0;

    // Broadcast the updated user list and the winner to all clients
    broadcastUserList();
    broadcastWinner(winner);

    res.send(`The winner of the lottery draw is: ${winner}`);
});

// Broadcast the updated user list to all connected clients
function broadcastUserList() {
    const userListMessage = `Current Users: ${connectedUsers.join(", ")}`;

    websocketServer.clients.forEach((client) => {
        client.send(userListMessage);
    });
}

// Broadcast the winner to all connected clients
function broadcastWinner(winner) {
    const winnerMessage = `The winner of the lottery draw is: ${winner}`;

    websocketServer.clients.forEach((client) => {
        client.send(winnerMessage);
    });
}

// Start the web server
server.listen(serverPort, () => {
    console.log(`Websocket server started on port ${serverPort}`);
});