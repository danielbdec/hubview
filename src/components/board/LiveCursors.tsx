'use client';

import { useSocketStore } from '@/store/socketStore';
import { motion } from 'framer-motion';

export function LiveCursors() {
    const onlineUsers = useSocketStore(state => state.onlineUsers);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {onlineUsers.map((user) => {
                if (!user.cursor) return null;

                return (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: user.cursor.x, y: user.cursor.y }}
                        animate={{ opacity: 1, x: user.cursor.x, y: user.cursor.y }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                            mass: 0.5,
                        }}
                        className="absolute left-0 top-0 flex flex-col items-start drop-shadow-md"
                    >
                        {/* Custom SVG Cursor matching user's color */}
                        <svg
                            width="24"
                            height="36"
                            viewBox="0 0 24 36"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="relative -left-[4px] -top-[4px]"
                            style={{ 
                                fill: user.color, 
                                filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` 
                            }}
                        >
                            <path
                                d="M5.65376 2.15376C5.40366 1.65354 4.88729 1.5 4.5 1.5C4.11271 1.5 3.59634 1.65354 3.34624 2.15376L0.34624 8.15376C-0.0381615 8.92257 0.203112 10.0305 0.941913 10.4907L3.45607 12.0573C4.12053 12.4714 4.98188 12.4208 5.60155 11.9304L8.85489 9.35624C9.5375 8.81604 9.6133 7.82071 9.02796 7.18556L5.65376 2.15376Z"
                                transform="translate(4 4)" // offset
                            />
                            {/* Standard Mouse Arrow Shape */}
                            <path
                                d="M2.5 1L12.5 13L8 13.5L11.5 22L8 23L4.5 14L0.5 17L2.5 1Z"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* User Name Tag */}
                        <div
                            className="mt-1 px-2 py-0.5 whitespace-nowrap rounded font-mono text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider shadow-sm"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name.slice(0, 15)}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
