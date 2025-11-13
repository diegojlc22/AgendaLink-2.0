import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as db from './database.js';

const PORT = 3001;
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO and Express
const corsOptions = {
  origin: "http://localhost:5173", // Allow requests from the Vite dev server
  methods: ["GET", "POST", "DELETE"]
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions
});

// ---- Helper to broadcast updates ----
const broadcastAppointments = () => {
  const appointments = db.getAppointments();
  io.emit('appointments-update', appointments);
  console.log('Broadcasted appointments update to all clients.');
};

// ---- REST API Endpoints (for initial load or fallback) ----
app.get('/api/appointments', (req, res) => {
  try {
    const appointments = db.getAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
});

// ---- Socket.IO Connection Handling ----
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial data on connection
  socket.emit('appointments-update', db.getAppointments());

  // Handle new appointment creation
  socket.on('create-appointment', (data) => {
    try {
      console.log(`Received create-appointment request:`, data);
      db.createAppointment({ timeSlot: data.timeSlot, userName: data.userName });
      broadcastAppointments(); // Notify all clients of the change
    } catch (error) {
      console.error('Error creating appointment:', error.message);
      // Optionally, send an error message back to the requesting client
      socket.emit('error-message', { message: error.message });
    }
  });

  // Handle appointment deletion (admin action)
  socket.on('delete-appointment', (data) => {
    try {
      console.log(`Received delete-appointment request for id:`, data.id);
      db.deleteAppointment(data.id);
      broadcastAppointments(); // Notify all clients
    } catch (error) {
      console.error('Error deleting appointment:', error.message);
      socket.emit('error-message', { message: 'Falha ao deletar o agendamento.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
