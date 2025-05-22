const { verificarStatusPresenca, registrarEntrada, registrarSaida } = require('../../../domains/presenca/presenca.service');
const { templates } = require('../../../utils/mensagensConfirmacao');

/**
 * Handler para estado de registro de presença
 * @param {Object} colaborador - Objeto colaborador do MongoDB
 * @param {String} mensagemTexto - Texto da mensagem recebida
 * @param {Object} obra - Objeto obra (opcional)
 * @returns {Promise<Object>} Resposta e próximo estado
 */
async function estadoRegistrarPresenca(colaborador, mensagemTexto, obra = null) {
  // Obter nome do colaborador para personalização
  const nomeColaborador = colaborador.nome ? `${colaborador.nome}` : '';
  
  // Se não tem obra selecionada, verificar situação das obras do colaborador
  if (!obra) {
    // Verificar se colaborador tem obras associadas
    if (!colaborador.obras || colaborador.obras.length === 0) {
      return {
        resposta: `❌ ACESSO INDISPONÍVEL

${nomeColaborador ? `Olá, ${nomeColaborador}!` : 'Olá!'} 
Você ainda não está vinculado a nenhuma obra.

Para acessar essa função:
1️⃣ Crie uma obra (digite "1")
2️⃣ Entre em uma obra existente (digite "2")`,
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
      resposta: `⚠️ MÚLTIPLAS OBRAS ENCONTRADAS

${nomeColaborador ? `Olá, ${nomeColaborador}!` : 'Olá!'} 
Você está vinculado a várias obras.

Como proceder:
1. Volte ao menu principal (digite "menu")
2. Selecione a opção 2️⃣ para escolher uma obra específica
3. Depois acesse a opção 4️⃣ novamente`,
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
    
    // Obter nome do colaborador para personalização
    const nomeColaborador = colaborador.nome ? `${colaborador.nome}` : '';
    
    // Obter nome da obra se possível
    let nomeObra = "";
    if (obraId) {
      try {
        const Obra = require('../../../domains/obra/obra.model');
        const obraEncontrada = await Obra.findById(obraId);
        if (obraEncontrada) {
          nomeObra = obraEncontrada.nome;
        }
      } catch (error) {
        console.error('Erro ao buscar nome da obra:', error);
      }
    }
    
    // Normalizar mensagem para processamento
    const comando = mensagemTexto.toLowerCase().trim();
    
    // Se mensagem é apenas consulta de status
    if (comando.includes('status') || 
        comando.includes('como estou') ||
        comando === '?') {
      return {
        resposta: formatarRespostaStatus(status, nomeObra, nomeColaborador),
        proximoEstado: 'registrando_presenca'
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
          resposta: `❌ OPERAÇÃO NÃO REALIZADA

Não foi possível registrar sua entrada: ${resultado.mensagem}

Por favor, tente novamente ou contate o administrador.
Digite qualquer tecla para voltar ao menu.`,
          proximoEstado: 'menu'
        };
      }
      
      const horaAtual = obterHoraAtual();
      
      // Usar template de mensagem de confirmação
      if (templates && templates.presencaRegistrada) {
        const mensagemEntrada = templates.presencaRegistrada('entrada', horaAtual);
        return {
          resposta: `${mensagemEntrada}\n\n🏗️ Obra: ${nomeObra || "Obra atual"}\n\n${nomeColaborador ? `Bom trabalho, ${nomeColaborador}!` : 'Bom trabalho!'} Lembre-se de registrar sua saída quando terminar o expediente.`,
          proximoEstado: 'menu'
        };
      }
      
      // Fallback caso o template não esteja disponível
      return {
        resposta: `✅ ENTRADA REGISTRADA COM SUCESSO!
⏰ Hora de início: ${horaAtual}
🏗️ Obra: ${nomeObra || "Obra atual"}

${nomeColaborador ? `Bom trabalho, ${nomeColaborador}!` : 'Bom trabalho!'} 

Quando terminar seu expediente, volte ao menu principal e selecione a opção 4 para registrar sua saída.

👉 Dica: você pode ver suas tarefas digitando "3" no menu principal.`,
        proximoEstado: 'menu'
      };
    }
    
    // Registrar saída
    if (isComandoSaida && status.status === 'trabalhando') {
      const resultado = await registrarSaida(colaborador._id, obraId);
      
      if (!resultado.sucesso) {
        return {
          resposta: `❌ OPERAÇÃO NÃO REALIZADA

Não foi possível registrar sua saída: ${resultado.mensagem}

Por favor, tente novamente ou contate o administrador.
Digite qualquer tecla para voltar ao menu.`,
          proximoEstado: 'menu'
        };
      }
      
      // Formatar horas trabalhadas com precisão de 2 casas decimais
      const horasFormatadas = resultado.horasTrabalhadas.toFixed(2);
      const horaAtual = obterHoraAtual();
      
      // Usar template de mensagem de confirmação
      if (templates && templates.presencaRegistrada) {
        const mensagemSaida = templates.presencaRegistrada('saida', horaAtual, `${horasFormatadas}h${resultado.descontoAlmoco ? ' (com desconto de almoço)' : ''}`);
        return {
          resposta: `${mensagemSaida}\n\n🏗️ Obra: ${nomeObra || "Obra atual"}\n\n${nomeColaborador ? `Obrigado pelo seu trabalho hoje, ${nomeColaborador}!` : 'Obrigado pelo seu trabalho hoje!'} Descanse bem.`,
          proximoEstado: 'menu'
        };
      }
      
      // Fallback caso o template não esteja disponível
      return {
        resposta: `✅ EXPEDIENTE FINALIZADO!

Resumo do seu dia:
⏰ Entrada: ${formatarHora(status.horaEntrada)} - Saída: ${horaAtual}
⏱️ Total de horas: ${horasFormatadas} horas trabalhadas${resultado.descontoAlmoco ? ' (com desconto de almoço)' : ''}
🏗️ Obra: ${nomeObra || "Obra atual"}

${nomeColaborador ? `Obrigado pelo seu trabalho hoje, ${nomeColaborador}!` : 'Obrigado pelo seu trabalho hoje!'} Descanse bem.
Digite qualquer tecla para voltar ao menu principal.`,
        proximoEstado: 'menu'
      };
    }
    
    // Se solicitou menu, voltar para o menu
    if (comando === '0' || comando === 'menu' || comando === 'voltar') {
      return {
        resposta: "🔙 Voltando ao menu principal...",
        proximoEstado: 'menu'
      };
    }
    
    // Se nenhum comando foi reconhecido, mostrar opções
    return {
      resposta: formatarMenuPresenca(status, nomeObra, nomeColaborador),
      proximoEstado: 'registrando_presenca'
    };
  } catch (error) {
    console.error('❌ Erro ao registrar presença:', error);
    return {
      resposta: `❌ ERRO INESPERADO

Ops! Ocorreu um erro: ${error.message}

Por favor, tente novamente ou contate o suporte.
Digite qualquer tecla para voltar ao menu principal.`,
      proximoEstado: 'menu'
    };
  }
}

/**
 * Formata hora para exibição
 * @param {Date} data - Data a ser formatada
 * @returns {String} Hora formatada
 */
function formatarHora(data) {
  if (!data) return "--:--";
  
  const d = new Date(data);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formata resposta de status
 * @param {Object} status - Objeto de status de presença
 * @param {String} nomeObra - Nome da obra
 * @param {String} nomeColaborador - Nome do colaborador
 * @returns {String} Mensagem formatada
 */
function formatarRespostaStatus(status, nomeObra, nomeColaborador) {
  const saudacao = nomeColaborador ? `${nomeColaborador}` : '';
  
  if (!status.presente) {
    return `📊 SEU STATUS ATUAL ${saudacao ? `(${saudacao})` : ''}:

❌ Você ainda não registrou entrada hoje
🏗️ Obra: ${nomeObra || "Obra atual"}

Para iniciar seu expediente, digite "1" para registrar entrada.`;
  }
  
  if (status.status === 'trabalhando') {
    const horasFormatadas = status.horasPassadas.toFixed(1);
    return `📊 SEU STATUS ATUAL ${saudacao ? `(${saudacao})` : ''}:

✅ Você está TRABALHANDO agora
⏰ Entrada registrada: ${formatarHora(status.horaEntrada)} (há ${horasFormatadas} horas)
🏗️ Obra: ${nomeObra || "Obra atual"}

Para registrar sua saída, digite "2".`;
  }
  
  if (status.status === 'concluido') {
    return `📊 SEU STATUS ATUAL ${saudacao ? `(${saudacao})` : ''}:

✅ Você já encerrou seu expediente hoje
⏰ Entrada: ${formatarHora(status.horaEntrada)} 
⏰ Saída: ${formatarHora(status.horaSaida)}
⏱️ Total trabalhado: ${status.horasTrabalhadas} horas
🏗️ Obra: ${nomeObra || "Obra atual"}

Bom descanso! Até amanhã.`;
  }
  
  return "Status desconhecido. Entre em contato com o suporte.";
}

/**
 * Formata menu de opções de presença
 * @param {Object} status - Objeto de status de presença
 * @param {String} nomeObra - Nome da obra
 * @param {String} nomeColaborador - Nome do colaborador
 * @returns {String} Menu formatado
 */
function formatarMenuPresenca(status, nomeObra, nomeColaborador) {
  const saudacao = nomeColaborador ? `Olá, ${nomeColaborador}!` : '';
  const obraTxt = nomeObra ? `\n🏗️ Obra: ${nomeObra}` : '';
  
  if (!status.presente) {
    return `📝 REGISTRO DE PRESENÇA${obraTxt}
${saudacao ? `\n${saudacao}` : ''}

Você ainda não registrou presença hoje.

1️⃣ Registrar ENTRADA agora (início de expediente)
0️⃣ Voltar ao menu principal

Digite "status" a qualquer momento para verificar sua situação.`;
  }
  
  if (status.status === 'trabalhando') {
    const horasFormatadas = status.horasPassadas.toFixed(1);
    return `📝 REGISTRO DE PRESENÇA${obraTxt}
${saudacao ? `\n${saudacao}` : ''}

✅ Você está trabalhando há ${horasFormatadas} horas 
   (entrada às ${formatarHora(status.horaEntrada)})

2️⃣ Registrar SAÍDA agora (fim de expediente)
0️⃣ Voltar ao menu principal`;
  }
  
  if (status.status === 'concluido') {
    return `📝 REGISTRO DE PRESENÇA${obraTxt}
${saudacao ? `\n${saudacao}` : ''}

✅ Você já concluiu seu expediente hoje!
⏱️ Total trabalhado: ${status.horasTrabalhadas} horas
   (entrada: ${formatarHora(status.horaEntrada)}, saída: ${formatarHora(status.horaSaida)})

0️⃣ Voltar ao menu principal`;
  }
  
  return "Status desconhecido. Entre em contato com o suporte.";
}

module.exports = estadoRegistrarPresenca;