import mongoose from "mongoose";

const rutinaSchema = new mongoose.Schema({
    entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'entrenadores' },
    clienteId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'clientes' }],
    nombre: String,
    descripcion: String,
    duracionSemanas: Number,
    fechaInicio: Date,
    fechaFin: Date,
    estado: String,
    ejercicios: [
        {
            diaSemana: String,
            ejercicios: [
                {
                    ejercicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'ejercicios' },
                    series: Number,
                    repeticiones: Number,
                    descansoMinutos: Number
                }
            ]
        }
    ]
});
const Rutina = mongoose.model('rutinas', rutinaSchema);
export default Rutina;