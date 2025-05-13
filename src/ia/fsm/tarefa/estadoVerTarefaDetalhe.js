// src/ia/fsm/tarefa/estadoVerTarefaDetalhe.js

const Tarefa = require('../../../domains/tarefa/tarefa.model');
const Colaborador = require('../../../domains/colaborador/colaborador.model');
const Obra = require('../../../domains/obra/obra.model');
const { gerarBreadcrumb } = require('../../../utils/gerarResumoContextual');

module.exports = async function estadoVerTarefaDetalhe(colaborador, mensagem) {
  // Se não temos ID da tarefa selecionada, voltar para lista
  if (!colaborador.tempTarefaSelecionadaId) {
    return await require('./estadoVerTarefas')(colaborador);
  }
  
  try {
    // Buscar a tarefa com população de dados relacionados
    const tarefa = await Tarefa.findById(colaborador.tempTarefaSelecionadaId)
      .populate('obra', 'nome')
      .populate('atribuidaPara', 'nome telefone');
    
    // Se a tarefa não existir
    if (!tarefa) {
      return {
        resposta: `❌ Tarefa não encontrada ou foi removida. Voltando para a lista de tarefas...`,
        etapaNova: 'ver_tarefas'
      };
    }
    
    // Se recebemos um comando para atualizar o status
    if (mensagem) {
      const comando = mensagem.trim().toLowerCase();
      
      // Voltar para a lista de tarefas
      if (comando === 'voltar' || comando === 'lista') {
        return await require('./estadoVerTarefas')(colaborador);
      }
      
      // Processar mudança de status
      if (['1', '2', '3'].includes(comando) || 
          ['pendente', 'em_andamento', 'em andamento', 'concluida', 'concluída'].includes(comando)) {
        
        let novoStatus;
        
        // Mapear comandos para status
        if (comando === '1' || comando === 'pendente') {
          novoStatus = 'pendente';
        } else if (comando === '2' || comando === 'em_andamento' || comando === 'em andamento') {
          novoStatus = 'em_andamento';
        } else if (comando === '3' || comando === 'concluida' || comando === 'concluída') {
          novoStatus = 'concluida';
        }
        
        // Atualizar o status da tarefa
        if (novoStatus) {
          const statusAntigo = tarefa.status;
          tarefa.status = novoStatus;
          await tarefa.save();
          
          const statusTexto = {
            'pendente': '🟡 Pendente',
            'em_andamento': '🟠 Em Andamento',
            'concluida': '✅ Concluída'
          };
          
          return {
            resposta: `✅ Status da tarefa atualizado!\n\n*${tarefa.titulo}*\nStatus anterior: ${statusTexto[statusAntigo]}\nNovo status: ${statusTexto[novoStatus]}\n\nA tarefa foi atualizada com sucesso.\n\nDigite "voltar" para retornar à lista de tarefas ou "menu" para o menu principal.`,
            etapaNova: 'ver_tarefa_detalhe'
          };
        }
      }
    }
    
    // Mostrar detalhes da tarefa
    let resposta = `📝 *Detalhes da Tarefa:*\n\n`;
    
    // Usar o índice numérico que estava na listagem
    const indice = colaborador.tempIndicesPorTarefa ? 
      colaborador.tempIndicesPorTarefa[tarefa._id.toString()] : '';
    
    // Ícone de status
    const statusIcone = {
      'pendente': '🟡',
      'em_andamento': '🟠',
      'concluida': '✅'
    }[tarefa.status];
    
    // Status em texto
    const statusTexto = {
      'pendente': 'Pendente',
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída'
    }[tarefa.status];
    
    // Detalhes básicos
    resposta += `${indice ? `#️⃣ *Tarefa ${indice}*\n` : ''}`;
    resposta += `📌 *Título:* ${tarefa.titulo}\n`;
    if (tarefa.descricao) {
      resposta += `📄 *Descrição:* ${tarefa.descricao}\n`;
    }
    resposta += `🏗️ *Obra:* ${tarefa.obra.nome || 'Não especificada'}\n`;
    
    // Data e prazo
    if (tarefa.prazo) {
      const prazoFormatado = tarefa.prazo.toLocaleDateString('pt-PT');
      const hoje = new Date();
      const diasRestantes = Math.ceil((tarefa.prazo - hoje) / (1000 * 60 * 60 * 24));
      
      let prazoStatus = '';
      if (diasRestantes < 0) {
        prazoStatus = ' (⚠️ Atrasada)';
      } else if (diasRestantes === 0) {
        prazoStatus = ' (📌 Hoje)';
      } else if (diasRestantes <= 2) {
        prazoStatus = ' (⚡ Urgente)';
      }
      
      resposta += `📅 *Prazo:* ${prazoFormatado}${prazoStatus}\n`;
    } else {
      resposta += `📅 *Prazo:* Sem prazo definido\n`;
    }
    
    // Status atual
    resposta += `🔄 *Status:* ${statusIcone} ${statusTexto}\n`;
    
    // Atribuição
    if (tarefa.atribuidaPara && tarefa.atribuidaPara.length > 0) {
      const responsaveis = tarefa.atribuidaPara.map(c => c.nome || c.telefone).join(', ');
      resposta += `👤 *Responsável:* ${responsaveis}\n`;
    }
    
    // Datas de criação e atualização
    resposta += `\n📊 *Informações adicionais:*\n`;
    resposta += `📆 Criada em: ${tarefa.createdAt.toLocaleDateString('pt-PT')}\n`;
    
    if (tarefa.updatedAt && tarefa.updatedAt > tarefa.createdAt) {
      resposta += `🔄 Última atualização: ${tarefa.updatedAt.toLocaleDateString('pt-PT')}\n`;
    }
    
    // Opções para atualizar o status
    resposta += `\n📝 *Atualizar status da tarefa:*\n`;
    resposta += `1️⃣ Definir como Pendente\n`;
    resposta += `2️⃣ Definir como Em Andamento\n`;
    resposta += `3️⃣ Definir como Concluída\n`;
    
    // Navegação
    resposta += `\n${gerarBreadcrumb('ver_tarefa_detalhe')}\n`;
    resposta += `\n💡 Digite "voltar" para retornar à lista de tarefas ou "menu" para o menu principal.`;
    
    return {
      resposta,
      etapaNova: 'ver_tarefa_detalhe'
    };
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes da tarefa:', error);
    return {
      resposta: `⚠️ Ocorreu um erro ao buscar os detalhes da tarefa. Por favor, tente novamente.`,
      etapaNova: 'ver_tarefas'
    };
  }
};