import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/user.js'; // Ajusta la ruta si es necesario

async function crearAdmin() {
    try {
        await mongoose.connect('mongodb://localhost:27017/GimnacioAplication');
        
        // Buscar si ya existe un admin
        const existeAdmin = await User.findOne({ tipoUsuario: 'administrador' });
        if (existeAdmin) {
            console.log('Ya existe un administrador');
            await mongoose.disconnect();
            return;
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const contraseniaHasheada = await bcrypt.hash('123456', salt);

        // Crear nuevo admin
        const admin = new User({
            nombre: 'Admin',
            apellido: 'Admin',
            telefono: '1234567890',
            fechaNacimiento: new Date('2000-01-01'),
            genero: 'Masculino',
            correo: 'admin@gmail.com',
            contrasenia: contraseniaHasheada,
            tipoUsuario: 'administrador',
            estado: 'activo',
            verificado: true,
        });

        await admin.save();
        console.log('Administrador creado con éxito');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error creando admin:', error);
    }
}

crearAdmin();
// Asegúrate de que la base de datos esté corriendo y que tengas los permisos necesarios