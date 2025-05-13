const { verificarStatusPresenca, registrarEntrada, registrarSaida } = require('../../../domains/presenca/presenca.service');

/**
 * Handler para estado de registro de presença
 * @param {Object} colaborador - Objeto colaborador do MongoDB
 * @param {String} mensagemTexto - Texto da mensagem recebida
 * @param {Object} obra - Objeto obra (opcional)
 * @returns {Promise<Object>} Resposta e próximo estado
 */
async function estadoRegistrarPresenca(colaborador, mensagemTexto, obra = null) {
  // Se não tem obra selecionada, verificar situação das obras do colaborador
  if (!obra) {
    // Verificar se colaborador tem obras associadas
    if (!colaborador.obras || colaborador.obras.length === 0) {
      return {
        resposta: "Você não está associado a nenhuma obra. Por favor, entre em uma obra primeiro.",
        proximoEstado: 'menu'
      };
    }
    
    // Se tem apenas uma obra, selecionar automaticamente
    if (colaborador.obras.length === 1) {
      const obraId = colaborador.obras[0];
      return handleRegistroPresenca(colaborador, mensagemTexto, obraId);
    }
    
    // Caso tenha múltiplas obras, pedir para selecionar
    return {
      resposta: "Você precisa selecionar uma obra primeiro para registrar presença.",
      proximoEstado: 'menu'
    };
  }
  
  // Se tem obra, processar registro
  return handleRegistroPresenca(colaborador, mensagemTexto, obra._id);
}

/**
 * Formata hora atual para exibição
 * @returns {String} Hora formatada
 */
function obterHoraAtual() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Processa o registro de presença
 * @param {Object} colaborador - Objeto colaborador
 * @param {String} mensagemTexto - Texto da mensagem
 * @param {String} obraId - ID da obra
 * @returns {Promise<Object>} Resposta e próximo estado
 */
async function handleRegistroPresenca(colaborador, mensagemTexto, obraId) {
  try {
    // Verificar status atual de presença
    const status = await verificarStatusPresenca(colaborador._id, obraId);
    
    // Normalizar mensagem para processamento
    const comando = mensagemTexto.toLowerCase().trim();
    
    // Se mensagem é apenas consulta de status
    if (comando.includes('status') || 
        comando.includes('como estou') ||
        comando === '?') {
      return {
        resposta: formatarRespostaStatus(status),
        proximoEstado: 'menu'
      };
    }
    
    // Verificar comandos de entrada
    const comandosEntrada = ['entrar', 'entrada', 'cheguei', '1'];
    const isComandoEntrada = comandosEntrada.some(cmd => comando.includes(cmd)) || comando === '1';
    
    // Verificar comandos de saída
    const comandosSaida = ['sair', 'saida', 'saída', 'sai', '2'];
    const isComandoSaida = comandosSaida.some(cmd => comando.includes(cmd)) || comando === '2';
    
    // Registrar entrada
    if (isComandoEntrada && status.status !== 'trabalhando') {
      const resultado = await registrarEntrada(colaborador._id, obraId);
      
      if (!resultado.sucesso) {
        return {
          resposta: `❌ ${resultado.mensagem}`,
          proximoEstado: 'menu'
        };
      }
      
      return {
        resposta: `✅ Entrada registrada com sucesso às ${obterHoraAtual()}! Bom trabalho! Quando terminar seu expediente, envie 'saída' para registrar sua saída.`,
        proximoEstado: 'menu'
      };
    }
    
    // Registrar saída
    if (isComandoSaida && status.status === 'trabalhando') {
      const resultado = await registrarSaida(colaborador._id, obraId);
      
      if (!resultado.sucesso) {
        return {
          resposta: `❌ ${resultado.mensagem}`,
          proximoEstado: 'menu'
        };
      }
      
      // Formatar horas trabalhadas com precisão de 2 casas decimais
      const horasFormatadas = resultado.horasTrabalhadas.toFixed(2);
      
      return {
        resposta: `✅ Saída registrada com sucesso às ${obterHoraAtual()}! Você trabalhou ${horasFormatadas} horas hoje.${resultado.descontoAlmoco ? ' (com desconto de almoço)' : ''}`,
        proximoEstado: 'menu'
      };
    }
    
    // Se solicitou menu, voltar para o menu
    if (comando === '0' || comando === 'menu' || comando === 'voltar') {
      return {
        resposta: "Voltando ao menu principal...",
        proximoEstado: 'menu'
      };
    }
    
    // Se nenhum comando foi reconhecido, mostrar opções
    return {
      resposta: formatarMenuPresenca(status),
      proximoEstado: 'registrando_presenca'
    };
  } catch (error) {
    console.error('❌ Erro ao registrar presença:', error);
    return {
      resposta: `❌ Não foi possível processar seu pedido: ${error.message}`,
      proximoEstado: 'menu'
    };
  }
}

/**
 * Formata resposta de status
 * @param {Object} status - Objeto de status de presença
 * @returns {String} Mensagem formatada
 */
function formatarRespostaStatus(status) {
  if (!status.presente) {
    return "📝 Você ainda não registrou presença hoje. Envie 'entrada' para registrar sua chegada.";
  }
  
  if (status.status === 'trabalhando') {
    const horasFormatadas = status.horasPassadas.toFixed(1);
    return `⏱️ Você está na obra há ${horasFormatadas} horas. Envie 'saída' quando terminar seu expediente.`;
  }
  
  if (status.status === 'concluido') {
    return `✅ Você já concluiu seu expediente hoje. Trabalhou ${status.horasTrabalhadas} horas.`;
  }
  
  return "Status desconhecido. Entre em contato com o suporte.";
}

/**
 * Formata menu de opções de presença
 * @param {Object} status - Objeto de status de presença
 * @returns {String} Menu formatado
 */
function formatarMenuPresenca(status) {
  if (!status.presente) {
    return "📝 *Registro de Presença*\n\n" +
           "Você ainda não registrou presença hoje.\n\n" +
           "1. Registrar entrada\n" +
           "0. Voltar ao menu principal";
  }
  
  if (status.status === 'trabalhando') {
    const horasFormatadas = status.horasPassadas.toFixed(1);
    return "📝 *Registro de Presença*\n\n" +
           `Você está na obra há ${horasFormatadas} horas.\n\n` +
           "2. Registrar saída\n" +
           "0. Voltar ao menu principal";
  }
  
  if (status.status === 'concluido') {
    return "📝 *Registro de Presença*\n\n" +
           `Você já concluiu seu expediente hoje. Trabalhou ${status.horasTrabalhadas} horas.\n\n` +
           "0. Voltar ao menu principal";
  }
  
  return "Status desconhecido. Entre em contato com o suporte.";
}

module.exports = estadoRegistrarPresenca;