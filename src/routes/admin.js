import express from 'express';
import Usuario from '../models/user.js';
import Client from '../models/client.js';
import Entrenador from '../models/entrenador.js';
import Ejercicio from '../models/ejercicio.js';
import Token from '../models/token.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'administrador') {
        return res.redirect('/');
    }

    try {
        const cantidadClientes = await Client.countDocuments({ entrenadorId: { $ne: null } });
        const clientesSinEntrenador = await Client.countDocuments({ $or: [{ entrenadorId: null }, { entrenadorId: { $exists: false } }] });
        const cantidadEntrenadores = await Entrenador.countDocuments();
        const cantidadTokensActivos = await Token.countDocuments({ usado: false });
        const cantidadEjercicios = await Ejercicio.countDocuments();

        res.render('admin/dashAdmin', {
            usuario: req.session.usuario,
            cantidadClientes,
            cantidadEntrenadores,
            clientesSinEntrenador,
            cantidadTokensActivos,
            cantidadEjercicios
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashAdmin', {
            usuario: req.session.usuario,
            cantidadClientes: 0,
            cantidadEntrenadores: 0,
            cantidadTokensActivos: 0,
            cantidadEjercicios: 0
        });
    }
});

// Ruta para listar clientes y asignar entrenador
router.get('/clients', async (req, res) => {
    try {
        const clientes = await Client.find()
            .populate('usuarioId')
            .populate({
                path: 'entrenadorId',
                populate: {
                    path: 'usuarioId' // Esto permite acceder a cliente.entrenadorId.usuarioId.nombre
                }
            });

        const entrenadores = await Entrenador.find().populate('usuarioId');

        res.render('admin/client', { clientes, entrenadores });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los datos de clientes y entrenadores');
    }
});

// Procesar la asignación de entrenador a cliente
router.post('/clients/asignar', async (req, res) => {
    const { clienteId, entrenadorId } = req.body;

    try {
        await Client.findByIdAndUpdate(clienteId, {
            entrenadorId,
            fechaAsignacionEntrenador: new Date()
        });

        res.redirect('/admin/clients');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al asignar entrenador');
    }
});

// Ruta para gestionar entrenadores
router.get('/entrenadores', (req, res) => {
    res.render('admin/entrenador');
});

// Mostrar la vista con la lista de ejercicios
router.get('/ejercicios', async (req, res) => {
    try {
        const ejercicios = await Ejercicio.find();
        res.render('admin/ejercicios', { ejercicios });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar ejercicios');
    }
});

// Guardar nuevo ejercicio o actualizar existente
router.post('/ejercicios/guardar', async (req, res) => {
    const { id, nombre, descripcion, tipoEjercicio, nivelDificultad, categoria, musculoPrincipal, equipoNecesario } = req.body;

    try {
        if (id) {
            // Editar ejercicio existente
            await Ejercicio.findByIdAndUpdate(id, {
                nombre,
                descripcion,
                tipoEjercicio,
                nivelDificultad,
                categoria,
                musculoPrincipal,
                equipoNecesario
            });
        } else {
            // Crear nuevo ejercicio
            const nuevoEjercicio = new Ejercicio({
                nombre,
                descripcion,
                tipoEjercicio,
                nivelDificultad,
                categoria,
                musculoPrincipal,
                equipoNecesario
            });
            await nuevoEjercicio.save();
        }
        res.redirect('/admin/ejercicios');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar ejercicio');
    }
});

// Eliminar ejercicio
router.post('/ejercicios/eliminar', async (req, res) => {
    const { id } = req.body;
    try {
        await Ejercicio.findByIdAndDelete(id);
        res.redirect('/admin/ejercicios');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar ejercicio');
    }
});
// Ruta para gestionar tokens
router.get('/tokens', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'administrador') {
        return res.redirect('/');
    }
    const tokens = await Token.find().sort({ creadoEn: -1 });
    res.render('admin/token', { tokens });
});

router.post('/tokens/generar', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'administrador') {
        return res.status(403).send('No autorizado');
    }

    // Crear un token aleatorio (ejemplo: 16 caracteres hex)
    const nuevoToken = crypto.randomBytes(8).toString('hex');

    try {
        const token = new Token({ token: nuevoToken });
        await token.save();
        res.redirect('/admin/tokens');  // Refrescar para mostrar el nuevo token
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al generar token');
    }
});



export default router;
