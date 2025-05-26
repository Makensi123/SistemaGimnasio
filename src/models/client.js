import mongoose from "mongoose"; 

const clientSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }, // <-- cambio aquí
    entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'entrenadores' }, 
    objetivo: String,
    nivel: String,
    observaciones: String,
    fechaAsignacionEntrenador: { type: Date }
});

const Client = mongoose.model('clientes', clientSchema);
export default Client;
