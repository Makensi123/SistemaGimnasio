import User from '../models/user.js';
import bcrypt from 'bcrypt';

export const loginUsuarioService = async (correo, password) => {
    const usuario = await User.findOne({ correo });
    if (!usuario) throw new Error('Correo o contraseña incorrectos');

    const coincide = await bcrypt.compare(password, usuario.contrasenia);
    if (!coincide) throw new Error('Correo o contraseña incorrectos');

    return usuario;
};

