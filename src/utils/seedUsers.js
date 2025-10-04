import userRepository from '../repositories/UserRepository.js';
import roleRepository from '../repositories/RoleRepository.js';
import bcrypt from 'bcrypt';

export default async function seedUsers() {
    try {
        // Verificar que los roles existan
        const userRole = await roleRepository.findByName('user');
        const adminRole = await roleRepository.findByName('admin');
        
        if (!userRole || !adminRole) {
            console.log('Los roles no existen. Ejecuta seedRoles primero.');
            return;
        }

        // Crear usuario administrador 
        const existingRafael = await userRepository.getByEmail('rafael.garcia.c@tecsup.edu.pe');
        if (!existingRafael) {
            const hashedPasswordRafael = await bcrypt.hash('Admin123@', 10);
            await userRepository.create({
                email: 'rafael.garcia.c@tecsup.edu.pe',
                password: hashedPasswordRafael,
                name: 'Rafael',
                lastName: 'García',
                phoneNumber: '+51987654321',
                birthdate: new Date('2006-04-25'),
                url_profile: 'https://github.com/Rafael-129',
                adress: 'Lima, Perú',
                roles: [adminRole._id]
            });
            console.log('✅ Usuario administrador creado: rafael.garcia.c@tecsup.edu.pe');
        }

        console.log('\n🎉 Seed de usuarios completado exitosamente!');
        console.log('\n📋 Usuario administrador creado:');
        console.log('👑 ADMINISTRADOR:');
        console.log('   • rafael.garcia.c@tecsup.edu.pe (password: Admin123@)');
        console.log('\n💡 Los usuarios normales se pueden registrar desde la página web en: /signup.html');

    } catch (error) {
        console.error('❌ Error al crear usuario administrador:', error);
    }
}