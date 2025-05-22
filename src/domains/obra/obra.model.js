// domains/obra/obra.model.js - VERSÃO CORRIGIDA

const mongoose = require('mongoose');
const gerarCodigo = require('../../utils/gerarCodigo');

const ObraSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: [true, 'Nome da obra é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter pelo menos 3 caracteres']
  },
  endereco: { 
    type: String, 
    required: [true, 'Endereço da obra é obrigatório'],
    trim: true,
    minlength: [5, 'Endereço deve ter pelo menos 5 caracteres']
  },
  responsavel: { 
    type: String, 
    required: [true, 'Telefone do responsável é obrigatório']
  },
  responsavelId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Colaborador',
    required: [true, 'ID do responsável é obrigatório']
  },
  
  // ✅ CORREÇÃO PRINCIPAL: Campo correto é codigoAcesso, não codigo
  codigoAcesso: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true,
    default: function() {
      return gerarCodigo(6);
    }
  },
  
  // Remover o campo 'codigo' se existir para evitar conflitos
  // codigo: undefined, // ← Remover esta linha se existir
  
  colaboradores: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Colaborador' 
  }],
  
  // Configurações de horário de almoço
  horaInicioAlmoco: { 
    type: String, 
    default: '12:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(v);
      },
      message: 'Formato de hora inválido. Use HH:MM'
    }
  },
  horaFimAlmoco: { 
    type: String, 
    default: '13:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(v);
      },
      message: 'Formato de hora inválido. Use HH:MM'
    }
  },
  
  // Status da obra
  status: {
    type: String,
    enum: ['ativa', 'pausada', 'concluida', 'cancelada'],
    default: 'ativa'
  },
  
  // Metadados
  dataInicio: { 
    type: Date, 
    default: Date.now 
  },
  dataConclusao: { 
    type: Date 
  },
  
  // Configurações adicionais
  configuracoes: {
    permitirRegistroPresencaFora: { type: Boolean, default: false },
    notificarProblemas: { type: Boolean, default: true },
    requererFotoProblemas: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// ✅ ÍNDICES CORRETOS
ObraSchema.index({ codigoAcesso: 1 }, { unique: true });
ObraSchema.index({ responsavelId: 1 });
ObraSchema.index({ colaboradores: 1 });
ObraSchema.index({ status: 1 });

// ✅ MIDDLEWARE PRE-SAVE para garantir código único
ObraSchema.pre('save', async function(next) {
  // Se é um novo documento e não tem código, gerar um
  if (this.isNew && !this.codigoAcesso) {
    let codigoUnico = false;
    let codigo;
    let tentativas = 0;
    const maxTentativas = 10;
    
    while (!codigoUnico && tentativas < maxTentativas) {
      codigo = gerarCodigo(6);
      
      // Verificar se já existe
      const obraExistente = await this.constructor.findOne({ codigoAcesso: codigo });
      if (!obraExistente) {
        codigoUnico = true;
        this.codigoAcesso = codigo;
      }
      tentativas++;
    }
    
    if (!codigoUnico) {
      return next(new Error('Não foi possível gerar código único para a obra'));
    }
  }
  
  next();
});

// ✅ MÉTODOS DE INSTÂNCIA
ObraSchema.methods.adicionarColaborador = function(colaboradorId) {
  if (!this.colaboradores.includes(colaboradorId)) {
    this.colaboradores.push(colaboradorId);
  }
  return this.save();
};

ObraSchema.methods.removerColaborador = function(colaboradorId) {
  this.colaboradores = this.colaboradores.filter(
    id => id.toString() !== colaboradorId.toString()
  );
  return this.save();
};

ObraSchema.methods.isResponsavel = function(colaboradorId) {
  return this.responsavelId.toString() === colaboradorId.toString();
};

// ✅ MÉTODOS ESTÁTICOS
ObraSchema.statics.buscarPorCodigo = function(codigo) {
  return this.findOne({ codigoAcesso: codigo.toUpperCase() });
};

ObraSchema.statics.obrasDoColaborador = function(colaboradorId) {
  return this.find({
    $or: [
      { responsavelId: colaboradorId },
      { colaboradores: colaboradorId }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Obra', ObraSchema);

/*
=== INSTRUÇÕES PARA CORREÇÃO ===

1. PROBLEMA IDENTIFICADO:
   - Existe um índice único no campo 'codigo' (provavelmente antigo)
   - O campo correto deveria ser 'codigoAcesso'
   - Campo 'codigo' está sendo definido como null

2. SOLUÇÕES:

   OPÇÃO A - Remover índice antigo (RECOMENDADO):
   Execute no MongoDB:
   ```
   db.obras.dropIndex("codigo_1")
   ```

   OPÇÃO B - Remover documentos com codigo null:
   ```
   db.obras.deleteMany({ codigo: null })
   ```

   OPÇÃO C - Atualizar documentos existentes:
   ```
   db.obras.updateMany(
     { codigo: null }, 
     { $unset: { codigo: "" }, $set: { codigoAcesso: "TEMP" + Math.random().toString(36).substr(2, 6).toUpperCase() } }
   )
   ```

3. VERIFICAÇÃO:
   Execute para ver índices atuais:
   ```
   db.obras.getIndexes()
   ```

4. APÓS CORREÇÃO:
   - Substitua o modelo da obra pelo código acima
   - Reinicie a aplicação
   - Teste criação de nova obra
*/