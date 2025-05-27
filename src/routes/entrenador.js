import express from 'express';
import Client from '../models/client.js';
import Entrenador from '../models/entrenador.js'; // Asegúrate de importar el modelo
import Rutina from '../models/rutina.js';
import Ejercicio from '../models/ejercicio.js'; // Si tienes este modelo
import Dieta from '../models/dieta.js'; // Asegúrate de importar el modelo
import ProgresoFisico from '../models/progresoFisico.js';
import Mensaje from '../models/mensajes.js';
const router = express.Router();

function authEntrenador(req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'entrenador') {
        return res.redirect('/');
    }
    // Aquí asignamos para que luego tus rutas puedan usarlo:
    req.entrenador = req.session.usuario;
    next();
}

// Dashboard entrenador (simple)
router.get('/dashboard', authEntrenador, async (req, res) => {
    try {
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        if (!entrenador) {
            return res.status(404).send('Entrenador no encontrado');
        }

        // 2. Buscar los clientes asignados a ese entrenador
        const cantidadClientes = await Client.countDocuments({ entrenadorId: entrenador._id });
        // Contar rutinas creadas por este entrenador
        const cantidadRutinas = await Rutina.countDocuments({ entrenadorId: entrenador._id });

        // Contar dietas creadas por este entrenador
        const cantidadDietas = await Dieta.countDocuments({ entrenadorId: entrenador._id });

        res.render('entrenador/dashboard', {
            usuario: req.session.usuario,
            cantidadClientes,
            cantidadRutinas,
            cantidadDietas
        });
    } catch (error) {
        console.error(error);
        res.render('entrenador/dashboard', {
            usuario: req.session.usuario,
            cantidadClientes: 0,
            cantidadRutinas: 0,
            cantidadDietas: 0
        });
    }
});
// Mostrar clientes asignados al entrenador
router.get('/clients', authEntrenador, async (req, res) => {
    try {
        // Buscar el documento del entrenador con el usuarioId de la sesión
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });

        if (!entrenador) {
            return res.status(404).send('Entrenador no encontrado');
        }

        const clientes = await Client.find({ entrenadorId: entrenador._id })
            .populate('usuarioId');

        res.render('entrenador/client', { clientes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los datos de los clientes');
    }
});

router.get('/rutinas', authEntrenador, async (req, res) => {
    try {
        // Obtener el entrenador vinculado al usuario logueado
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        if (!entrenador) {
            return res.status(404).send("Entrenador no encontrado");
        }

        // Filtrar las rutinas por entrenadorId
        const rutinas = await Rutina.find({ entrenadorId: entrenador._id });

        res.render('entrenador/rutina', { rutinas });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar las rutinas");
    }
});
router.get('/ejercicios/categoria/:categoria', authEntrenador, async (req, res) => {
    try {
        const { categoria } = req.params;
        console.log("Buscando ejercicios para categoría:", categoria);
        const ejercicio = await Ejercicio.find({ categoria });
        res.json(ejercicio);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener ejercicios por categoría' });
    }
});

router.post('/rutinas/crear', authEntrenador, async (req, res) => {
    try {
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        if (!entrenador) return res.status(404).send("Entrenador no encontrado");

        const nuevaRutina = new Rutina({
            entrenadorId: entrenador._id,  // Guardar el ID del entrenador, no del usuario
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            duracionSemanas: req.body.duracionSemanas,
            fechaInicio: req.body.fechaInicio,
            fechaFin: req.body.fechaFin,
            ejercicios: JSON.parse(req.body.ejercicios)
        });

        await nuevaRutina.save();
        res.redirect('/entrenador/rutinas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar la rutina');
    }
});
//Eliminar rutina
router.post('/rutinas/eliminar/:id', authEntrenador, async (req, res) => {
    try {
        const { id } = req.params;
        await Rutina.findByIdAndDelete(id);
        res.redirect('/entrenador/rutinas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la rutina');
    }
});
// ruta en routes/entrenador.js
router.get('/rutinas/:id/detalles', authEntrenador, async (req, res) => {
    try {
        const rutina = await Rutina.findById(req.params.id);
        if (!rutina) return res.status(404).send("Rutina no encontrada");

        const ejerciciosConInfo = [];

        for (const dia of rutina.ejercicios) {
            const ejerciciosInfo = await Promise.all(
                dia.ejercicios.map(async (e) => {
                    const info = await Ejercicio.findById(e.ejercicioId).lean();
                    return {
                        ...info,
                        series: e.series,
                        repeticiones: e.repeticiones,
                        descansoMinutos: e.descansoMinutos,
                        diaSemana: dia.diaSemana,
                        ejercicioRutinaId: e.ejercicioId // usado para edición
                    };
                })
            );
            ejerciciosConInfo.push({ diaSemana: dia.diaSemana, ejercicios: ejerciciosInfo });
        }

        res.render('entrenador/verDetallesRutina', {
            rutina,
            ejerciciosPorDia: ejerciciosConInfo,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener detalles");
    }
});
router.post('/rutinas/:id/editar-ejercicio/:ejercicioId', authEntrenador, async (req, res) => {
    const { id, ejercicioId } = req.params;
    const { series, repeticiones, descansoMinutos } = req.body;

    try {
        const rutina = await Rutina.findById(id);
        if (!rutina) return res.status(404).send("Rutina no encontrada");

        for (const dia of rutina.ejercicios) {
            const ejercicio = dia.ejercicios.find(e => e.ejercicioId.toString() === ejercicioId);
            if (ejercicio) {
                ejercicio.series = parseInt(series);
                ejercicio.repeticiones = parseInt(repeticiones);
                ejercicio.descansoMinutos = parseInt(descansoMinutos);
                break;
            }
        }

        await rutina.save();
        res.redirect(`/entrenador/rutinas/${id}/detalles`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar ejercicio");
    }
});
// Eliminar ejercicio de una rutina
router.post('/rutinas/:id/eliminar-ejercicio/:ejercicioId', authEntrenador, async (req, res) => {
    const { id, ejercicioId } = req.params;

    try {
        const rutina = await Rutina.findById(id);
        if (!rutina) return res.status(404).send("Rutina no encontrada");

        for (const dia of rutina.ejercicios) {
            const index = dia.ejercicios.findIndex(e => e.ejercicioId.toString() === ejercicioId);
            if (index !== -1) {
                dia.ejercicios.splice(index, 1);
                break;
            }
        }

        rutina.ejercicios = rutina.ejercicios.filter(dia => dia.ejercicios.length > 0);

        await rutina.save();
        res.redirect(`/entrenador/rutinas/${id}/detalles`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al eliminar ejercicio");
    }
});


// Mostrar dietas
router.get('/dietas', authEntrenador, async (req, res) => {
    try {
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        const dietas = await Dieta.find({ entrenadorId: entrenador._id });

        // Agrupar por categoría
        const dietasPorCategoria = {};
        for (const dieta of dietas) {
            if (!dietasPorCategoria[dieta.categoria]) {
                dietasPorCategoria[dieta.categoria] = [];
            }
            dietasPorCategoria[dieta.categoria].push(dieta);
        }

        res.render('entrenador/dietas', { usuario: req.session.usuario, dietasPorCategoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener dietas');
    }
});

// Crear dieta
router.post('/dietas/crear', authEntrenador, async (req, res) => {
    try {
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        await Dieta.create({
            ...req.body,
            entrenadorId: entrenador._id
        });
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear dieta');
    }
});

// Editar dieta
router.post('/dietas/editar/:id', authEntrenador, async (req, res) => {
    try {
        await Dieta.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al editar dieta');
    }
});

// Eliminar dieta
router.post('/dietas/eliminar/:id', authEntrenador, async (req, res) => {
    try {
        await Dieta.findByIdAndDelete(req.params.id);
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar dieta');
    }
});
// Agregar comida a dieta
router.post('/dietas/:id/comidas/agregar', authEntrenador, async (req, res) => {
    try {
        const { tipoComida, descripcion, caloriasEstimadas } = req.body;
        await Dieta.findByIdAndUpdate(req.params.id, {
            $push: {
                comidas: {
                    tipoComida,
                    descripcion,
                    caloriasEstimadas: Number(caloriasEstimadas) || 0
                }
            }
        });
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al agregar comida');
    }
});

// Editar comida específica
router.post('/dietas/:id/comidas/:index/editar', authEntrenador, async (req, res) => {
    try {
        const dieta = await Dieta.findById(req.params.id);
        const index = parseInt(req.params.index);
        if (dieta && dieta.comidas[index]) {
            dieta.comidas[index].descripcion = req.body.descripcion;
            dieta.comidas[index].caloriasEstimadas = Number(req.body.caloriasEstimadas);
            await dieta.save();
        }
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al editar comida');
    }
});

// Eliminar comida específica
router.post('/dietas/:id/comidas/:index/eliminar', authEntrenador, async (req, res) => {
    try {
        const dieta = await Dieta.findById(req.params.id);
        const index = parseInt(req.params.index);
        if (dieta && dieta.comidas[index]) {
            dieta.comidas.splice(index, 1);
            await dieta.save();
        }
        res.redirect('/entrenador/dietas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar comida');
    }
});

// Obtener rutinas asignadas a un cliente y rutinas disponibles
router.get('/clients/:clienteId/rutinas', authEntrenador, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        if (!entrenador) return res.status(404).send('Entrenador no encontrado');
        const entrenadorId = entrenador._id;

        const cliente = await Client.findById(clienteId).populate('usuarioId');
        if (!cliente) return res.status(404).send('Cliente no encontrado');

        // Rutinas asignadas a ese cliente
        const rutinasCliente = await Rutina.find({ clienteId: clienteId })  // clienteId es array, busca rutinas que tengan clienteId en el array
            .populate({
                path: 'ejercicios.ejercicios.ejercicioId',
                model: 'ejercicios'
            });

        // Rutinas creadas por el entrenador que NO están asignadas a este cliente
        const rutinasDisponibles = await Rutina.find({
            entrenadorId,
            $or: [
                { clienteId: { $exists: false } },
                { clienteId: { $nin: [clienteId] } }
            ]
        });

        res.render('entrenador/gestionRutina', { cliente, rutinasCliente, rutinasDisponibles });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener rutinas');
    }
});

// Asignar rutina a un cliente (agregar clienteId al array clienteId)
router.post('/clients/:clienteId/rutinas/asignar', authEntrenador, async (req, res) => {
    try {
        const { rutinaId } = req.body;
        const clienteId = req.params.clienteId;

        await Rutina.findByIdAndUpdate(rutinaId, {
            $addToSet: { clienteId: clienteId }
        });

        res.redirect(`/entrenador/clients/${clienteId}/rutinas`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al asignar rutina");
    }
});

// Quitar rutina a un cliente (remover clienteId del array clienteId)
router.post('/clients/:clienteId/rutinas/:rutinaId/quitar', authEntrenador, async (req, res) => {
    try {
        const { clienteId, rutinaId } = req.params;

        await Rutina.findByIdAndUpdate(rutinaId, {
            $pull: { clienteId: clienteId }
        });

        res.redirect(`/entrenador/clients/${clienteId}/rutinas`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al quitar rutina");
    }
});

//Dieta
// Obtener dietas asignadas a un cliente y dietas disponibles
router.get('/clients/:clienteId/dietas', authEntrenador, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        if (!entrenador) return res.status(404).send('Entrenador no encontrado');
        const entrenadorId = entrenador._id;

        const cliente = await Client.findById(clienteId).populate('usuarioId');
        if (!cliente) return res.status(404).send('Cliente no encontrado');

        // Dietas asignadas a ese cliente (clienteId es array)
        const dietasCliente = await Dieta.find({ clienteId: clienteId })
            .lean();

        // Dietas creadas por el entrenador que NO están asignadas a este cliente
        const dietasDisponibles = await Dieta.find({
            entrenadorId,
            $or: [
                { clienteId: { $exists: false } },
                { clienteId: { $nin: [clienteId] } }
            ]
        }).lean();

        res.render('entrenador/gestionDieta', { cliente, dietasCliente, dietasDisponibles });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener dietas');
    }
});

// Asignar dieta a un cliente (agregar clienteId al array clienteId)
router.post('/clients/:clienteId/dietas/asignar', authEntrenador, async (req, res) => {
    try {
        const { dietaId } = req.body;
        const clienteId = req.params.clienteId;

        await Dieta.findByIdAndUpdate(dietaId, {
            $addToSet: { clienteId: clienteId }
        });

        res.redirect(`/entrenador/clients/${clienteId}/dietas`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al asignar dieta");
    }
});

// Quitar dieta a un cliente (remover clienteId del array clienteId)
router.post('/clients/:clienteId/dietas/:dietaId/quitar', authEntrenador, async (req, res) => {
    try {
        const { clienteId, dietaId } = req.params;

        await Dieta.findByIdAndUpdate(dietaId, {
            $pull: { clienteId: clienteId }
        });

        res.redirect(`/entrenador/clients/${clienteId}/dietas`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al quitar dieta");
    }
});
router.get('/clients/:clientId/progreso', authEntrenador, async (req, res) => {
    try {
        const { clientId } = req.params;
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });

        if (!entrenador) return res.status(404).send('Entrenador no encontrado');

        const cliente = await Client.findById(clientId).populate('usuarioId');
        if (!cliente) return res.status(404).send('Cliente no encontrado');

        const progresos = await ProgresoFisico.find({ clienteId: clientId }).sort({ fechaRegistro: -1 }).lean();

        res.render('entrenador/verProgreso', {
            cliente,
            progresos
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar progreso del cliente');
    }
});


router.get('/mensajes', authEntrenador, async (req, res) => {
    try {
        console.log('ID usuario sesión:', req.session.usuario._id);
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });
        console.log('Entrenador encontrado:', entrenador);
        if (!entrenador) return res.send('No se encontró entrenador para este usuario.');

        // Aquí hacemos populate para traer nombre y apellido
        const clientes = await Client.find({ entrenadorId: entrenador._id }).populate('usuarioId', 'nombre apellido');
        console.log('Clientes encontrados:', clientes.length);
        res.render('entrenador/clientesChat', { clientes, usuario: req.session.usuario });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener la lista de clientes');
    }
});


// Mostrar pantalla de chat en tiempo real con cliente específico

router.get('/chat/:clienteId', authEntrenador, async (req, res) => {
    try {
        const clienteId = req.params.clienteId;
        const cliente = await Client.findById(clienteId).populate('usuarioId');
        const entrenador = await Entrenador.findOne({ usuarioId: req.session.usuario._id });

        if (!cliente || !entrenador) {
            return res.status(404).send('Cliente o entrenador no encontrado');
        }

        const remitenteId = req.session.usuario._id;
        const destinatarioId = cliente.usuarioId._id;
        const roomId = [remitenteId, destinatarioId].sort().join('-');

        const mensajes = await Mensaje.find({
            $or: [
                { remitenteId, destinatarioId },
                { remitenteId: destinatarioId, destinatarioId: remitenteId }
            ]
        }).sort({ createdAt: 1 });

        res.render('entrenador/chat', {
            remitenteId,
            destinatarioId,
            roomId,
            mensajes,
            cliente
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la pantalla de chat');
    }
});




export default router;
