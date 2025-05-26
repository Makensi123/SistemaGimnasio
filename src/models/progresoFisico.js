import mongoose from "mongoose";

const progresoFisicoSchema = new mongoose.Schema({
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',  // nombre del modelo
        required: true,
        index: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now,
        index: true
    },
    pesoKg: {
        type: Number,
        required: true,
        min: 20,
        max: 500
    },
    alturaCm: {
        type: Number,
        required: true,
        min: 30,
        max: 300
    },
    imc: {
        type: Number,
        min: 5,
        max: 100
    },
    grasaCorporal: {
        type: Number,
        min: 0,
        max: 100
    },
    observaciones: {
        type: String,
        trim: true,
        maxlength: 500
    }
});

progresoFisicoSchema.pre('save', function (next) {
    if (!this.imc && this.pesoKg && this.alturaCm) {
        const alturaM = this.alturaCm / 100;
        this.imc = +(this.pesoKg / (alturaM * alturaM)).toFixed(2);
    }
    next();
});

const ProgresoFisico = mongoose.model('ProgresoFisico', progresoFisicoSchema);
export default ProgresoFisico;