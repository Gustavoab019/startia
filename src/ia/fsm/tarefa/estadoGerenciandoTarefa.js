// src/ia/fsm/tarefa/estadoGerenciandoTarefa.js - NOVO ESTADO PARA GERENCIAR TAREFA ATIVA

const Tarefa = require('../../../domains/tarefa/tarefa.model');

module.exports = async function estadoGerenciandoTarefa(colaborador, mensagem) {
  try {
    // Verificar se tem tarefa ativa selecionada
    if (!colaborador.tempTarefaSelecionadaId) {
      return {
        resposta: `❌ Nenhuma tarefa ativa encontrada. Voltando ao menu.`,
        etapaNova: 'menu'
      };
    }

    // Buscar a tarefa ativa
    const tarefa = await Tarefa.findById(colaborador.tempTarefaSelecionadaId)
      .populate('obra', 'nome');
    
    if (!tarefa) {
      // Limpar referência inválida
      colaborador.tempTarefaSelecionadaId = undefined;
      await colaborador.save();
      
      return {
        resposta: `❌ Tarefa não encontrada. Voltando ao menu.`,
        etapaNova: 'menu'
      };
    }

    const comando = mensagem.trim();

    switch (comando) {
      case '1':
        // ✅ MARCAR COMO CONCLUÍDA
        try {
          tarefa.status = 'concluida';
          await tarefa.save();
          
          // Limpar tarefa ativa
          colaborador.tempTarefaSelecionadaId = undefined;
          await colaborador.save();
          
          const horaFim = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          return {
            resposta: `✅ *TAREFA CONCLUÍDA!*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
⏰ Finalizada: ${horaFim}

🎉 Parabéns! Tarefa finalizada com sucesso.

🎯 *Próximos passos:*
3️⃣ Ver mais tarefas disponíveis
4️⃣ Registrar presença/saída
0️⃣ Voltar ao menu principal`,
            etapaNova: 'menu'
          };
        } catch (error) {
          return {
            resposta: `❌ Erro ao concluir tarefa: ${error.message}

Tente novamente ou digite "0" para voltar.`,
            etapaNova: 'gerenciando_tarefa_ativa'
          };
        }

      case '2':
        // ✅ REPORTAR PROBLEMA
        // Manter tarefa ativa e ir para relato de problema
        return {
          resposta: `⚠️ *RELATAR PROBLEMA*

Você está na tarefa: *${tarefa.titulo} - ${tarefa.unidade}*

📝 Descreva o problema encontrado:
- O que está acontecendo?
- Onde exatamente na unidade ${tarefa.unidade}?
- Está impedindo o trabalho?`,
          etapaNova: 'relatando_problema_descricao'
        };

      case '3':
        // ✅ VER MAIS TAREFAS (manter tarefa atual ativa)
        return {
          resposta: `🔄 Voltando para ver mais tarefas...

💡 Sua tarefa atual "${tarefa.titulo} - ${tarefa.unidade}" continua em andamento.`,
          etapaNova: 'ver_tarefas'
        };

      case '0':
      case 'menu':
        // ✅ VOLTAR AO MENU (manter tarefa ativa)
        return {
          resposta: `🔙 Voltando ao menu principal...

💡 Sua tarefa "${tarefa.titulo} - ${tarefa.unidade}" continua em andamento.
Digite "minhas" para voltar a ela.`,
          etapaNova: 'menu'
        };

      case 'status':
        // ✅ VER STATUS DA TAREFA ATUAL
        const tempoDecorrido = calcularTempoDecorrido(tarefa.updatedAt);
        
        return {
          resposta: `📊 *STATUS DA TAREFA ATUAL*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
🏗️ Obra: ${tarefa.obra.nome}
⏰ Em andamento há: ${tempoDecorrido}
📊 Status: 🔄 Em andamento

🎯 *Opções:*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
0️⃣ Voltar ao menu`,
          etapaNova: 'gerenciando_tarefa_ativa'
        };

      default:
        // ✅ COMANDO NÃO RECONHECIDO
        return {
          resposta: `❓ *COMANDO NÃO RECONHECIDO*

Você está gerenciando a tarefa:
📋 ${tarefa.titulo} - ${tarefa.unidade}

🎯 *Opções disponíveis:*
1️⃣ Marcar como concluída
2️⃣ Reportar problema  
3️⃣ Ver mais tarefas
0️⃣ Voltar ao menu

💡 Digite "status" para ver detalhes da tarefa.`,
          etapaNova: 'gerenciando_tarefa_ativa'
        };
    }

  } catch (error) {
    console.error('❌ Erro ao gerenciar tarefa:', error);
    return {
      resposta: `❌ Erro inesperado: ${error.message}

Digite "menu" para voltar ao menu principal.`,
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