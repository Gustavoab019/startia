// domains/colaborador/colaborador.model.js - VERSÃO ATUALIZADA COM MELHORIAS

const mongoose = require('mongoose');

const ColaboradorSchema = new mongoose.Schema({
  telefone: { type: String, required: true, unique: true },
  nome: { type: String },
  tipo: {
    type: String,
    enum: ['colaborador', 'encarregado'],
    default: 'colaborador'
  },
  funcao: { type: String }, // função real do colaborador

  obras: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Obra' }],
  ferramentas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ferramenta' }],

  etapaCadastro: {
    type: String,
    enum: [
      'novo',
      'coletando_nome', // ✅ ESTADO PARA COLETAR NOME
      'menu',
      'criando_obra_nome',
      'criando_obra_endereco',
      // Estados para configuração de almoço
      'criando_obra_almoco_inicio',
      'criando_obra_almoco_hora_inicio',
      'criando_obra_almoco_hora_fim',
      // Estado para confirmação de obra duplicata
      'confirmando_obra_duplicata',
      'entrando_obra_codigo',
      'ver_tarefas',
      'ver_tarefa_detalhe', // Estado para visualizar detalhes de uma tarefa
      'criando_tarefa_titulo',
      'criando_tarefa_descricao',
      'criando_tarefa_prazo',
      'criando_tarefa_atribuicao',
      
      // ✅ ESTADOS PARA MVP DE UNIDADES:
      'criando_tarefa_unidades',  // Para definir quartos/unidades
      'criando_tarefa_fase',      // Para definir fase (calhas/cortinados/etc)
      'criando_tarefa_confirmacao', // ✅ NOVO: Para confirmar antes de criar
      
      'gerenciando_tarefa_ativa', // ✅ CRÍTICO: Estado para gerenciar tarefa após pegar do POOL
      'selecionando_minha_tarefa', // ✅ CRÍTICO: Estado para selecionar tarefa pessoal
      
      'cadastrando_colab_nome',
      'cadastrando_colab_telefone',
      'cadastrando_colab_tipo',
      'cadastrando_colab_funcao',
      'registrando_presenca',
      'ver_colaboradores',
      'guia_startia',
      'em_obra',
      // Estados para problemas
      'relatando_problema_descricao',
      'relatando_problema_foto',
      'vendo_problemas',
      'gerenciando_tarefa_ativa' // ✅ NOVO ESTADO
    ],
    default: 'novo'
  },

  // Controle de subestados
  subEstado: { type: String },
  subEstadoProblema: { type: String },

  // Temporários para criação de obra
  tempNomeObra: { type: String },
  tempEnderecoObra: { type: String },
  // Campos temporários para horário de almoço
  tempHoraInicioAlmoco: { type: String },
  tempHoraFimAlmoco: { type: String },

  // Temporários para criação de tarefa
  tempTituloTarefa: { type: String },
  tempDescricaoTarefa: { type: String },
  tempPrazoTarefa: { type: Date }, // ✅ CORRIGIDO: era Date antes, mantém consistência
  tempColaboradoresDisponiveis: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // ✅ CAMPOS TEMPORÁRIOS PARA MVP:
  tempUnidadesTarefa: [{ type: String }],  // ["101", "102", "103"]
  tempFaseTarefa: { type: String },        // "calhas", "cortinados", "acabamento"
  tempPrazoTarefaFinal: { type: Date },    // ✅ NOVO: para armazenar prazo parseado
  
  // Temporários para visualização de tarefas
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

// Índices para melhor performance
ColaboradorSchema.index({ telefone: 1 });
ColaboradorSchema.index({ obras: 1 });
ColaboradorSchema.index({ etapaCadastro: 1 });
ColaboradorSchema.index({ nome: 1 });

// ✅ MIDDLEWARE CORRIGIDO para limpeza automática de dados temporários
ColaboradorSchema.pre('save', function(next) {
  // Se mudou de estado e não está mais criando obra, limpar dados temporários de obra
  if (this.isModified('etapaCadastro') && 
      !this.etapaCadastro.startsWith('criando_obra_') && 
      this.etapaCadastro !== 'confirmando_obra_duplicata') {
    this.tempNomeObra = undefined;
    this.tempEnderecoObra = undefined;
    this.tempHoraInicioAlmoco = undefined;
    this.tempHoraFimAlmoco = undefined;
  }
  
  // ✅ CORRIGIDO: Se mudou de estado e não está mais criando tarefa, limpar dados temporários de tarefa
  if (this.isModified('etapaCadastro') && 
      !this.etapaCadastro.startsWith('criando_tarefa_')) {
    this.tempTituloTarefa = undefined;
    this.tempDescricaoTarefa = undefined;
    this.tempPrazoTarefa = undefined;
    this.tempColaboradoresDisponiveis = undefined;
    
    // ✅ NOVOS CAMPOS NA LIMPEZA:
    this.tempUnidadesTarefa = undefined;
    this.tempFaseTarefa = undefined;
    this.tempPrazoTarefaFinal = undefined;
  }
  
  // Se mudou de estado e não está mais cadastrando colaborador, limpar dados temporários
  if (this.isModified('etapaCadastro') && 
      !this.etapaCadastro.startsWith('cadastrando_colab_')) {
    this.tempNovoNome = undefined;
    this.tempNovoTelefone = undefined;
    this.tempNovoTipo = undefined;
    this.tempNovoFuncao = undefined;
  }
  
  // Se mudou de estado e não está mais relatando problema, limpar dados temporários
  if (this.isModified('etapaCadastro') && 
      !this.etapaCadastro.startsWith('relatando_problema_')) {
    this.tempDescricaoProblema = undefined;
  }
  
  next();
});

// Middleware para garantir que nome seja sempre trimmed
ColaboradorSchema.pre('save', function(next) {
  if (this.nome && typeof this.nome === 'string') {
    this.nome = this.nome.trim();
    
    // Se nome ficar vazio após trim, definir como undefined
    if (this.nome === '') {
      this.nome = undefined;
    }
  }
  next();
});

// ✅ MÉTODO ATUALIZADO para verificar se o colaborador está em um fluxo ativo
ColaboradorSchema.methods.estaEmFluxo = function() {
  const estadosFluxo = [
    'criando_obra_nome', 'criando_obra_endereco', 'criando_obra_almoco_inicio',
    'criando_obra_almoco_hora_inicio', 'criando_obra_almoco_hora_fim', 'confirmando_obra_duplicata',
    'criando_tarefa_titulo', 'criando_tarefa_descricao', 'criando_tarefa_prazo', 'criando_tarefa_atribuicao',
    
    // ✅ INCLUIR NOVOS ESTADOS NO FLUXO:
    'criando_tarefa_unidades', 'criando_tarefa_fase', 'criando_tarefa_confirmacao',
    'gerenciando_tarefa_ativa', // ✅ CRÍTICO: Adicionar aqui também!
    
    'cadastrando_colab_nome', 'cadastrando_colab_telefone', 'cadastrando_colab_tipo', 'cadastrando_colab_funcao',
    'relatando_problema_descricao', 'relatando_problema_foto',
    'coletando_nome' // ✅ INCLUIR ESTADO DE COLETA DE NOME
  ];
  
  return estadosFluxo.includes(this.etapaCadastro);
};

// Método para obter obra ativa (primeira da lista ou subEstado)
ColaboradorSchema.methods.obterObraAtiva = function() {
  if (this.subEstado && mongoose.Types.ObjectId.isValid(this.subEstado)) {
    return this.subEstado;
  }
  
  if (this.obras && this.obras.length > 0) {
    return this.obras[0];
  }
  
  return null;
};

// ✅ MÉTODO ATUALIZADO para limpar todos os dados temporários
ColaboradorSchema.methods.limparDadosTemporarios = async function() {
  this.tempNomeObra = undefined;
  this.tempEnderecoObra = undefined;
  this.tempHoraInicioAlmoco = undefined;
  this.tempHoraFimAlmoco = undefined;
  this.tempTituloTarefa = undefined;
  this.tempDescricaoTarefa = undefined;
  this.tempPrazoTarefa = undefined;
  this.tempColaboradoresDisponiveis = undefined;
  
  // ✅ NOVOS CAMPOS NA LIMPEZA MANUAL:
  this.tempUnidadesTarefa = undefined;
  this.tempFaseTarefa = undefined;
  this.tempPrazoTarefaFinal = undefined;
  
  this.tempTarefasIds = undefined;
  this.tempTarefaSelecionadaId = undefined;
  this.tempIndicesPorTarefa = undefined;
  this.tempNovoNome = undefined;
  this.tempNovoTelefone = undefined;
  this.tempNovoTipo = undefined;
  this.tempNovoFuncao = undefined;
  this.tempDescricaoProblema = undefined;
  this.tempProblemasIds = undefined;
  
  return await this.save();
};

// ✅ MÉTODO PARA VERIFICAR SE PRECISA DEFINIR NOME
ColaboradorSchema.methods.precisaDefinirNome = function() {
  return !this.nome || this.nome.trim().length < 2;
};

// ✅ MÉTODO PARA OBTER SAUDAÇÃO
ColaboradorSchema.methods.obterSaudacao = function() {
  if (this.nome && this.nome.trim()) {
    return `Olá, ${this.nome.trim()}!`;
  }
  return 'Olá!';
};

// ✅ MÉTODO PARA OBTER NOME DE EXIBIÇÃO
ColaboradorSchema.methods.obterNomeExibicao = function() {
  if (this.nome && this.nome.trim()) {
    return this.nome.trim();
  }
  return 'Colaborador';
};

// ✅ MÉTODO PARA DEFINIR NOME COM VALIDAÇÃO
ColaboradorSchema.methods.definirNome = async function(novoNome) {
  if (!novoNome || typeof novoNome !== 'string' || novoNome.trim().length < 2) {
    throw new Error('Nome deve ter pelo menos 2 caracteres');
  }
  
  this.nome = novoNome.trim();
  return await this.save();
};

// Método estático para buscar por telefone normalizado
ColaboradorSchema.statics.buscarPorTelefone = function(telefone) {
  const telefoneNormalizado = telefone.replace(/\D/g, '');
  return this.findOne({ telefone: telefoneNormalizado });
};

// Virtual para verificar se tem nome válido
ColaboradorSchema.virtual('temNomeValido').get(function() {
  return this.nome && this.nome.trim().length >= 2;
});

// Virtual para nome completo formatado
ColaboradorSchema.virtual('nomeCompleto').get(function() {
  let nome = this.obterNomeExibicao();
  
  if (this.funcao && this.funcao.trim()) {
    nome += ` (${this.funcao.trim()})`;
  }
  
  return nome;
});

// Virtual para estatísticas básicas
ColaboradorSchema.virtual('estatisticas').get(function() {
  return {
    temNome: this.temNomeValido,
    totalObras: this.obras ? this.obras.length : 0,
    emFluxo: this.estaEmFluxo(),
    ultimoAcesso: this.ultimoAcesso,
    diasSemAcesso: Math.floor((new Date() - this.ultimoAcesso) / (1000 * 60 * 60 * 24))
  };
});

// ✅ MÉTODO DE DEBUG ATUALIZADO
ColaboradorSchema.methods.debug = function() {
  console.log('🔍 DEBUG COLABORADOR:');
  console.log('======================');
  console.log('🆔 ID:', this._id);
  console.log('📱 Telefone:', this.telefone);
  console.log('👤 Nome:', `"${this.nome || 'undefined'}"`);
  console.log('🏷️ Tipo:', this.tipo);
  console.log('💼 Função:', this.funcao || 'não definida');
  console.log('🎯 Etapa:', this.etapaCadastro);
  console.log('🏗️ Obras:', this.obras || []);
  console.log('📍 SubEstado:', this.subEstado || 'não definido');
  console.log('✅ Tem nome válido?', this.temNomeValido);
  console.log('🔄 Em fluxo?', this.estaEmFluxo());
  console.log('📊 Estatísticas:', this.estatisticas);
  
  // ✅ DEBUG DOS CAMPOS TEMPORÁRIOS DE TAREFA:
  console.log('📝 Temp Título:', this.tempTituloTarefa || 'não definido');
  console.log('🏠 Temp Unidades:', this.tempUnidadesTarefa || 'não definido');
  console.log('🔧 Temp Fase:', this.tempFaseTarefa || 'não definido');
  console.log('📅 Temp Prazo:', this.tempPrazoTarefaFinal || 'não definido');
  console.log('======================');
};

module.exports = mongoose.model('Colaborador', ColaboradorSchema);