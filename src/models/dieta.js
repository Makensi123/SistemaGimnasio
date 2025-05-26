import mongoose from "mongoose";

const dietaSchema = new mongoose.Schema(
    {
        entrenadorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "entrenadores",
            required: true,
        },
        clienteId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'clientes' }],
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        descripcion: {
            type: String,
            default: "",
            trim: true,
        },
        fechaInicio: {
            type: Date,
            default: Date.now,
        },
        fechaFin: {
            type: Date,
        },
        estado: {
            type: String,
            enum: ["Activa", "Reposo"],
            required: true,
            set: (v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
        },
        categoria: {
            type: String,
            enum: [
                "Pérdida de peso",
                "Ganancia muscular",
                "Mantenimiento"
            ],
            required: true,
            trim: true,
        },
        comidas: [
            {
                tipoComida: {
                    type: String,
                    required: true,
                    enum: ["Desayuno", "Almuerzo", "Cena", "Merienda", "Snack"],
                },
                descripcion: {
                    type: String,
                    required: true,
                    trim: true,
                },
                caloriasEstimadas: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

dietaSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Dieta = mongoose.model("dietas", dietaSchema);
export default Dieta;
