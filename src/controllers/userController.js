import { registrarUsuarioService } from '../services/userService.js';

export const registrarUsuario = async (req, res) => {
    try {
        console.log(req.body); // 👈 Verifica aquí si llegan objetivo, nivel y observaciones
        const resultado = await registrarUsuarioService(req.body);
        res.redirect('/'); // Redirige a la página de inicio de sesión después del registro exitoso
    } catch (error) {
        if (error.message === 'Token inválido o ya ha sido usado') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};