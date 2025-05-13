const mongoose = require('mongoose');

const ProblemaSchema = new mongoose.Schema({
  obra: { type: mongoose.Schema.Types.ObjectId, ref: 'Obra', required: true },
  relator: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ['aberto', 'em_analise', 'resolvido'], default: 'aberto' },
  fotoUrl: { type: String }, // URL da imagem no S3 (opcional)
  fotoPublicId: { type: String }, // ID público da imagem (para controle)
  dataRelato: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Problema', ProblemaSchema);