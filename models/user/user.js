import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            maxlength: [50, 'Name cannot be more than 50 characters']
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        countryCode:{
            type: String
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        program: {
            type: String,
            required: [true, 'Please select a program']

        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false
        },
        avatar: {
            type: String,
            default: null,
        },

        googleId: {
            type: String,
            default: null,
        },

        provider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        isActive: {
            type: Boolean,
            default: true
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        otp: {
            type: String,
            default: null,
        },

        otpExpireAt: {
            type: Date,
            default: null,
        },
        otpVerifiedForResetPassword: {
            type: Boolean,
            default: false,
        },

    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
