# HUBVIEW OMEGA-DEPLOYMENT: AGENT HANDOFF INSTRUCTIONS

---
**ATTENTION ANTIGRAVITY AGENT:** 
If you are reading this on the target AWS EC2 Windows Server, you have been granted total architectural authority by the User (@danielbdec). The server you are on DOES NOT have the project files yet. 

Your strict objective is to autonomously **CREATE the source code files**, robustly deploy the WebSocket microservice (`ws-server`), and run it as a background Windows Service using the PM2 orchestrator. 

**DO NOT** ask for manual execution of code. Use your `write_to_file` and `run_command` tools to autonomously execute the following strict protocols in sequence:

### PHASE 1: Scaffolding the Source Code
1. Use `run_command` to create a directory: `mkdir C:\hubview-ws` (or in whoever directory the user prefers, confirm with `pwd`).
2. Navigate into it. Use `write_to_file` to recreate the following 3 exact files:

**File 1: `package.json`**
```json
{
  "name": "hubview-ws-server",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "socket.io": "^4.7.5"
  }
}
```

**File 2: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [
    {
      name: "hubview-ws-multiplayer",
      script: "./index.js",
      instances: 1, 
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3002
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
```

**File 3: `index.js`**
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const rooms = {};
const globalUsers = {}; 

io.on('connection', (socket) => {
    console.log(`[+] User connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, user }) => {
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

        rooms[roomId][socket.id] = userData;
        io.to(roomId).emit('presence-update', Object.values(rooms[roomId]));

        globalUsers[socket.id] = userData;
        io.emit('global-presence', Object.values(globalUsers));
    });

    socket.on('cursor-move', ({ roomId, cursor }) => {
        if (rooms[roomId] && rooms[roomId][socket.id]) {
            rooms[roomId][socket.id].cursor = cursor;
            socket.to(roomId).emit('cursor-update', {
                id: socket.id,
                cursor
            });
        }
    });

    socket.on('board-update', ({ roomId, type, payload }) => {
        socket.to(roomId).emit('board-sync', { type, payload });
    });

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
                socket.to(roomId).emit('presence-update', Object.values(rooms[roomId]));
                
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
```

### PHASE 2: Dependency Integrity & Core Libraries
1. Use `run_command` to execute `npm install` inside the folder where you created the files to resolve all dependencies.

### PHASE 3: Global PM2 Daemon & Windows Registry
1. Use `run_command` to install PM2 identically globally: `npm install -g pm2`
2. Use `run_command` to install the crucial Windows Native bridge: `npm install -g pm2-windows-service`
3. Execute `pm2-service-install -n PM2` (you may need to pipe `echo y | pm2-service-install -n PM2` or use silent flags if prompted). This binds PM2 directly to the OS Boot Registry.

### PHASE 4: Ignition & Process Preservation
1. From inside the folder, use `run_command` to execute: `pm2 start ecosystem.config.js`
2. Immediately capture the state to the daemon by running: `pm2 save`
3. Validate the process status with `pm2 status` and share the output with the User. Ensure `hubview-ws-multiplayer` shows a green `online` status.

### PHASE 5: Cryptographic & Network Securitization
The Node service is listening locally on port 3002. Since this EC2 acts as a WebSocket relay for Vercel, the port must be publicly accessible.
1. Use `run_command` to execute the following administrative PowerShell directive to penetrate the internal Defender logic cleanly:
```powershell
New-NetFirewallRule -DisplayName "Hubview WebSocket Receiver (Port 3002)" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow
```

### PHASE 6: User Briefing
Once Phases 1-5 execute perfectly, explicitly alert the User that:
- The WebSocket layer is online and daemonized.
- They MUST ensure they opened the AWS Dashboard (Security Groups) and permitted Inbound Traffic for `Custom TCP : 3002 : 0.0.0.0/0`.

Execute this protocol safely and immediately.
