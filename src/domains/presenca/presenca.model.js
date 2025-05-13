const mongoose = require('mongoose');

const PresencaSchema = new mongoose.Schema({
  colaborador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colaborador',
    required: true
  },
  obra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Obra',
    required: true
  },
  dataEntrada: {
    type: Date,
    default: Date.now,
    required: true
  },
  dataSaida: {
    type: Date,
    default: null
  },
  tipo: {
    type: String,
    enum: ['entrada', 'saida'],
    default: 'entrada'
  },
  horasTrabalhadas: {
    type: Number,
    default: 0,
    min: 0
  },
  descontoAlmoco: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pendente', 'completo'],
    default: 'pendente',
    required: true
  },
  observacoes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para otimizar consultas frequentes
PresencaSchema.index({ colaborador: 1, dataEntrada: -1 });
PresencaSchema.index({ obra: 1, dataEntrada: -1 });
PresencaSchema.index({ colaborador: 1, obra: 1, dataEntrada: -1 });
PresencaSchema.index({ status: 1 });

/**
 * Calcula horas trabalhadas
 * @param {Object} configAlmoco - Configuração de almoço
 * @returns {Number} Horas trabalhadas
 */
PresencaSchema.methods.calcularHorasTrabalhadas = function(configAlmoco) {
  if (!this.dataEntrada || !this.dataSaida) return 0;
  
  // Garantir que temos objetos Date
  const entrada = new Date(this.dataEntrada);
  const saida = new Date(this.dataSaida);
  
  // Verificar datas válidas
  if (isNaN(entrada.getTime()) || isNaN(saida.getTime())) {
    return 0;
  }
  
  // Calcular diferença em milissegundos
  const diferencaMs = saida - entrada;
  
  // Se saída for antes da entrada (erro), retornar 0
  if (diferencaMs <= 0) return 0;
  
  // Converter para horas
  let horas = diferencaMs / (1000 * 60 * 60);
  
  // Descontar almoço se aplicável
  if (this.descontoAlmoco && configAlmoco && configAlmoco.duracaoAlmocoMinutos > 0) {
    const descontoHoras = configAlmoco.duracaoAlmocoMinutos / 60;
    horas = Math.max(0, horas - descontoHoras); // Garantir que não seja negativo
  }
  
  // Arredondar para duas casas decimais
  return Math.round(horas * 100) / 100;
};

// Virtual para data formatada (para agrupamento por dia)
PresencaSchema.virtual('dataFormatada').get(function() {
  if (!this.dataEntrada) return '';
  
  const data = new Date(this.dataEntrada);
  if (isNaN(data.getTime())) return '';
  
  return data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
});

// Virtual para hora de entrada formatada
PresencaSchema.virtual('horaEntradaFormatada').get(function() {
  if (!this.dataEntrada) return '';
  
  const data = new Date(this.dataEntrada);
  if (isNaN(data.getTime())) return '';
  
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
});

// Virtual para hora de saída formatada
PresencaSchema.virtual('horaSaidaFormatada').get(function() {
  if (!this.dataSaida) return '';
  
  const data = new Date(this.dataSaida);
  if (isNaN(data.getTime())) return '';
  
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
});

// Middleware para validar datas antes de salvar
PresencaSchema.pre('save', function(next) {
  // Verificar se dataSaida é posterior à dataEntrada
  if (this.dataSaida && this.dataEntrada) {
    if (new Date(this.dataSaida) <= new Date(this.dataEntrada)) {
      const err = new Error('Data de saída deve ser posterior à data de entrada');
      return next(err);
    }
  }
  
  // Verificar se status é compatível com as datas
  if (this.status === 'completo' && !this.dataSaida) {
    const err = new Error('Registros completos devem ter data de saída');
    return next(err);
  }
  
  // Verificar se tipo é compatível com status
  if (this.status === 'completo' && this.tipo !== 'saida') {
    this.tipo = 'saida'; // Corrigir automaticamente
  }
  
  next();
});

module.exports = mongoose.model('Presenca', PresencaSchema);