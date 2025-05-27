const mongoose = require('mongoose');

// Adicionar campo para vincular à tarefa
const ProblemaSchema = new mongoose.Schema({
  obra: { type: mongoose.Schema.Types.ObjectId, ref: 'Obra', required: true },
  relator: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  tarefa: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarefa' }, // ✅ NOVO CAMPO
  descricao: { type: String, required: true },
  status: { type: String, enum: ['aberto', 'em_analise', 'resolvido'], default: 'aberto' },
  fotoUrl: { type: String },
  fotoPublicId: { type: String },
  dataRelato: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Problema', ProblemaSchema);