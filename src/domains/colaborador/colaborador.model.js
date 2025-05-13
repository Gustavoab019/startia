// domains/colaborador/colaborador.model.js

const mongoose = require('mongoose');

const ColaboradorSchema = new mongoose.Schema({
  telefone: { type: String, required: true, unique: true },
  nome: { type: String },
  tipo: {
    type: String,
    enum: ['colaborador', 'encarregado'],
    default: 'colaborador'
  },
  funcao: { type: String }, // <- NOVO: função real do colaborador

  obras: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Obra' }],
  ferramentas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ferramenta' }],

  etapaCadastro: {
    type: String,
    enum: [
      'novo',
      'menu',
      'criando_obra_nome',
      'criando_obra_endereco',
      // Novos estados para configuração de almoço
      'criando_obra_almoco_inicio',
      'criando_obra_almoco_hora_inicio',
      'criando_obra_almoco_hora_fim',
      'entrando_obra_codigo',
      'ver_tarefas',
      'ver_tarefa_detalhe', // NOVO: estado para visualizar detalhes de uma tarefa
      'criando_tarefa_titulo',
      'criando_tarefa_descricao',
      'criando_tarefa_prazo',
      'criando_tarefa_atribuicao',
      'cadastrando_colab_nome',
      'cadastrando_colab_telefone',
      'cadastrando_colab_tipo',
      'cadastrando_colab_funcao',
      'registrando_presenca',
      'ver_colaboradores',
      'guia_startia',
      'em_obra',
      // Novos estados para problemas
      'relatando_problema_descricao',
      'relatando_problema_foto',
      'vendo_problemas'
    ],
    default: 'novo'
  },

  // Controle de subestados
  subEstado: { type: String },
  subEstadoProblema: { type: String },

  // Temporários para criação de obra
  tempNomeObra: { type: String },
  tempEnderecoObra: { type: String },
  // Novos campos temporários para horário de almoço
  tempHoraInicioAlmoco: { type: String },
  tempHoraFimAlmoco: { type: String },

  // Temporários para criação de tarefa
  tempTituloTarefa: { type: String },
  tempDescricaoTarefa: { type: String },
  tempPrazoTarefa: { type: Date },
  tempColaboradoresDisponiveis: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // NOVO: Temporários para visualização de tarefas
  tempTarefasIds: [{ type: String }],
  tempTarefaSelecionadaId: { type: String },
  tempIndicesPorTarefa: { type: mongoose.Schema.Types.Mixed },

  // Temporários para criação de novo colaborador
  tempNovoNome: { type: String },
  tempNovoTelefone: { type: String },
  tempNovoTipo: { type: String },
  tempNovoFuncao: { type: String },

  // Temporários para problemas
  tempDescricaoProblema: { type: String },
  tempProblemasIds: [{ type: String }],

  ultimoAcesso: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Colaborador', ColaboradorSchema);