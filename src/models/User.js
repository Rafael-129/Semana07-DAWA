import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true,
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        validate: {
            validator: function(v) {
                // Al menos 1 mayúscula, 1 dígito, 1 carácter especial
                return /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%&*@])[A-Za-z\d#$%&*@]/.test(v);
            },
            message: 'La contraseña debe contener al menos 1 mayúscula, 1 dígito y 1 carácter especial (#$%&*@)'
        }
    },
    roles: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role' 
    }],
    name: { 
        type: String
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    birthdate: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                // Verificar que la persona tenga al menos 13 años
                const today = new Date();
                const birthDate = new Date(v);
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                return age >= 13;
            },
            message: 'Debes tener al menos 13 años para registrarte'
        }
    },
    url_profile: {
        type: String,
        trim: true
    },
    adress: {
        type: String,
        trim: true
    }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
