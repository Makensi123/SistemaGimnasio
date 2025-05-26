import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema({
  remitenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  destinatarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  contenido: { type: String, required: true },
  fechaEnvio: { type: Date, default: Date.now },
  leido: { type: Boolean, default: false }
}, { timestamps: true });

const Mensaje = mongoose.model('mensajes', mensajeSchema);
export default Mensaje;
