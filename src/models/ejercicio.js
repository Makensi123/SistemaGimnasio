import mongoose from "mongoose";

const ejercicioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    tipoEjercicio: {
        type: String,
        required: true,
        enum: ['Fuerza', 'Cardio', 'Flexibilidad', 'Equilibrio']
    },
    nivelDificultad: {
        type: String,
        required: true,
        enum: ['Principiante', 'Intermedio', 'Avanzado']
    },
    categoria: {
        type: String,
        required: true,
        enum: ['Pecho', 'Espalda', 'Piernas', 'Brazos', 'Hombros', 'Abdomen', 'Full body']
    },
    musculoPrincipal: String,
    equipoNecesario: String  
});

const Ejercicio = mongoose.model('ejercicios', ejercicioSchema);
export default Ejercicio;
