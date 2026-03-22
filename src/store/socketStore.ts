import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type CursorPosition = { x: number; y: number } | null;

export interface RemoteUser {
    id: string; // socket id
    userId: string; // unique database or session id
    name: string;
    color: string;
    cursor: CursorPosition;
}

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    roomId: string | null;
    onlineUsers: RemoteUser[];
    
    // Actions
    connect: (projectId: string, user: { id: string; name: string; color?: string }) => void;
    disconnect: () => void;
    sendCursorMove: (cursor: CursorPosition) => void;
    broadcastBoardUpdate: (type: string, payload: any) => void;
}

// Em produção, aponte para a porta do microserviço e para a URL real
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    roomId: null,
    onlineUsers: [],

    connect: (projectId, user) => {
        const existingSocket = get().socket;
        if (existingSocket) {
            existingSocket.disconnect();
        }

        const socket = io(SOCKET_URL, {
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'] // Try WS first, fallback to polling
        });

        socket.on('connect', () => {
            set({ isConnected: true, roomId: projectId, socket });
            socket.emit('join-room', { roomId: projectId, user });
        });

        socket.on('disconnect', () => {
            set({ isConnected: false, onlineUsers: [] });
        });

        socket.on('presence-update', (users: RemoteUser[]) => {
            // Filter out our own socket.id to avoid rendering our own remote cursor
            const others = users.filter(u => u.id !== socket.id);
            set({ onlineUsers: others });
        });

        socket.on('cursor-update', ({ id, cursor }: { id: string, cursor: CursorPosition }) => {
            set((state) => ({
                onlineUsers: state.onlineUsers.map(u => 
                    u.id === id ? { ...u, cursor } : u
                )
            }));
        });

        // This is a passive listener. 
        // When someone else moves a card, they emit 'board-update'. 
        // We receive 'board-sync' and must tell kanbanStore to re-fetch or apply optimistic state.
        socket.on('board-sync', ({ type, payload }) => {
            console.log('Received remote board sync:', type, payload);
            // We can dispatch a global event or hook this up in a useEffect inside the Board page
            window.dispatchEvent(new CustomEvent('remote-board-sync', { detail: { type, payload } }));
        });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false, roomId: null, onlineUsers: [] });
        }
    },

    sendCursorMove: (cursor) => {
        const { socket, roomId } = get();
        if (socket && roomId) {
            socket.emit('cursor-move', { roomId, cursor });
        }
    },

    broadcastBoardUpdate: (type, payload) => {
        const { socket, roomId } = get();
        if (socket && roomId) {
            socket.emit('board-update', { roomId, type, payload });
        }
    }
}));
