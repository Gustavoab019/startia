// src/domains/colaborador/colaborador.service.js - VERSÃO COMPLETA

const Colaborador = require('./colaborador.model');
const mongoose = require('mongoose');

/**
 * Busca colaborador por telefone. Se não existir, cria.
 * @param {String} telefone - Telefone no formato internacional (ex: 351912345678)
 * @returns {Promise<Colaborador>}
 */
async function obterOuCriarColaborador(telefone) {
  try {
    console.log(`🔍 Buscando colaborador com telefone: ${telefone}`);
    
    // Normalizar telefone (remover espaços e caracteres especiais)
    const telefoneNormalizado = telefone.replace(/\D/g, '');
    
    let colaborador = await Colaborador.findOne({ telefone: telefoneNormalizado });

    if (!colaborador) {
      console.log(`👤 Criando novo colaborador: ${telefoneNormalizado}`);
      
      colaborador = new Colaborador({
        telefone: telefoneNormalizado,
        etapaCadastro: 'novo',
        ultimoAcesso: new Date()
      });
      
      await colaborador.save();
      console.log(`✅ Novo colaborador criado com ID: ${colaborador._id}`);
    } else {
      console.log(`✅ Colaborador encontrado: ${colaborador._id}`);
      console.log(`👤 Nome atual: "${colaborador.nome || 'não definido'}"`);
      console.log(`🎯 Etapa atual: ${colaborador.etapaCadastro}`);
      
      // Atualizar último acesso
      colaborador.ultimoAcesso = new Date();
      await colaborador.save();
    }

    return colaborador;
  } catch (error) {
    console.error('❌ Erro ao obter/criar colaborador:', error);
    throw new Error(`Falha ao processar colaborador: ${error.message}`);
  }
}

/**
 * Atualizar dados do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {Object} dadosAtualizacao - Dados para atualização
 * @returns {Promise<Colaborador>}
 */
async function atualizarColaborador(colaboradorId, dadosAtualizacao) {
  try {
    console.log(`🔄 Atualizando colaborador ${colaboradorId}:`, dadosAtualizacao);
    
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(colaboradorId)) {
      throw new Error('ID do colaborador inválido');
    }
    
    // Campos permitidos para atualização
    const camposPermitidos = [
      'nome', 'tipo', 'funcao', 'etapaCadastro', 'subEstado', 
      'subEstadoProblema', 'obras', 'ultimoAcesso'
    ];
    
    // Filtrar apenas campos permitidos
    const dadosFiltrados = {};
    Object.keys(dadosAtualizacao).forEach(campo => {
      if (camposPermitidos.includes(campo)) {
        dadosFiltrados[campo] = dadosAtualizacao[campo];
      }
    });
    
    // Validar nome se fornecido
    if (dadosFiltrados.nome !== undefined) {
      if (typeof dadosFiltrados.nome !== 'string' || dadosFiltrados.nome.trim().length < 2) {
        throw new Error('Nome deve ter pelo menos 2 caracteres');
      }
      dadosFiltrados.nome = dadosFiltrados.nome.trim();
    }
    
    // Validar tipo se fornecido
    if (dadosFiltrados.tipo && !['colaborador', 'encarregado'].includes(dadosFiltrados.tipo)) {
      throw new Error('Tipo deve ser "colaborador" ou "encarregado"');
    }
    
    const colaboradorAtualizado = await Colaborador.findByIdAndUpdate(
      colaboradorId,
      { ...dadosFiltrados, ultimoAcesso: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!colaboradorAtualizado) {
      throw new Error('Colaborador não encontrado');
    }
    
    console.log(`✅ Colaborador ${colaboradorId} atualizado com sucesso`);
    return colaboradorAtualizado;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar colaborador:', error);
    throw error;
  }
}

/**
 * Definir nome do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} nome - Nome do colaborador
 * @returns {Promise<Colaborador>}
 */
async function definirNomeColaborador(colaboradorId, nome) {
  try {
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
    
    const nomeNormalizado = nome.trim();
    
    const colaborador = await Colaborador.findByIdAndUpdate(
      colaboradorId,
      { 
        nome: nomeNormalizado,
        ultimoAcesso: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    console.log(`✅ Nome definido para colaborador ${colaboradorId}: "${nomeNormalizado}"`);
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao definir nome:', error);
    throw error;
  }
}

/**
 * Buscar colaborador por ID
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Colaborador|null>}
 */
async function buscarColaboradorPorId(colaboradorId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(colaboradorId)) {
      throw new Error('ID do colaborador inválido');
    }
    
    const colaborador = await Colaborador.findById(colaboradorId)
      .populate('obras', 'nome endereco codigoAcesso status');
    
    return colaborador;
  } catch (error) {
    console.error('❌ Erro ao buscar colaborador:', error);
    throw error;
  }
}

/**
 * Buscar colaborador por telefone
 * @param {String} telefone - Telefone do colaborador
 * @returns {Promise<Colaborador|null>}
 */
async function buscarColaboradorPorTelefone(telefone) {
  try {
    const telefoneNormalizado = telefone.replace(/\D/g, '');
    
    const colaborador = await Colaborador.findOne({ telefone: telefoneNormalizado })
      .populate('obras', 'nome endereco codigoAcesso status');
    
    return colaborador;
  } catch (error) {
    console.error('❌ Erro ao buscar colaborador por telefone:', error);
    throw error;
  }
}

/**
 * Adicionar obra ao colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @returns {Promise<Colaborador>}
 */
async function adicionarObraAoColaborador(colaboradorId, obraId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(colaboradorId) || !mongoose.Types.ObjectId.isValid(obraId)) {
      throw new Error('IDs inválidos');
    }
    
    const colaborador = await Colaborador.findById(colaboradorId);
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    // Verificar se já tem a obra
    const jaTemObra = colaborador.obras.some(obra => obra.toString() === obraId.toString());
    
    if (!jaTemObra) {
      // Adicionar no início (obra mais recente)
      colaborador.obras.unshift(new mongoose.Types.ObjectId(obraId));
      console.log(`✅ Obra ${obraId} adicionada ao colaborador ${colaboradorId}`);
    } else {
      // Se já tem, mover para o início (obra ativa)
      colaborador.obras = colaborador.obras.filter(obra => obra.toString() !== obraId.toString());
      colaborador.obras.unshift(new mongoose.Types.ObjectId(obraId));
      console.log(`🔄 Obra ${obraId} movida para posição ativa do colaborador ${colaboradorId}`);
    }
    
    // Definir como obra ativa
    colaborador.subEstado = obraId;
    colaborador.ultimoAcesso = new Date();
    
    await colaborador.save();
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao adicionar obra ao colaborador:', error);
    throw error;
  }
}

/**
 * Remover obra do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @returns {Promise<Colaborador>}
 */
async function removerObraDoColaborador(colaboradorId, obraId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(colaboradorId) || !mongoose.Types.ObjectId.isValid(obraId)) {
      throw new Error('IDs inválidos');
    }
    
    const colaborador = await Colaborador.findById(colaboradorId);
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    // Remover obra da lista
    colaborador.obras = colaborador.obras.filter(obra => obra.toString() !== obraId.toString());
    
    // Se era a obra ativa, limpar subEstado
    if (colaborador.subEstado && colaborador.subEstado.toString() === obraId.toString()) {
      colaborador.subEstado = colaborador.obras.length > 0 ? colaborador.obras[0] : null;
    }
    
    colaborador.ultimoAcesso = new Date();
    await colaborador.save();
    
    console.log(`✅ Obra ${obraId} removida do colaborador ${colaboradorId}`);
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao remover obra do colaborador:', error);
    throw error;
  }
}

/**
 * Obter obra ativa do colaborador
 * @param {Object} colaborador - Objeto colaborador
 * @returns {String|null} ID da obra ativa
 */
function obterObraAtiva(colaborador) {
  // Priorizar subEstado se válido
  if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
    return colaborador.subEstado;
  }
  
  // Senão, usar primeira obra da lista
  if (colaborador.obras && colaborador.obras.length > 0) {
    return colaborador.obras[0];
  }
  
  return null;
}

/**
 * Definir obra ativa do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @returns {Promise<Colaborador>}
 */
async function definirObraAtiva(colaboradorId, obraId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(colaboradorId)) {
      throw new Error('ID do colaborador inválido');
    }
    
    const colaborador = await Colaborador.findById(colaboradorId);
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    // Verificar se colaborador tem acesso à obra
    const temAcesso = colaborador.obras.some(obra => obra.toString() === obraId.toString());
    
    if (!temAcesso) {
      throw new Error('Colaborador não tem acesso a esta obra');
    }
    
    colaborador.subEstado = obraId;
    colaborador.ultimoAcesso = new Date();
    
    await colaborador.save();
    
    console.log(`✅ Obra ativa definida: ${obraId} para colaborador ${colaboradorId}`);
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao definir obra ativa:', error);
    throw error;
  }
}

/**
 * Listar colaboradores de uma obra
 * @param {String} obraId - ID da obra
 * @returns {Promise<Array>}
 */
async function listarColaboradoresDaObra(obraId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(obraId)) {
      throw new Error('ID da obra inválido');
    }
    
    const colaboradores = await Colaborador.find({
      obras: obraId
    }, 'nome telefone tipo funcao ultimoAcesso').sort({ nome: 1 });
    
    return colaboradores;
  } catch (error) {
    console.error('❌ Erro ao listar colaboradores da obra:', error);
    throw error;
  }
}

/**
 * Atualizar etapa de cadastro
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} novaEtapa - Nova etapa
 * @returns {Promise<Colaborador>}
 */
async function atualizarEtapaCadastro(colaboradorId, novaEtapa) {
  try {
    const colaborador = await Colaborador.findByIdAndUpdate(
      colaboradorId,
      { 
        etapaCadastro: novaEtapa,
        ultimoAcesso: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    console.log(`✅ Etapa atualizada para ${novaEtapa}: colaborador ${colaboradorId}`);
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar etapa:', error);
    throw error;
  }
}

/**
 * Limpar dados temporários do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Colaborador>}
 */
async function limparDadosTemporarios(colaboradorId) {
  try {
    const colaborador = await Colaborador.findById(colaboradorId);
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    // Usar método do modelo para limpar dados
    await colaborador.limparDadosTemporarios();
    
    console.log(`✅ Dados temporários limpos: colaborador ${colaboradorId}`);
    return colaborador;
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados temporários:', error);
    throw error;
  }
}

/**
 * Verificar se colaborador está em fluxo
 * @param {Object} colaborador - Objeto colaborador
 * @returns {Boolean}
 */
function estaEmFluxo(colaborador) {
  return colaborador.estaEmFluxo();
}

/**
 * Obter estatísticas do colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @returns {Promise<Object>}
 */
async function obterEstatisticasColaborador(colaboradorId) {
  try {
    const colaborador = await Colaborador.findById(colaboradorId).populate('obras', 'nome status');
    
    if (!colaborador) {
      throw new Error('Colaborador não encontrado');
    }
    
    const stats = {
      id: colaborador._id,
      nome: colaborador.nome || 'Nome não definido',
      telefone: colaborador.telefone,
      tipo: colaborador.tipo,
      funcao: colaborador.funcao || 'Não definida',
      totalObras: colaborador.obras.length,
      obrasAtivas: colaborador.obras.filter(obra => obra.status === 'ativa').length,
      ultimoAcesso: colaborador.ultimoAcesso,
      diasSemAcesso: Math.floor((new Date() - colaborador.ultimoAcesso) / (1000 * 60 * 60 * 24)),
      temNome: Boolean(colaborador.nome && colaborador.nome.trim()),
      emFluxo: colaborador.estaEmFluxo()
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
}

/**
 * Obter saudação personalizada
 * @param {Object} colaborador - Objeto colaborador
 * @returns {String}
 */
function obterSaudacao(colaborador) {
  if (!colaborador) return 'Olá!';
  
  const nome = colaborador.nome && colaborador.nome.trim() 
    ? colaborador.nome.trim() 
    : null;
    
  return nome ? `Olá, ${nome}!` : 'Olá!';
}

/**
 * Obter nome de exibição
 * @param {Object} colaborador - Objeto colaborador
 * @returns {String}
 */
function obterNomeExibicao(colaborador) {
  if (!colaborador) return 'Usuário';
  
  if (colaborador.nome && colaborador.nome.trim()) {
    return colaborador.nome.trim();
  }
  
  return 'Colaborador';
}

/**
 * Verificar se colaborador precisa definir nome
 * @param {Object} colaborador - Objeto colaborador
 * @returns {Boolean}
 */
function precisaDefinirNome(colaborador) {
  return !colaborador.nome || colaborador.nome.trim().length < 2;
}

module.exports = {
  obterOuCriarColaborador,
  atualizarColaborador,
  definirNomeColaborador,
  buscarColaboradorPorId,
  buscarColaboradorPorTelefone,
  adicionarObraAoColaborador,
  removerObraDoColaborador,
  obterObraAtiva,
  definirObraAtiva,
  listarColaboradoresDaObra,
  atualizarEtapaCadastro,
  limparDadosTemporarios,
  estaEmFluxo,
  obterEstatisticasColaborador,
  obterSaudacao,
  obterNomeExibicao,
  precisaDefinirNome
};