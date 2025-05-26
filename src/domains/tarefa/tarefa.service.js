// src/domains/tarefa/tarefa.service.js - VERSÃO SIMPLES E FUNCIONAL

const Tarefa = require('./tarefa.model');

/**
 * Lista todas as tarefas atribuídas a um colaborador específico
 * @param {ObjectId} colaboradorId - ID do colaborador
 * @returns {Promise<Array>} Lista de tarefas
 */
async function listarTarefasPorColaborador(colaboradorId) {
  return await Tarefa.find({ atribuidaPara: colaboradorId })
    .populate('obra', 'nome')
    .sort({ createdAt: -1 });
}

/**
 * ✅ NOVA: Buscar tarefas disponíveis no POOL
 * @param {ObjectId} obraId - ID da obra
 * @returns {Promise<Array>} Lista de tarefas disponíveis
 */
async function buscarTarefasDisponiveis(obraId) {
  return await Tarefa.find({
    obra: obraId,
    status: 'pendente',
    atribuidaPara: { $size: 0 }
  }).sort({ createdAt: 1 });
}

/**
 * ✅ NOVA: Pegar tarefa do POOL
 * @param {ObjectId} tarefaId - ID da tarefa
 * @param {ObjectId} colaboradorId - ID do colaborador
 * @returns {Promise<Object>} Resultado da operação
 */
async function pegarTarefa(tarefaId, colaboradorId) {
  try {
    const tarefa = await Tarefa.findById(tarefaId);
    
    if (!tarefa || tarefa.status !== 'pendente' || tarefa.atribuidaPara.length > 0) {
      throw new Error('Tarefa não disponível');
    }
    
    tarefa.status = 'em_andamento';
    tarefa.atribuidaPara = [colaboradorId];
    await tarefa.save();
    
    return { sucesso: true, tarefa };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

/**
 * ✅ NOVA: Atualizar status de tarefa
 * @param {ObjectId} tarefaId - ID da tarefa
 * @param {String} novoStatus - Novo status
 * @returns {Promise<Object>} Resultado
 */
async function atualizarStatus(tarefaId, novoStatus) {
  try {
    const tarefa = await Tarefa.findByIdAndUpdate(
      tarefaId,
      { status: novoStatus },
      { new: true }
    );
    
    return { sucesso: true, tarefa };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = {
  listarTarefasPorColaborador,
  buscarTarefasDisponiveis,
  pegarTarefa,
  atualizarStatus
};