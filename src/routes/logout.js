import express from 'express';
import {Router} from 'express';

const router = Router();
// Ruta para cerrar sesión
router.get('/', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/'); // Redirige a la página de inicio después de cerrar sesión
    });
});

export default router;