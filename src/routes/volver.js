import express from 'express';
import mongoose from 'mongoose';
import Cliente from '../models/client.js';
import Entrenador from '../models/entrenador.js'; // asegúrate de importarlo
import Rutina from '../models/rutina.js';
import Token from '../models/token.js';
import Ejercicio from '../models/ejercicio.js';
import Dieta from '../models/dieta.js';

const router = express.Router();

router.get('/', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/'); // o donde sea que inicies sesión
    }

    if (req.session.usuario.tipoUsuario === 'administrador') {
        try {
            const cantidadClientes = await Cliente.countDocuments();
            const clientesSinEntrenador = await Cliente.countDocuments({ $or: [{ entrenadorId: null }, { entrenadorId: { $exists: false } }] });
            const cantidadEntrenadores = await Entrenador.countDocuments();
            const cantidadTokensActivos = await Token.countDocuments({ usado: false });
            const cantidadEjercicios = await Ejercicio.countDocuments();

            return res.render('admin/dashAdmin', {
                usuario: req.session.usuario,
                cantidadClientes,
                clientesSinEntrenador,
                cantidadEntrenadores,
                cantidadTokensActivos,
                cantidadEjercicios
            });
        } catch (err) {
            console.error('Error al cargar el dashboard del administrador:', err);
            return res.redirect('/');
        }
    }

    if (req.session.usuario.tipoUsuario === 'entrenador') {
    try {
        const usuarioId = req.session.usuario._id;

        const entrenador = await Entrenador.findOne({ usuarioId });

        if (!entrenador) {
            console.log("No se encontró entrenador con ese usuarioId");
            return res.redirect('/');
        }

        const cantidadClientes = await Cliente.countDocuments({ entrenadorId: entrenador._id });
        const cantidadRutinas = await Rutina.countDocuments({ entrenadorId: entrenador._id });
        const cantidadDietas = await Dieta.countDocuments({ entrenadorId: entrenador._id });

        return res.render('entrenador/dashboard', {
            usuario: req.session.usuario,
            cantidadClientes,
            cantidadRutinas,
            cantidadDietas
        });
    } catch (error) {
        console.error('Error al cargar dashboard de entrenador:', error);
        return res.redirect('/');
    }
}


// Este se ejecuta solo si no es entrenador y no hubo `return` antes
res.redirect('/');
});


router.get('/volverClient', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'entrenador') {
        return res.redirect('/');
    }

    try {
        const usuarioId = req.session.usuario._id;

        // Buscar el documento del entrenador relacionado con ese usuario
        const entrenador = await Entrenador.findOne({ usuarioId: usuarioId });

        if (!entrenador) {
            console.log("No se encontró entrenador con ese usuarioId");
            return res.redirect('/');
        }

        const clientes = await Cliente.find({ entrenadorId: entrenador._id }).populate('usuarioId');

        console.log("Clientes encontrados:", clientes);

        res.render('entrenador/client', {
            usuario: req.session.usuario,
            clientes
        });
    } catch (error) {
        console.error('Error al obtener los clientes:', error);
        res.redirect('/');
    }
});

router.get('/volverRutina', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'entrenador') {
        return res.redirect('/');
    }

    try {
        const usuarioId = req.session.usuario._id;

        // Buscar el documento del entrenador relacionado con ese usuario
        const entrenador = await Entrenador.findOne({ usuarioId: usuarioId });

        if (!entrenador) {
            console.log("No se encontró entrenador con ese usuarioId");
            return res.redirect('/');
        }

        // Aquí deberías buscar las rutinas asociadas al entrenador

        const rutinas = await Rutina.find({ entrenadorId: entrenador._id });

        // Por ahora, solo renderizamos la vista sin rutinas
        res.render('entrenador/rutina', {
            usuario: req.session.usuario,
            rutinas
        });
    } catch (error) {
        console.error('Error al obtener las rutinas:', error);
        res.redirect('/');
    }
});

router.get('/volverChat', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'entrenador') {
        return res.redirect('/');
    }

    try {
        const usuarioId = req.session.usuario._id;

        // Buscar el documento del entrenador relacionado con ese usuario
        const entrenador = await Entrenador.findOne({ usuarioId: usuarioId });

        if (!entrenador) {
            console.log("No se encontró entrenador con ese usuarioId");
            return res.redirect('/');
        }

        const clientes = await Cliente.find({ entrenadorId: entrenador._id }).populate('usuarioId');

        console.log("Clientes encontrados:", clientes);
        res.render('entrenador/clientesChat', {
            usuario: req.session.usuario,
            clientes
        });
    } catch (error) {
        console.error('Error al obtener los clientes:', error);
        res.redirect('/');
    }
});

export default router;
