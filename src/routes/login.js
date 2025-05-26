import express from 'express';
import {Router} from 'express';
import { registrarUsuario } from '../controllers/userController.js';

const router = express.Router();

// Mostrar formularios (GET)
router.get('/', (req, res) => res.render('index'));
router.get('/register', (req, res) => res.render('register'));

// Procesar formularios (POST)
router.post('/register', registrarUsuario);


export default router;
