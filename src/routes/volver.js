import express from 'express';
import mongoose from 'mongoose';
import Cliente from '../models/client.js';
import Entrenador from '../models/entrenador.js'; // asegúrate de importarlo
import Rutina from '../models/rutina.js';

const router = express.Router();

router.get('/', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/'); // o donde sea que inicies sesión
    }

    if (req.session.usuario.tipoUsuario === 'administrador') {
        return res.render('admin/dashAdmin', { usuario: req.session.usuario });
    }

    if (req.session.usuario.tipoUsuario === 'entrenador') {
        return res.render('entrenador/dashboard', { usuario: req.session.usuario });
    }
    // Otros tipos de usuario o sin permiso
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


        const clientes = await Cliente.find({ entrenadorId: entrenador._id })

        res.render('entrenador/clientesChat', {
            usuario: req.session.usuario,
            clientes
        });
    } catch(error) {
        console.error('Error al obtener los chats:', error);
        res.redirect('/');
    }

})

export default router;
