// src/domains/problema/problema.service.js
const Problema = require('./problema.model');
const mongoose = require('mongoose');
const Colaborador = require('../colaborador/colaborador.model');
const { uploadImageToS3 } = require('../../services/s3.service'); // Mantemos isso para compatibilidade

/**
 * Cria um novo problema com ou sem foto
 */
async function criarProblema(dados) {
  const { obraId, relatorId, descricao, fotoBuffer, fotoUrl } = dados;
  
  // Verificar se o relator existe
  console.log('🔍 Verificando relator com ID:', relatorId);
  const relator = await Colaborador.findById(relatorId);
  if (!relator) {
    console.error('❌ Relator não encontrado com ID:', relatorId);
    throw new Error(`Relator com ID ${relatorId} não encontrado`);
  }
  console.log('✅ Relator encontrado:', relator.nome || relator.telefone);
  
  let urlFinal = fotoUrl || null;
  let publicIdFinal = null;
  
  // Somente tenta fazer upload para o S3 se não houver URL e houver buffer
  if (!urlFinal && fotoBuffer) {
    try {
      const resultado = await uploadImageToS3(fotoBuffer, `problema_${Date.now()}`);
      urlFinal = resultado.url;
      publicIdFinal = resultado.publicId;
    } catch (error) {
      console.error('❌ Erro ao fazer upload para S3:', error);
      // Continue com urlFinal = null se houver erro
    }
  }
  
  // Criar o problema com os dados disponíveis
  const problema = new Problema({
    obra: obraId,
    relator: relatorId,
    descricao,
    fotoUrl: urlFinal,
    fotoPublicId: publicIdFinal
  });
  
  await problema.save();
  return problema;
}

/**
 * Lista problemas por obra, com filtro opcional de status
 */
async function listarProblemasPorObra(obraId, status = null) {
  // Defina a consulta base
  const query = { obra: obraId };
  
  // Adicione o filtro de status apenas se ele for fornecido
  if (status) {
    query.status = status;
  }
  
  return await Problema.find(query)
    .sort({ createdAt: -1 })
    .populate('relator', 'nome telefone');
}

/**
 * Obtém detalhes de um problema específico
 */
async function obterProblema(problemaId) {
  try {
    // Primeiro, obtenha o problema sem população para verificar o ID do relator
    const problemaRaw = await Problema.findById(problemaId);
    if (!problemaRaw) {
      console.log('❌ Problema não encontrado:', problemaId);
      return null;
    }
    
    console.log('🔍 ID do relator no documento original:', problemaRaw.relator);
    
    // Agora, obtenha o problema com população
    const problema = await Problema.findById(problemaId)
      .populate('relator', 'nome telefone')
      .populate('obra', 'nome');
    
    if (problema) {
      console.log('🔍 Problema encontrado:', problemaId);
      console.log('👷 Relator encontrado?', problema.relator ? 'Sim' : 'Não');
      if (problema.relator) {
        console.log('👷 Dados do relator:', {
          id: problema.relator._id,
          nome: problema.relator.nome,
          telefone: problema.relator.telefone
        });
      } else {
        console.log('⚠️ Relator não encontrado para o ID:', problemaRaw.relator);
        
        // Verificar se existe um colaborador com este ID
        const colaborador = await Colaborador.findById(problemaRaw.relator);
        console.log('🔍 Colaborador existe na coleção?', colaborador ? 'Sim' : 'Não');
        
        if (colaborador) {
          console.log('🔍 Dados do colaborador encontrado:', {
            id: colaborador._id,
            nome: colaborador.nome,
            telefone: colaborador.telefone
          });
          
          // Tente atualizar manualmente o relator no objeto problema
          problema.relator = colaborador;
        }
      }
    }
    
    return problema;
  } catch (error) {
    console.error('❌ Erro ao obter problema:', error);
    throw error;
  }
}

/**
 * Atualiza o status de um problema
 */
async function atualizarStatusProblema(problemaId, status) {
  return await Problema.findByIdAndUpdate(
    problemaId, 
    { status }, 
    { new: true }
  );
}

module.exports = {
  criarProblema,
  listarProblemasPorObra,
  obterProblema,
  atualizarStatusProblema
};