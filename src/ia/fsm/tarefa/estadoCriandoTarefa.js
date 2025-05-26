// src/ia/fsm/tarefa/estadoCriandoTarefa.js - VERSÃO CORRIGIDA

const Tarefa = require('../../../domains/tarefa/tarefa.model');
const Colaborador = require('../../../domains/colaborador/colaborador.model');

module.exports = async function estadoCriandoTarefa(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  try {
    switch (colaborador.etapaCadastro) {
      case 'criando_tarefa_titulo':
        if (!mensagem || mensagem.trim().length < 3) {
          resposta = `⚠️ O título da tarefa deve ter pelo menos 3 caracteres.

🔤 Digite o *título da tarefa*:
(Ex: "Instalar cortinados" ou "Colocar calhas")`;
          return { resposta, etapaNova };
        }

        colaborador.tempTituloTarefa = mensagem.trim();
        etapaNova = 'criando_tarefa_unidades';
        
        resposta = `🏠 Para qual(is) unidade(s)?

✅ OPÇÕES:
• Um quarto: "101"
• Vários quartos: "101,102,103" 
• Range: "101-105" (cria do 101 ao 105)
• Andar inteiro: "andar 1" (quartos 101-126)

💡 Digite as unidades:`;
        
        await colaborador.save();
        break;

      case 'criando_tarefa_unidades':
        const unidades = parseUnidades(mensagem.trim());
        
        if (!unidades || unidades.length === 0) {
          resposta = `❌ Formato inválido.

Exemplos válidos:
• "101" (um quarto)  
• "101,102,103" (lista)
• "101-105" (range)
• "andar 1" (andar inteiro)`;
          return { resposta, etapaNova };
        }
        
        colaborador.tempUnidadesTarefa = unidades;
        etapaNova = 'criando_tarefa_fase';
        
        resposta = `🔧 Qual a fase do trabalho?

1️⃣ Calhas
2️⃣ Cortinados  
3️⃣ Acabamento
4️⃣ Outra (digite o nome)

💡 Para criar ${unidades.length} tarefa${unidades.length > 1 ? 's' : ''} (${unidades.join(', ')})`;
        
        await colaborador.save();
        break;

      case 'criando_tarefa_fase':
        let fase;
        switch (mensagem.trim()) {
          case '1': fase = 'calhas'; break;
          case '2': fase = 'cortinados'; break;
          case '3': fase = 'acabamento'; break;
          default: fase = mensagem.trim().toLowerCase();
        }
        
        if (!fase || fase.length < 2) {
          resposta = `❌ Fase inválida. Digite 1, 2, 3 ou o nome da fase.`;
          return { resposta, etapaNova };
        }
        
        colaborador.tempFaseTarefa = fase;
        etapaNova = 'criando_tarefa_prazo';
        
        resposta = `📅 Prazo para ${fase}?

• "hoje" 
• "amanha"
• "25/01/2025"
• "sem prazo"

💡 Será aplicado a todas as ${colaborador.tempUnidadesTarefa.length} tarefas:`;
        
        await colaborador.save();
        break;

      case 'criando_tarefa_prazo':
        const prazo = parsePrazo(mensagem.trim());
        
        colaborador.tempPrazoTarefaFinal = prazo;
        etapaNova = 'criando_tarefa_confirmacao';
        
        const preview = gerarPreviewTarefas(colaborador);
        resposta = `📋 PREVIEW DAS TAREFAS

${preview}

✅ Confirma a criação?

1️⃣ Sim, criar tarefas
2️⃣ Não, voltar para editar
0️⃣ Cancelar tudo`;
        
        await colaborador.save();
        break;

      case 'criando_tarefa_confirmacao':
        if (mensagem === '1' || mensagem.toLowerCase().includes('sim')) {
          return await criarTarefasEmLote(colaborador);
        } else if (mensagem === '2' || mensagem.toLowerCase().includes('não') || mensagem.toLowerCase().includes('nao')) {
          etapaNova = 'criando_tarefa_prazo';
          resposta = `📅 Prazo para ${colaborador.tempFaseTarefa}?

• "hoje", "amanha", "25/01/2025", "sem prazo"

💡 Digite o novo prazo:`;
        } else if (mensagem === '0' || mensagem.toLowerCase() === 'cancelar') {
          // Limpar dados temporários
          colaborador.tempTituloTarefa = undefined;
          colaborador.tempUnidadesTarefa = undefined;
          colaborador.tempFaseTarefa = undefined;
          colaborador.tempPrazoTarefaFinal = undefined;
          await colaborador.save();
          
          return {
            resposta: `❌ Criação cancelada. Voltando ao menu principal.`,
            etapaNova: 'menu'
          };
        } else {
          resposta = `❌ Opção inválida. Digite 1 (sim), 2 (editar) ou 0 (cancelar).`;
        }
        break;

      default:
        resposta = `❌ Erro no fluxo. Digite "menu" para voltar.`;
        etapaNova = 'menu';
        break;
    }

  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    resposta = `❌ Erro ao criar tarefa: ${error.message}

Digite "menu" para voltar.`;
    etapaNova = 'menu';
  }

  return { resposta, etapaNova };
};

// ✅ FUNÇÃO SIMPLES: Parse de unidades
function parseUnidades(input) {
  const lower = input.toLowerCase().trim();
  
  // Andar inteiro
  if (lower.startsWith('andar ')) {
    const andar = parseInt(lower.replace('andar ', ''));
    if (andar >= 1 && andar <= 10) {
      const inicio = andar * 100 + 1;
      const fim = andar === 5 ? 520 : andar * 100 + 26; // 5º andar só até 520
      return Array.from({length: fim - inicio + 1}, (_, i) => String(inicio + i));
    }
  }
  
  // Range: 101-105
  if (input.includes('-')) {
    const [inicio, fim] = input.split('-').map(n => parseInt(n.trim()));
    if (inicio && fim && fim >= inicio && fim - inicio <= 50) {
      return Array.from({length: fim - inicio + 1}, (_, i) => String(inicio + i));
    }
  }
  
  // Lista: 101,102,103
  if (input.includes(',')) {
    const unidades = input.split(',')
      .map(u => u.trim())
      .filter(u => u.length > 0 && /^\d+$/.test(u));
    return unidades.length > 0 ? unidades : null;
  }
  
  // Único: 101
  if (/^\d+$/.test(input)) {
    return [input];
  }
  
  return null;
}

// ✅ FUNÇÃO SIMPLES: Parse de prazo
function parsePrazo(input) {
  const lower = input.toLowerCase().trim();
  
  if (lower === 'sem prazo') return null;
  if (lower === 'hoje') {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    return hoje;
  }
  if (lower === 'amanha' || lower === 'amanhã') {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(23, 59, 59, 999);
    return amanha;
  }
  
  // DD/MM/AAAA
  const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, dia, mes, ano] = match;
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 23, 59, 59, 999);
    if (!isNaN(data.getTime())) {
      return data;
    }
  }
  
  return null;
}

// ✅ FUNÇÃO SIMPLES: Gerar preview
function gerarPreviewTarefas(colaborador) {
  const titulo = colaborador.tempTituloTarefa;
  const unidades = colaborador.tempUnidadesTarefa || [];
  const fase = colaborador.tempFaseTarefa;
  const prazo = colaborador.tempPrazoTarefaFinal;
  
  let preview = `📋 Resumo:
🏷️ Tipo: ${titulo} - ${fase}
🏠 Unidades: ${unidades.join(', ')}
📅 Prazo: ${prazo ? prazo.toLocaleDateString('pt-PT') : 'Sem prazo'}

📝 Serão criadas ${unidades.length} tarefa${unidades.length > 1 ? 's' : ''}:`;
  
  unidades.slice(0, 3).forEach((unidade, i) => {
    preview += `\n${i + 1}. ${titulo} - ${unidade}`;
  });
  
  if (unidades.length > 3) {
    preview += `\n... e mais ${unidades.length - 3} tarefa${unidades.length - 3 > 1 ? 's' : ''}`;
  }
  
  return preview;
}

// ✅ CRIAR TAREFAS EM LOTE SIMPLIFICADO
async function criarTarefasEmLote(colaborador) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    const titulo = colaborador.tempTituloTarefa;
    const unidades = colaborador.tempUnidadesTarefa;
    const fase = colaborador.tempFaseTarefa;
    const prazo = colaborador.tempPrazoTarefaFinal;
    
    if (!obraId) {
      throw new Error('Nenhuma obra ativa encontrada');
    }
    
    const tarefasCriadas = [];
    
    for (const unidade of unidades) {
      const andar = Math.floor(parseInt(unidade) / 100);
      
      const tarefa = new Tarefa({
        titulo: `${titulo} - ${unidade}`,
        descricao: `${fase} no quarto ${unidade}`,
        obra: obraId,
        unidade: unidade,
        fase: fase,
        andar: andar,
        prazo: prazo,
        status: 'pendente',
        atribuidaPara: []
      });
      
      await tarefa.save();
      tarefasCriadas.push(tarefa);
    }
    
    // Limpar dados temporários
    colaborador.tempTituloTarefa = undefined;
    colaborador.tempUnidadesTarefa = undefined;  
    colaborador.tempFaseTarefa = undefined;
    colaborador.tempPrazoTarefaFinal = undefined;
    await colaborador.save();
    
    // Resposta simplificada
    let resposta = `✅ ${tarefasCriadas.length} TAREFAS CRIADAS!

📋 Resumo:
🏷️ Tipo: ${titulo} - ${fase}
🏠 Unidades: ${unidades.join(', ')}
📅 Prazo: ${prazo ? prazo.toLocaleDateString('pt-PT') : 'Sem prazo'}

🎯 Próximos passos:
• Digite "3" para ver tarefas disponíveis
• Digite "5" para criar mais tarefas
• Digite "menu" para voltar ao menu

💡 As tarefas estão no POOL - qualquer colaborador pode pegá-las!`;
    
    return {
      resposta,
      etapaNova: 'menu'
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar tarefas:', error);
    
    // Limpar dados mesmo em caso de erro
    colaborador.tempTituloTarefa = undefined;
    colaborador.tempUnidadesTarefa = undefined;  
    colaborador.tempFaseTarefa = undefined;
    colaborador.tempPrazoTarefaFinal = undefined;
    await colaborador.save();
    
    return {
      resposta: `❌ Erro ao criar tarefas: ${error.message}

Digite "5" para tentar novamente ou "menu" para voltar.`,
      etapaNova: 'menu'
    };
  }
}