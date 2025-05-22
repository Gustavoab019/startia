// domains/obra/obra.service.js - VERSÃO CORRIGIDA

const Obra = require('./obra.model');
const gerarCodigo = require('../../utils/gerarCodigo');

/**
 * Cria uma nova obra
 * @param {Object} dadosObra - Dados da obra
 * @returns {Promise<Obra>} Obra criada
 */
async function criarObra(dadosObra) {
  try {
    console.log('🏗️ Criando nova obra com dados:', dadosObra);
    
    // Garantir que o código seja gerado se não fornecido
    if (!dadosObra.codigoAcesso) {
      dadosObra.codigoAcesso = await gerarCodigoUnico();
    }
    
    // Validar dados obrigatórios
    if (!dadosObra.nome || dadosObra.nome.trim().length < 3) {
      throw new Error('Nome da obra deve ter pelo menos 3 caracteres');
    }
    
    if (!dadosObra.endereco || dadosObra.endereco.trim().length < 5) {
      throw new Error('Endereço da obra deve ter pelo menos 5 caracteres');
    }
    
    if (!dadosObra.responsavelId) {
      throw new Error('ID do responsável é obrigatório');
    }
    
    // Criar a obra
    const novaObra = new Obra({
      nome: dadosObra.nome.trim(),
      endereco: dadosObra.endereco.trim(),
      responsavel: dadosObra.responsavel,
      responsavelId: dadosObra.responsavelId,
      codigoAcesso: dadosObra.codigoAcesso,
      horaInicioAlmoco: dadosObra.horaInicioAlmoco || '12:00',
      horaFimAlmoco: dadosObra.horaFimAlmoco || '13:00',
      colaboradores: [dadosObra.responsavelId] // Adicionar responsável como colaborador
    });
    
    const obraSalva = await novaObra.save();
    console.log('✅ Obra criada com sucesso:', obraSalva._id, 'Código:', obraSalva.codigoAcesso);
    
    return obraSalva;
    
  } catch (error) {
    console.error('❌ Erro ao criar obra:', error.message);
    
    // Tratar erros específicos
    if (error.code === 11000) {
      if (error.message.includes('codigoAcesso')) {
        // Tentar gerar novo código se houve conflito
        console.log('🔄 Conflito de código, tentando gerar novo...');
        dadosObra.codigoAcesso = await gerarCodigoUnico();
        return await criarObra(dadosObra);
      }
    }
    
    throw error;
  }
}

/**
 * Gera um código único para a obra
 * @returns {Promise<String>} Código único
 */
async function gerarCodigoUnico() {
  let codigoUnico = false;
  let codigo;
  let tentativas = 0;
  const maxTentativas = 20;
  
  while (!codigoUnico && tentativas < maxTentativas) {
    codigo = gerarCodigo(6);
    
    // Verificar se já existe
    const obraExistente = await Obra.findOne({ codigoAcesso: codigo });
    if (!obraExistente) {
      codigoUnico = true;
    }
    tentativas++;
  }
  
  if (!codigoUnico) {
    throw new Error('Não foi possível gerar código único após várias tentativas');
  }
  
  return codigo;
}

/**
 * Busca obra por código de acesso
 * @param {String} codigo - Código de acesso
 * @returns {Promise<Obra|null>} Obra encontrada ou null
 */
async function buscarObraPorCodigo(codigo) {
  try {
    if (!codigo || typeof codigo !== 'string') {
      return null;
    }
    
    const obra = await Obra.findOne({ 
      codigoAcesso: codigo.toUpperCase().trim() 
    }).populate('responsavelId', 'nome telefone');
    
    return obra;
  } catch (error) {
    console.error('❌ Erro ao buscar obra por código:', error);
    return null;
  }
}

/**
 * Obter obra ativa do colaborador
 * @param {Object} colaborador - Objeto colaborador
 * @returns {Promise<Obra|null>} Obra ativa ou null
 */
async function obterObraAtiva(colaborador) {
  try {
    let obraId = null;
    
    // Priorizar subEstado se válido
    if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
      obraId = colaborador.subEstado;
    }
    // Senão, usar primeira obra da lista
    else if (colaborador.obras && colaborador.obras.length > 0) {
      obraId = colaborador.obras[0];
    }
    
    if (!obraId) {
      return null;
    }
    
    const obra = await Obra.findById(obraId)
      .populate('responsavelId', 'nome telefone')
      .populate('colaboradores', 'nome telefone funcao');
    
    return obra;
  } catch (error) {
    console.error('❌ Erro ao obter obra ativa:', error);
    return null;
  }
}

/**
 * Listar obras do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Array>} Lista de obras
 */
async function listarObrasDoColaborador(colaboradorId) {
  try {
    const obras = await Obra.find({
      $or: [
        { responsavelId: colaboradorId },
        { colaboradores: colaboradorId }
      ]
    })
    .populate('responsavelId', 'nome telefone')
    .sort({ createdAt: -1 });
    
    return obras;
  } catch (error) {
    console.error('❌ Erro ao listar obras do colaborador:', error);
    return [];
  }
}

/**
 * Atualizar obra
 * @param {String} obraId - ID da obra
 * @param {Object} dadosAtualizacao - Dados para atualização
 * @returns {Promise<Obra>} Obra atualizada
 */
async function atualizarObra(obraId, dadosAtualizacao) {
  try {
    const obra = await Obra.findByIdAndUpdate(
      obraId,
      dadosAtualizacao,
      { new: true, runValidators: true }
    );
    
    if (!obra) {
      throw new Error('Obra não encontrada');
    }
    
    return obra;
  } catch (error) {
    console.error('❌ Erro ao atualizar obra:', error);
    throw error;
  }
}

/**
 * Adicionar colaborador à obra
 * @param {String} obraId - ID da obra
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Obra>} Obra atualizada
 */
async function adicionarColaboradorNaObra(obraId, colaboradorId) {
  try {
    const obra = await Obra.findById(obraId);
    
    if (!obra) {
      throw new Error('Obra não encontrada');
    }
    
    // Verificar se colaborador já está na obra
    const jaExiste = obra.colaboradores.some(
      id => id.toString() === colaboradorId.toString()
    );
    
    if (!jaExiste) {
      obra.colaboradores.push(colaboradorId);
      await obra.save();
    }
    
    return obra;
  } catch (error) {
    console.error('❌ Erro ao adicionar colaborador na obra:', error);
    throw error;
  }
}

/**
 * Remover colaborador da obra
 * @param {String} obraId - ID da obra
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Obra>} Obra atualizada
 */
async function removerColaboradorDaObra(obraId, colaboradorId) {
  try {
    const obra = await Obra.findById(obraId);
    
    if (!obra) {
      throw new Error('Obra não encontrada');
    }
    
    // Não permitir remover o responsável
    if (obra.responsavelId.toString() === colaboradorId.toString()) {
      throw new Error('Não é possível remover o responsável da obra');
    }
    
    obra.colaboradores = obra.colaboradores.filter(
      id => id.toString() !== colaboradorId.toString()
    );
    
    await obra.save();
    return obra;
  } catch (error) {
    console.error('❌ Erro ao remover colaborador da obra:', error);
    throw error;
  }
}

/**
 * Estatísticas da obra
 * @param {String} obraId - ID da obra
 * @returns {Promise<Object>} Estatísticas
 */
async function obterEstatisticasObra(obraId) {
  try {
    const obra = await Obra.findById(obraId);
    
    if (!obra) {
      throw new Error('Obra não encontrada');
    }
    
    // Aqui você pode adicionar mais estatísticas conforme necessário
    const stats = {
      totalColaboradores: obra.colaboradores.length,
      responsavel: obra.responsavelId,
      dataInicio: obra.dataInicio,
      status: obra.status,
      diasAtivos: Math.floor((new Date() - obra.dataInicio) / (1000 * 60 * 60 * 24))
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas da obra:', error);
    throw error;
  }
}

module.exports = {
  criarObra,
  gerarCodigoUnico,
  buscarObraPorCodigo,
  obterObraAtiva,
  listarObrasDoColaborador,
  atualizarObra,
  adicionarColaboradorNaObra,
  removerColaboradorDaObra,
  obterEstatisticasObra
};