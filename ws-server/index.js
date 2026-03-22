const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all for prototype

const server = http.createServer(app);

// In production, configure CORS properly to accept only from your EC2 frontend domain
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Memory store for active users per room (projectId)
const rooms = {};
// Global presence map
const globalUsers = {}; 

io.on('connection', (socket) => {
    console.log(`[+] User connected: ${socket.id}`);

    // User joins a project board or global view
    socket.on('join-room', ({ roomId, user }) => {
        // Leave previous rooms (except their own socket.id room)
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
                if (rooms[room]) {
                    delete rooms[room][socket.id];
                    socket.to(room).emit('presence-update', Object.values(rooms[room]));
                }
            }
        });

        socket.join(roomId);
        console.log(`[Room ${roomId}] User joined: ${user.name}`);

        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }

        const userData = {
            id: socket.id,
            userId: user.id || socket.id,
            name: user.name || 'Anonymous',
            color: user.color || '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
            cursor: null,
            currentRoom: roomId
        };

        // Store user presence in current isolated room
        rooms[roomId][socket.id] = userData;
        // Broadcast current users in room
        io.to(roomId).emit('presence-update', Object.values(rooms[roomId]));

        // Store and broadcast global platform-wide presence
        globalUsers[socket.id] = userData;
        io.emit('global-presence', Object.values(globalUsers));
    });

    // Handle cursor movement
    socket.on('cursor-move', ({ roomId, cursor }) => {
        if (rooms[roomId] && rooms[roomId][socket.id]) {
            rooms[roomId][socket.id].cursor = cursor;
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('cursor-update', {
                id: socket.id,
                cursor
            });
        }
    });

    // Handle task sync (drag/drop, edit)
    socket.on('board-update', ({ roomId, type, payload }) => {
        socket.to(roomId).emit('board-sync', { type, payload });
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        if (globalUsers[socket.id]) {
            delete globalUsers[socket.id];
            io.emit('global-presence', Object.values(globalUsers));
        }

        socket.rooms.forEach(roomId => {
            if (rooms[roomId] && rooms[roomId][socket.id]) {
                const userName = rooms[roomId][socket.id].name;
                delete rooms[roomId][socket.id];
                console.log(`[-] User ${userName} disconnected from ${roomId}`);
                // Inform others
                socket.to(roomId).emit('presence-update', Object.values(rooms[roomId]));
                
                // Cleanup empty rooms
                if (Object.keys(rooms[roomId]).length === 0) {
                    delete rooms[roomId];
                }
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`[-] Socket closed: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`🚀 Multiplayer WebSocket Server running on port ${PORT}`);
});
