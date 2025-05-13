// src/ia/fsm/problema/estadoVerProblemas.js
const { listarProblemasPorObra, obterProblema } = require('../../../domains/problema/problema.service');
const { obterObraAtiva } = require('../../../domains/obra/obra.service');

module.exports = async function estadoVerProblemas(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;
  
  const subEstado = colaborador.subEstadoProblema || 'listar';
  
  // Listar problemas
  if (subEstado === 'listar') {
    const obraAtiva = await obterObraAtiva(colaborador);
    
    if (!obraAtiva) {
      resposta = `❌ Você não possui uma obra ativa. Por favor, entre em uma obra para ver os problemas.`;
      return { resposta, etapaNova: 'menu' };
    }
    
    // Lista todos os problemas, sem filtro de status
    const problemas = await listarProblemasPorObra(obraAtiva._id);
    
    if (problemas.length === 0) {
      resposta = `✅ Não há problemas reportados para esta obra.`;
      return { resposta, etapaNova: 'menu' };
    }
    
    resposta = `📋 *Problemas reportados na obra "${obraAtiva.nome}"*\n\n`;
    
    problemas.forEach((problema, index) => {
      // Formatação da data
      const data = new Date(problema.createdAt).toLocaleDateString('pt-BR');
      const hora = new Date(problema.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Status do problema
      let statusEmoji = '🔴';
      if (problema.status === 'em_analise') statusEmoji = '🟡';
      if (problema.status === 'resolvido') statusEmoji = '🟢';
      
      resposta += `${index + 1}. ${statusEmoji} [${data} às ${hora}] ${problema.descricao.substring(0, 40)}${problema.descricao.length > 40 ? '...' : ''}\n`;
    });
    
    resposta += `\nDigite o número do problema para ver mais detalhes, ou "menu" para voltar.`;
    
    // Armazena os IDs dos problemas temporariamente para consulta
    colaborador.tempProblemasIds = problemas.map(p => p._id.toString());
    colaborador.subEstadoProblema = 'detalhar';
    etapaNova = 'vendo_problemas';
  }
  
  // Detalhar um problema específico
  else if (subEstado === 'detalhar') {
    if (mensagem.toLowerCase() === 'menu' || mensagem.toLowerCase() === 'voltar') {
      colaborador.tempProblemasIds = undefined;
      colaborador.subEstadoProblema = undefined;
      return { resposta: 'Voltando ao menu principal...', etapaNova: 'menu' };
    }
    
    const indice = parseInt(mensagem) - 1;
    
    if (isNaN(indice) || indice < 0 || !colaborador.tempProblemasIds || indice >= colaborador.tempProblemasIds.length) {
      resposta = `❌ Opção inválida. Digite o número de um problema da lista ou "menu" para voltar.`;
      return { resposta, etapaNova };
    }
    
    const problemaId = colaborador.tempProblemasIds[indice];
    const problema = await obterProblema(problemaId);
    
    if (!problema) {
      resposta = `❌ Problema não encontrado. Por favor, tente novamente.`;
      return { resposta, etapaNova };
    }
    
    // Formata a data
    const data = new Date(problema.createdAt).toLocaleDateString('pt-BR');
    const hora = new Date(problema.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    resposta = `🔍 *Detalhes do problema*\n\n`;
    resposta += `📅 Data: ${data} às ${hora}\n`;
    
    // Verificação robusta do relator
    let nomeRelator = 'Colaborador não identificado';
    
    if (problema.relator) {
      // Caso o populate tenha funcionado e relator seja um objeto
      if (typeof problema.relator === 'object' && problema.relator.nome) {
        nomeRelator = problema.relator.nome;
      } 
      // Caso relator seja apenas uma string (ID)
      else if (typeof problema.relator === 'string') {
        nomeRelator = `ID ${problema.relator.substring(0, 6)}... (não carregado)`;
      }
      // Caso o populate tenha funcionado mas o nome não exista
      else if (typeof problema.relator === 'object' && problema.relator.telefone) {
        nomeRelator = `Telefone: ${problema.relator.telefone}`;
      }
    }
    
    resposta += `👷 Relatado por: ${nomeRelator}\n`;
    resposta += `📝 Descrição: ${problema.descricao}\n\n`;
    
    if (problema.fotoUrl) {
      resposta += `🖼️ Foto disponível em: ${problema.fotoUrl}\n\n`;
    }
    
    // Status com emoji
    let statusText = '🔴 Aberto';
    if (problema.status === 'em_analise') statusText = '🟡 Em análise';
    if (problema.status === 'resolvido') statusText = '🟢 Resolvido';
    
    resposta += `Status atual: ${statusText}\n\n`;
    resposta += `Digite "voltar" para ver a lista de problemas ou "menu" para o menu principal.`;
    
    etapaNova = 'vendo_problemas';
  }
  
  return { resposta, etapaNova };
};