import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    correo: { type: String, unique: true },
    contrasenia: String,
    telefono: String,
    fechaNacimiento: Date,
    genero: String,
    tipoUsuario: { 
        type: String, 
        enum: ['cliente', 'entrenador', 'administrador'],
        required: true
    },
    fechaRegistro: { type: Date, default: Date.now },
    estado: { 
        type: String, 
        enum: ['pendiente', 'activo', 'inactivo', 'bloqueado'], 
        default: "pendiente" 
    },
    verificado: { type: Boolean, default: false },
    codigoVerificacion: { 
        codigo: String,
        fechaCreacion: Date,
        fechaExpiracion: Date
    },
    ultimoAcceso: Date,
    intentosFallidos: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

// Modelo 'User' y colección 'users'
const User = mongoose.model('users', userSchema);

export default User;
