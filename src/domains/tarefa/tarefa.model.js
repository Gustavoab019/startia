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
  prazo: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tarefa', TarefaSchema);
