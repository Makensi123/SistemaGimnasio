import User from '../models/user.js';
import Client from '../models/client.js';
import Entrenador from '../models/entrenador.js';
import Token from '../models/token.js';
import bcrypt from 'bcrypt';
export const registrarUsuarioService = async (datos) => {
    const {
        nombre, apellido, correo, contrasenia, telefono, fechaNacimiento, genero, tipoUsuario,
        especialidad, certificaciones, experienciaAnios, descripcionPerfil,
        objetivo, nivel, observaciones,
        tokenRegistro // <- el token debe venir del body del formulario
    } = datos;

    // Validar token si es entrenador
    if (tipoUsuario === 'entrenador') {
        const tokenValido = await Token.findOne({ token: tokenRegistro, usado: false });
        if (!tokenValido) {
            throw new Error('Token inválido o ya ha sido usado');
        }

        // Marcar el token como usado
        tokenValido.usado = true;
        await tokenValido.save();
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const nuevoUsuario = new User({
        nombre,
        apellido,
        correo,
        contrasenia: hashedPassword,
        telefono,
        fechaNacimiento,
        genero,
        tipoUsuario
    });

    await nuevoUsuario.save();

    // Según el tipo de usuario, crear también su entidad correspondiente
    if (tipoUsuario === 'entrenador') {
        const nuevoEntrenador = new Entrenador({
            usuarioId: nuevoUsuario._id,
            especialidad,
            certificaciones,
            experienciaAnios,
            descripcionPerfil
        });
        await nuevoEntrenador.save();
    } else if (tipoUsuario === 'cliente') {
        const nuevoCliente = new Client({
            usuarioId: nuevoUsuario._id,
            objetivo,
            nivel,
            observaciones
        });
        await nuevoCliente.save();
    }

    return nuevoUsuario;
};
