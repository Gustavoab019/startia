const Tarefa = require('./tarefa.model');

/**
 * Lista todas as tarefas atribuídas a um colaborador específico
 * @param {ObjectId} colaboradorId - ID do colaborador
 * @returns {Promise<Array>} Lista de tarefas
 */
async function listarTarefasPorColaborador(colaboradorId) {
  return await Tarefa.find({ atribuidaPara: colaboradorId }).sort({ createdAt: -1 });
}

module.exports = {
  listarTarefasPorColaborador
};
