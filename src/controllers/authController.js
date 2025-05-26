import { loginUsuarioService } from '../services/authService.js';

export const loginUsuario = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const usuario = await loginUsuarioService(correo, password);
        req.session.usuario = usuario;

        // Redireccionar según el tipo de usuario
        if (usuario.tipoUsuario === 'cliente') {
            res.redirect('/client/dashboard');
        } else if (usuario.tipoUsuario === 'entrenador') {
            res.redirect('/entrenador/dashboard');
        } else if (usuario.tipoUsuario === 'administrador') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/'); // fallback
        }
    } catch (error) {
        res.status(401).send(error.message);
    }
};
