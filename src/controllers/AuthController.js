import authService from '../services/AuthService.js';

class AuthController {

    async signUp(req, res, next) {
        try {
            const { email, password, name, lastName, phoneNumber, birthdate, url_profile, adress } = req.body;
            
            // Validaciones básicas
            if (!email || !password || !name || !lastName || !phoneNumber || !birthdate) {
                return res.status(400).json({ 
                    message: 'Email, contraseña, nombre, apellido, teléfono y fecha de nacimiento son requeridos' 
                });
            }
            
            const payload = {
                email,
                password,
                name,
                lastName,
                phoneNumber,
                birthdate: new Date(birthdate),
                url_profile: url_profile || '',
                adress: adress || ''
            };
            
            const user = await authService.signUp(payload);
            return res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async signIn(req, res, next) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) 
                return res.status(400).json({ message: 'El email y password son requeridos' });
            
            const token = await authService.signIn({ email, password });
            return res.status(200).json(token);
        } catch (err) {
            next(err);
        }
    }
}

export default new AuthController();
