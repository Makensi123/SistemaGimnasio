import express from 'express';
import { loginUsuario } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUsuario);  // <-- esta ruta maneja POST /login

export default router; 