// src/domains/tarefa/tarefa.model.js - VERSÃO SIMPLES E FUNCIONAL

const mongoose = require('mongoose');

const TarefaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'concluida'],
    default: 'pendente'
  },
  obra: { type: mongoose.Schema.Types.ObjectId, ref: 'Obra', required: true },
  atribuidaPara: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador' }],
  prazo: { type: Date },
  
  // ✅ CAMPOS MVP
  unidade: { type: String }, // "101", "102", "201", etc.
  fase: { type: String },    // "calhas", "cortinados", "acabamento"
  andar: { type: Number }    // 1, 2, 3, 4, 5
}, {
  timestamps: true
});

// ✅ ÍNDICES ESSENCIAIS APENAS
TarefaSchema.index({ obra: 1, andar: 1, unidade: 1 });
TarefaSchema.index({ obra: 1, status: 1, andar: 1 });
TarefaSchema.index({ atribuidaPara: 1, status: 1 });

module.exports = mongoose.model('Tarefa', TarefaSchema);