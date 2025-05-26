import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    usado: { type: Boolean, default: false },  // Para marcar si ya fue usado
    creadoEn: { type: Date, default: Date.now },
});

const Token = mongoose.model('Token', tokenSchema);
export default Token;
