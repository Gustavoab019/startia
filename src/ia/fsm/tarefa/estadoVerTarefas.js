// src/ia/fsm/tarefa/estadoVerTarefas.js - VERSÃO SIMPLES E FUNCIONAL

const Tarefa = require('../../../domains/tarefa/tarefa.model');

module.exports = async function estadoVerTarefas(colaborador, mensagem) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    
    if (!obraId) {
      return {
        resposta: `❌ Você não está em nenhuma obra. Digite "2" para entrar em uma obra.`,
        etapaNova: 'menu'
      };
    }

    // ✅ BUSCAR TODAS AS TAREFAS DA OBRA
    const todasTarefas = await Tarefa.find({ obra: obraId }).sort({ andar: 1, unidade: 1 });
    
    if (!todasTarefas.length) {
      return {
        resposta: `📭 Nenhuma tarefa encontrada nesta obra.

Digite "5" para cadastrar uma nova tarefa.`,
        etapaNova: 'menu'
      };
    }

    // ✅ PROCESSAR COMANDOS ESPECIAIS
    if (mensagem) {
      const cmd = mensagem.toLowerCase().trim();
      
      // Comando "minhas" - tarefas pessoais
      if (cmd === 'minhas') {
        const minhasTarefas = todasTarefas.filter(t => 
          t.atribuidaPara.some(id => id.toString() === colaborador._id.toString())
        );
        
        if (!minhasTarefas.length) {
          return {
            resposta: `📋 Você não tem tarefas em andamento.

🟢 Digite "3" para ver tarefas disponíveis para pegar.`,
            etapaNova: 'menu'
          };
        }
        
        // ✅ SE TEM APENAS 1 TAREFA, IR DIRETO PARA GERENCIAR
        if (minhasTarefas.length === 1) {
          const tarefa = minhasTarefas[0];
          colaborador.tempTarefaSelecionadaId = tarefa._id.toString();
          await colaborador.save();
          
          const tempoDecorrido = calcularTempoDecorrido(tarefa.updatedAt);
          
          return {
            resposta: `📋 *SUA TAREFA EM ANDAMENTO*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
⏰ Em andamento há: ${tempoDecorrido}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas
0️⃣ Voltar ao menu`,
            etapaNova: 'gerenciando_tarefa_ativa'
          };
        }
        
        // ✅ SE TEM MÚLTIPLAS, MOSTRAR LISTA
        let resposta = `📋 *SUAS TAREFAS EM ANDAMENTO (${minhasTarefas.length}):*\n\n`;
        
        minhasTarefas.forEach((tarefa, i) => {
          const statusIcon = tarefa.status === 'em_andamento' ? '🔄' : '✅';
          resposta += `${i + 1}️⃣ ${statusIcon} ${tarefa.titulo}\n`;
          resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
        });
        
        resposta += `\n💡 Digite o número para gerenciar uma tarefa`;
        
        // ✅ SALVAR IDS DAS TAREFAS PARA SELEÇÃO
        colaborador.tempTarefasIds = minhasTarefas.map(t => t._id.toString());
        await colaborador.save();
        
        return { resposta, etapaNova: 'selecionando_minha_tarefa' };
      }
      
      // ✅ PROCESSAR SELEÇÃO DE TAREFA (PEGAR DO POOL)
      if (!isNaN(parseInt(mensagem))) {
        const indice = parseInt(mensagem) - 1;
        const tarefasDisponiveis = todasTarefas.filter(t => 
          t.status === 'pendente' && t.atribuidaPara.length === 0
        );
        
        if (indice >= 0 && indice < tarefasDisponiveis.length) {
          const tarefa = tarefasDisponiveis[indice];
          
          // ✅ PEGAR TAREFA (POOL)
          tarefa.status = 'em_andamento';
          tarefa.atribuidaPara = [colaborador._id];
          await tarefa.save();
          
          return {
            resposta: `✅ *TAREFA INICIADA!*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
⏰ Iniciado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas (digite "3")

💡 Digite "minhas" para ver suas tarefas em andamento`,
            etapaNova: 'menu'
          };
        }
      }
    }

    // ✅ AGRUPAR POR ANDAR (SIMPLES)
    const tarefasPorAndar = {};
    todasTarefas.forEach(tarefa => {
      const andar = tarefa.andar || 'Sem andar';
      if (!tarefasPorAndar[andar]) {
        tarefasPorAndar[andar] = { total: 0, concluidas: 0, andamento: 0, disponiveis: 0 };
      }
      
      tarefasPorAndar[andar].total++;
      
      if (tarefa.status === 'concluida') {
        tarefasPorAndar[andar].concluidas++;
      } else if (tarefa.status === 'em_andamento') {
        tarefasPorAndar[andar].andamento++;
      } else if (tarefa.atribuidaPara.length === 0) {
        tarefasPorAndar[andar].disponiveis++;
      }
    });

    // ✅ TAREFAS DISPONÍVEIS PARA PEGAR
    const tarefasDisponiveis = todasTarefas.filter(t => 
      t.status === 'pendente' && t.atribuidaPara.length === 0
    );
    
    // ✅ GERAR RESPOSTA SIMPLES
    let resposta = `📋 *TAREFAS DA OBRA*\n\n`;
    
    // Resumo por andar
    resposta += `🏢 *RESUMO POR ANDAR:*\n`;
    Object.keys(tarefasPorAndar)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(andar => {
        const stats = tarefasPorAndar[andar];
        const progresso = Math.round((stats.concluidas / stats.total) * 100);
        const progressBar = '█'.repeat(Math.floor(progresso / 10)) + '░'.repeat(10 - Math.floor(progresso / 10));
        
        resposta += `${andar}º: ${progressBar} ${progresso}% (${stats.concluidas}/${stats.total})\n`;
        resposta += `   🟢 ${stats.concluidas} | 🔄 ${stats.andamento} | 🟡 ${stats.disponiveis}\n`;
      });
    
    // Tarefas disponíveis para pegar
    if (tarefasDisponiveis.length > 0) {
      resposta += `\n🟢 *TAREFAS DISPONÍVEIS PARA PEGAR (${tarefasDisponiveis.length}):*\n`;
      
      tarefasDisponiveis.slice(0, 10).forEach((tarefa, i) => {
        resposta += `${i + 1}️⃣ ${tarefa.titulo}\n`;
        resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
      });
      
      if (tarefasDisponiveis.length > 10) {
        resposta += `\n... e mais ${tarefasDisponiveis.length - 10} tarefas\n`;
      }
      
      resposta += `\n💡 Digite o número para PEGAR uma tarefa`;
    } else {
      resposta += `\n✅ Todas as tarefas estão atribuídas ou concluídas!`;
    }
    
    resposta += `\n\n🎯 *COMANDOS:*`;
    resposta += `\n• "minhas" - Suas tarefas em andamento`;
    resposta += `\n• "5" - Criar nova tarefa`;
    resposta += `\n• "menu" - Voltar ao menu`;

    return {
      resposta,
      etapaNova: 'ver_tarefas'
    };
    
  } catch (error) {
    console.error('❌ Erro ao ver tarefas:', error);
    return {
      resposta: `❌ Erro ao carregar tarefas. Tente novamente.`,
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