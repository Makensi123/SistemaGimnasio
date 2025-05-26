import Ejercicio from '../models/ejercicio.js';

// Crear nuevo ejercicio
export const crearEjercicio = async (req, res) => {
    try {
        const nuevoEjercicio = new Ejercicio(req.body);
        await nuevoEjercicio.save();
        res.status(201).json({ mensaje: 'Ejercicio creado correctamente', data: nuevoEjercicio });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el ejercicio' });
    }
};

// Obtener todos los ejercicios
export const obtenerEjercicios = async (req, res) => {
    try {
        const ejercicios = await Ejercicio.find();
        res.status(200).json(ejercicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los ejercicios' });
    }
};

// Modificar ejercicio
export const actualizarEjercicio = async (req, res) => {
    try {
        const ejercicio = await Ejercicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(ejercicio);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el ejercicio' });
    }
};

// Eliminar ejercicio
export const eliminarEjercicio = async (req, res) => {
    try {
        await Ejercicio.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: 'Ejercicio eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el ejercicio' });
    }
};
