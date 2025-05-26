import express from 'express';
import Client from '../models/client.js';
import Entrenador from '../models/entrenador.js';
import Usuario from '../models/user.js';
import Ejercicio from '../models/ejercicio.js';
import Dieta from '../models/dieta.js';
import Rutina from '../models/rutina.js';
import ProgresoFisico from '../models/progresoFisico.js';
import Mensaje from '../models/mensajes.js';
import fetch from 'node-fetch';

const router = express.Router();

function authCliente(req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'cliente') {
        return res.redirect('/');
    }
    // Aquí asignamos para que luego tus rutas puedan usarlo:
    req.entrenador = req.session.usuario;
    next();
}

// Dashboard cliente (protección)
router.get('/dashboard', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'cliente') {
        return res.redirect('/');
    }

    try {
        // Buscamos el cliente por usuarioId, con datos de entrenador y usuario
        const cliente = await Client.findOne({ usuarioId: req.session.usuario._id })
            .populate('usuarioId')
            .populate({
                path: 'entrenadorId',
                populate: { path: 'usuarioId' }  // para tener los datos del usuario entrenador
            });

        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        res.render('client/dashboard', { usuario: req.session.usuario, cliente });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el dashboard del cliente');
    }
});

// Ruta para mostrar perfil completo del cliente
router.get('/perfil', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'cliente') {
        return res.redirect('/');
        
    }
    try {
        const cliente = await Client.findOne({ usuarioId: req.session.usuario._id })
            .populate('usuarioId')
            .populate({
                path: 'entrenadorId',
                populate: { path: 'usuarioId' }
            });

        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        res.render('client/perfil', { usuario: req.session.usuario, cliente });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar perfil del cliente');
    }
});

router.get('/dietas', authCliente, async (req, res) => {
    try {
        const cliente = await Client.findOne({ usuarioId: req.session.usuario._id })
            .populate('usuarioId');

        if (!cliente) return res.status(404).send('Cliente no encontrado');

        const dietasCliente = await Dieta.find({ clienteId: cliente._id }).lean();

        res.render('client/dietas', {
            usuario: req.session.usuario,
            cliente,
            dietasCliente
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar dietas');
    }
});

// Mostrar las rutinas asignadas al cliente
router.get('/rutinas', authCliente, async (req, res) => {
    try {
        const cliente = await Client.findOne({ usuarioId: req.session.usuario._id })
            .populate('usuarioId');

        if (!cliente) return res.status(404).send('Cliente no encontrado');

        // Popula el ejercicioId dentro de los ejercicios de cada rutina
        const rutinasCliente = await Rutina.find({ clienteId: cliente._id })
            .populate('ejercicios.ejercicios.ejercicioId')
            .lean();

        res.render('client/rutinas', {
            usuario: req.session.usuario,
            cliente,
            rutinasCliente,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar rutinas');
    }
});

// Mostrar formulario
router.get('/progreso', authCliente, async (req, res) => {
    const cliente = await Client.findOne({ usuarioId: req.session.usuario._id });
    const historial = await ProgresoFisico.find({ clienteId: cliente._id }).sort({ fechaRegistro: -1 }).lean();
    res.render('client/progreso', { usuario: req.session.usuario, historial });
});

// Registrar nuevo progreso
router.post('/progreso', authCliente, async (req, res) => {
    const cliente = await Client.findOne({ usuarioId: req.session.usuario._id });
    const progreso = new ProgresoFisico({
        clienteId: cliente._id,
        ...req.body
    });
    await progreso.save();
    res.redirect('/client/progreso');
});

// Mostrar formulario de edición
router.get('/progreso/:id/edit', authCliente, async (req, res) => {
    const progreso = await ProgresoFisico.findById(req.params.id).lean();
    res.render('client/editarProgreso', { progreso });
});

// Actualizar (POST en lugar de PUT)
router.post('/progreso/:id/update', authCliente, async (req, res) => {
    const { pesoKg, alturaCm, grasaCorporal, observaciones } = req.body;
    const alturaM = alturaCm / 100;
    const imc = +(pesoKg / (alturaM * alturaM)).toFixed(2);

    await ProgresoFisico.findByIdAndUpdate(req.params.id, {
        pesoKg,
        alturaCm,
        grasaCorporal,
        observaciones,
        imc
    });

    res.redirect('/client/progreso');
});

// Eliminar (POST en lugar de DELETE)
router.post('/progreso/:id/delete', authCliente, async (req, res) => {
    await ProgresoFisico.findByIdAndDelete(req.params.id);
    res.redirect('/client/progreso');
});

router.get('/chat', authCliente, async (req, res) => {
    try {
        const cliente = await Client.findOne({ usuarioId: req.session.usuario._id })
            .populate({
                path: 'entrenadorId',
                populate: { path: 'usuarioId' }
            });

        if (!cliente || !cliente.entrenadorId) {
            return res.status(404).send('No tienes un entrenador asignado.');
        }

        const remitenteId = req.session.usuario._id;
        const destinatarioId = cliente.entrenadorId.usuarioId._id;
        const roomId = [remitenteId, destinatarioId].sort().join('-');

        const mensajes = await Mensaje.find({
            $or: [
                { remitenteId, destinatarioId },
                { remitenteId: destinatarioId, destinatarioId: remitenteId }
            ]
        }).sort({ createdAt: 1 });

        res.render('client/chat', {
            remitenteId,
            destinatarioId,
            roomId,
            mensajes
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el chat');
    }
});

router.get('/ollama', authCliente, (req, res) => {
    res.render('client/ollama', { usuario: req.session.usuario });
});

router.get('/ollama/chat-stream', authCliente, async (req, res) => {
    const prompt = req.query.prompt;

    if (!prompt) {
        return res.status(400).send('Falta el prompt');
    }

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3',
                prompt,
                stream: true
            })
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.body.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.done) {
                        res.write(`event: done\ndata: [DONE]\n\n`);
                        res.end();
                        return;
                    }
                    res.write(`data: ${parsed.response}\n\n`);
                } catch (e) {
                    console.error('Error parseando respuesta de Ollama:', e);
                }
            }
        });

        response.body.on('end', () => {
            res.end();
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al conectar con Ollama');
    }
});
/*
router.get('/chat', authCliente, async (req, res) => {
    const cliente = await Client.findOne({ usuarioId: req.session.usuario._id });
    const entrenadorId = cliente?.entrenadorId?.toString();

    const mensajes = await Mensaje.find({
        $or: [
            { remitenteId: req.session.usuario._id, destinatarioId: entrenadorId },
            { remitenteId: entrenadorId, destinatarioId: req.session.usuario._id }
        ]
    }).sort({ createdAt: 1 });

    res.render('client/chat', {
        mensajes,
        usuarioId: req.session.usuario._id.toString(),
        destinatarioId: entrenadorId
    });
});
// Enviar nuevo mensaje
router.post('/chat/mensaje', authCliente, async (req, res) => {
    try {
        const { destinatarioId, contenido } = req.body;

        const nuevoMensaje = new Mensaje({
            remitenteId: req.session.usuario._id,
            destinatarioId,
            contenido
        });

        await nuevoMensaje.save();

        res.status(200).json({ success: true, mensaje: nuevoMensaje });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al enviar el mensaje' });
    }
});
*/


export default router;
