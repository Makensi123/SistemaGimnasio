// ================= app.js =================
import express from 'express';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import loginRoutes from './routes/login.js';
import logoutRoutes from './routes/logout.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/client.js';
import adminRoutes from './routes/admin.js';
import volverRoutes from './routes/volver.js';
import entrenadorRoutes from './routes/entrenador.js';
import http from 'http';
import { Server } from 'socket.io';
import Mensaje from './models/mensajes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conexión a MongoDB
connectDB();

// Configuración de EJS y middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
});
app.use(sessionMiddleware);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', loginRoutes);
app.use('/logout', logoutRoutes);
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/admin', adminRoutes);
app.use('/volver', volverRoutes);
app.use('/entrenador', entrenadorRoutes);

// Integrar sesión en Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} se unió a la sala ${roomId}`);
    });
    socket.on('chatMessage', async ({ remitenteId, destinatarioId, contenido, roomId }) => {
    const nuevoMensaje = new Mensaje({ remitenteId, destinatarioId, contenido });
    await nuevoMensaje.save();

    io.to(roomId).emit('mensajeRecibido', nuevoMensaje);
    });  

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
