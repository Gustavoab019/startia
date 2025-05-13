// Correção no obra.model.js
const mongoose = require('mongoose');

const ObraSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  endereco: { type: String },
  // Renomear para codigoAcesso para manter consistência
  codigoAcesso: { type: String, required: true, unique: true },
  responsavel: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Colaborador' 
  },
  // Adicionando também o campo para armazenar o telefone do responsável
  responsavelTelefone: { type: String },
  colaboradores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador' }],
  tarefas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarefa' }],
  
  // Campos para controle de horário de almoço
  horaInicioAlmoco: { 
    type: String, 
    default: '12:00',
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} não é um formato de hora válido (HH:MM)`
    }
  },
  horaFimAlmoco: { 
    type: String, 
    default: '13:00',
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} não é um formato de hora válido (HH:MM)`
    }
  },
  duracaoAlmocoMinutos: { 
    type: Number, 
    default: 60,
    min: [0, 'A duração do almoço não pode ser negativa'],
    max: [240, 'A duração do almoço não pode exceder 4 horas']
  },
  
  status: { type: String, enum: ['ativa', 'concluida', 'suspensa'], default: 'ativa' },
  dataCriacao: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Método para calcular a duração do almoço a partir das horas de início e fim
ObraSchema.pre('save', function(next) {
  if (this.horaInicioAlmoco && this.horaFimAlmoco) {
    const [horaInicio, minInicio] = this.horaInicioAlmoco.split(':').map(Number);
    const [horaFim, minFim] = this.horaFimAlmoco.split(':').map(Number);
    
    const inicioMinutos = horaInicio * 60 + minInicio;
    const fimMinutos = horaFim * 60 + minFim;
    
    // Lidar com casos onde o almoço cruza a meia-noite (incomum, mas possível)
    if (fimMinutos > inicioMinutos) {
      this.duracaoAlmocoMinutos = fimMinutos - inicioMinutos;
    } else {
      // Se fim < início, assumimos que cruza a meia-noite
      this.duracaoAlmocoMinutos = (24 * 60 - inicioMinutos) + fimMinutos;
    }
  }
  next();
});

module.exports = mongoose.model('Obra', ObraSchema);