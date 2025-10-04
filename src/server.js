import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import seedRoles from './utils/seedRoles.js';
import seedUsers from './utils/seedUsers.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Habilitar CORS para todos
app.use(cors());

app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Validar estado del servidor
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// Ruta raíz redirige al frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejador de errores 404 para rutas no encontradas
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        // Para rutas de API, devolver JSON
        res.status(404).json({ message: 'Ruta no encontrada' });
    } else {
        // Para rutas del frontend, servir página 404
        res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
});

// Manejador global de errores
app.use((err, req, res, next) => {
    console.error(err);
    
    if (req.path.startsWith('/api/')) {
        res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
    } else {
        res.status(500).sendFile(path.join(__dirname, '../public/500.html'));
    }
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
    .then( async () => {
        console.log('🚀 Mongo connected');
        await seedRoles();
        await seedUsers();
        app.listen(PORT, () => console.log(`🌟 Servidor corriendo en el puerto ${PORT}`));
    })
    .catch(err => {
        console.error('❌ Error al conectar con Mongo:', err);
        process.exit(1);
    });
