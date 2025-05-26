// src/ia/fsm/tarefa/estadoSelecionandoMinhaTarefa.js - NOVO ESTADO

const Tarefa = require('../../../domains/tarefa/tarefa.model');

module.exports = async function estadoSelecionandoMinhaTarefa(colaborador, mensagem) {
  try {
    // Verificar se tem tarefas salvas para seleção
    if (!colaborador.tempTarefasIds || colaborador.tempTarefasIds.length === 0) {
      // Limpar estado e voltar
      colaborador.tempTarefasIds = undefined;
      await colaborador.save();
      
      return {
        resposta: `❌ Nenhuma tarefa encontrada. Voltando ao menu.`,
        etapaNova: 'menu'
      };
    }

    const comando = mensagem.trim().toLowerCase();

    // Comandos especiais
    if (comando === 'menu' || comando === '0') {
      colaborador.tempTarefasIds = undefined;
      await colaborador.save();
      return {
        resposta: `🔙 Voltando ao menu principal...`,
        etapaNova: 'menu'
      };
    }

    // Processar seleção numérica
    if (!isNaN(parseInt(mensagem))) {
      const indice = parseInt(mensagem) - 1;
      
      if (indice >= 0 && indice < colaborador.tempTarefasIds.length) {
        const tarefaId = colaborador.tempTarefasIds[indice];
        
        // Buscar a tarefa selecionada
        const tarefa = await Tarefa.findById(tarefaId);
        
        if (!tarefa) {
          return {
            resposta: `❌ Tarefa não encontrada. Tente novamente.`,
            etapaNova: 'selecionando_minha_tarefa'
          };
        }

        // Definir como tarefa ativa e ir para gerenciar
        colaborador.tempTarefaSelecionadaId = tarefaId;
        colaborador.tempTarefasIds = undefined; // Limpar lista
        await colaborador.save();

        // Calcular tempo decorrido
        const tempoDecorrido = calcularTempoDecorrido(tarefa.updatedAt);

        return {
          resposta: `📋 *TAREFA SELECIONADA*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
📊 Status: ${tarefa.status === 'em_andamento' ? '🔄 Em andamento' : '✅ Concluída'}
⏰ ${tarefa.status === 'em_andamento' ? `Em andamento há: ${tempoDecorrido}` : 'Concluída'}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas
0️⃣ Voltar ao menu`,
          etapaNova: 'gerenciando_tarefa_ativa'
        };
      } else {
        return {
          resposta: `❌ Número inválido. Escolha entre 1 e ${colaborador.tempTarefasIds.length}.`,
          etapaNova: 'selecionando_minha_tarefa'
        };
      }
    }

    // Comando não reconhecido
    return {
      resposta: `❓ *COMANDO NÃO RECONHECIDO*

Digite o número da tarefa que deseja gerenciar (1 a ${colaborador.tempTarefasIds.length})
Ou digite "menu" para voltar ao menu principal.`,
      etapaNova: 'selecionando_minha_tarefa'
    };

  } catch (error) {
    console.error('❌ Erro ao selecionar tarefa:', error);
    
    // Limpar dados e voltar ao menu
    colaborador.tempTarefasIds = undefined;
    await colaborador.save();
    
    return {
      resposta: `❌ Erro inesperado: ${error.message}

Voltando ao menu principal.`,
      etapaNova: 'menu'
    };
  }
};

// ✅ FUNÇÃO AUXILIAR: Calcular tempo decorrido
function calcularTempoDecorrido(dataInicio) {
  if (!dataInicio) return 'tempo indeterminado';
  
  const agora = new Date();
  const inicio = new Date(dataInicio);
  const diffMs = agora - inicio;
  
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (horas === 0) {
    return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  } else if (minutos === 0) {
    return `${horas} hora${horas !== 1 ? 's' : ''}`;
  } else {
    return `${horas}h${minutos}min`;
  }
}