# HUBVIEW OMEGA-DEPLOYMENT: AGENT HANDOFF INSTRUCTIONS

---
**ATTENTION ANTIGRAVITY AGENT:** 
If you are reading this on the target AWS EC2 Windows Server, you have been granted total architectural authority by the User (@danielbdec). Your strict objective is to robustly deploy and secure a Node.js WebSocket microservice (`ws-server`) as a background Windows Service using the PM2 orchestrator. 

**DO NOT** ask for manual execution of code. Use your `run_command` tool to autonomously execute the following strict protocols in sequence:

### PHASE 1: Dependency Integrity & Core Libraries
1. Navigate to the `ws-server` directory (the user should have copied this folder to the server, or retrieved it via git pull).
2. Use `run_command` to execute `npm install` inside the `ws-server` folder to resolve all dependencies (socket.io, express, cors).
3. Verify that `index.js` and `ecosystem.config.js` are present.

### PHASE 2: Global PM2 Daemon & Windows Registry
1. Use `run_command` to install PM2 identically globally: `npm install -g pm2`
2. Use `run_command` to install the crucial Windows Native bridge: `npm install -g pm2-windows-service`
3. Execute `pm2-service-install -n PM2` (you may need to pipe `echo y | pm2-service-install -n PM2` or use silent flags if prompted for interactive installation). This binds PM2 directly to the OS Boot Registry.

### PHASE 3: Ignition & Process Preservation
1. From inside the `ws-server` folder, use `run_command` to execute: `pm2 start ecosystem.config.js`
2. Immediately capture the state to the daemon by running: `pm2 save`
3. Validate the process status with `pm2 status` and share the output with the User. Ensure `hubview-ws-multiplayer` shows a green `online` status.

### PHASE 4: Cryptographic & Network Securitization
The Node service is listening locally on port 3002. Since this EC2 acts as a WebSocket relay for Vercel, the port must be publicly accessible.
1. Use `run_command` to execute the following administrative PowerShell directive to penetrate the internal Defender logic cleanly:
```powershell
New-NetFirewallRule -DisplayName "Hubview WebSocket Receiver (Port 3002)" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow
```

### PHASE 5: User Briefing & SSL Directive
Once Phases 1-4 execute perfectly, explicitly alert the User that:
- The WebSocket layer is online and daemonized.
- They MUST ensure they opened the AWS Dashboard (Security Groups) and permitted Inbound Traffic for `Custom TCP : 3002 : 0.0.0.0/0`.
- Remind them that if the Vercel frontend is HTTPS, Chrome WILL block this EC2 IP unless they map a domain and apply an SSL certificate to this server (or proxy it via Cloudflare).

Execute this protocol safely and immediately.
