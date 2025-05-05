// socket/chat.js
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage'); // Import model for saving messages

// Simple in-memory store for recent messages per room (replace with DB for persistence)
// const recentMessages = new Map(); // room -> [messageObj, ...]
// const MAX_RECENT_MESSAGES = 50;

function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "*", // Allow frontend origin
            methods: ["GET", "POST"]
        }
    });

    console.log('Socket.IO initialized');

    // Socket.IO Middleware for Authentication (Example)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token; // Expect token from client handshake auth
        const jwtSecret = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

        if (token) {
            jwt.verify(token, jwtSecret, (err, user) => {
                if (err) {
                     console.error("Socket Auth Error:", err.message);
                     return next(new Error('Authentication error'));
                }
                if (!user || !user.walletAddress) {
                    console.error("Socket Auth Error: Invalid token payload");
                    return next(new Error('Authentication error: Invalid token'));
                }
                socket.user = user; // Attach user info to the socket
                console.log(`Socket authenticated: ${socket.user.walletAddress}`);
                next();
            });
        } else {
             console.warn("Socket connection attempt without token.");
             // Allow connection but mark as unauthenticated, or reject
             // socket.user = null; // Mark as unauthenticated
             // next();
             next(new Error('Authentication error: No token provided')); // Reject unauthenticated
        }
    });


    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user?.walletAddress || 'Unknown'} (ID: ${socket.id})`);

        // Join Room Event
        socket.on('joinRoom', (room) => {
            // Leave previous rooms if necessary
            // socket.rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });

            socket.join(room);
            console.log(`${socket.user?.walletAddress} joined room: ${room}`);
            // Optionally send recent messages for the room
            // socket.emit('chatHistory', recentMessages.get(room) || []);
        });

        // Leave Room Event
        socket.on('leaveRoom', (room) => {
            socket.leave(room);
            console.log(`${socket.user?.walletAddress} left room: ${room}`);
        });

        // Chat Message Event
        socket.on('chatMessage', async (data) => {
            const { room, message } = data;
            const user = socket.user;

            if (!user || !room || !message || message.trim().length === 0) {
                console.warn('Invalid chat message received:', data);
                socket.emit('chatError', 'Invalid message or room.');
                return;
            }

            const messageData = {
                room: room,
                walletAddress: user.walletAddress,
                username: user.username || `${user.walletAddress.slice(0, 6)}...`, // Use username or fallback
                message: message.trim(), // Trim whitespace
                timestamp: new Date()
            };

            console.log(`Message from ${user.walletAddress} in room ${room}: ${message}`);

            // Save message to DB
            try {
                const chatMessage = new ChatMessage(messageData);
                await chatMessage.save();

                // Broadcast message to the room
                io.to(room).emit('newMessage', messageData);

                // // Update in-memory cache (optional)
                // let roomMessages = recentMessages.get(room) || [];
                // roomMessages.push(messageData);
                // if (roomMessages.length > MAX_RECENT_MESSAGES) {
                //     roomMessages = roomMessages.slice(-MAX_RECENT_MESSAGES);
                // }
                // recentMessages.set(room, roomMessages);

            } catch (error) {
                 console.error('Error saving/broadcasting chat message:', error);
                 socket.emit('chatError', 'Failed to send message.');
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.user?.walletAddress || 'Unknown'} (ID: ${socket.id}), Reason: ${reason}`);
        });
    });

    return io;
}

module.exports = initializeSocket;
