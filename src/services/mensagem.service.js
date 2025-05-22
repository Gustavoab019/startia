const { obterOuCriarColaborador } = require('../domains/colaborador/colaborador.service');
const { fsmResponder } = require('../ia/fsm/fsmHandler');
const { 
  enviarMensagemWhatsApp, 
  enviarMensagemComBotoes,
  enviarListaSelecao,
  enviarRespostaRapida,
  verificarSuporteBotoes 
} = require('./whatsapp.service');

/**
 * Determina se a interface com botões deve ser usada
 * @param {String} estado - Estado atual do colaborador
 * @param {Object} colaborador - Dados do colaborador
 * @returns {Promise<Boolean>} - True se deve usar botões
 */
async function deveUsarBotoes(estado, colaborador) {
  // Verificar preferência do colaborador (se foi configurada)
  if (colaborador.prefereInterface === 'texto') {
    return false;
  }
  
  if (colaborador.prefereInterface === 'botoes') {
    return true;
  }
  
  // Verificar se o dispositivo suporta botões
  const suportaBotoes = await verificarSuporteBotoes(colaborador.telefone);
  
  // Se ainda não sabemos a preferência, armazenar resultado da verificação
  if (!colaborador.prefereInterface) {
    colaborador.prefereInterface = suportaBotoes ? 'botoes' : 'texto';
    await colaborador.save();
  }
  
  return suportaBotoes;
}

/**
 * Converte o payload de resposta em formato apropriado (botões ou texto)
 * @param {String} telefone - Telefone do destinatário
 * @param {Object} respostaPayload - Payload de resposta do FSM
 * @param {Object} colaborador - Dados do colaborador
 * @returns {Promise<Boolean>} - Se a mensagem foi enviada com sucesso
 */
async function enviarRespostaFormatada(telefone, respostaPayload, colaborador) {
  // Se for apenas uma string, enviar como mensagem de texto simples
  if (typeof respostaPayload === 'string') {
    return await enviarMensagemWhatsApp(telefone, respostaPayload);
  }
  
  // Verificar se temos um payload formatado para botões
  if (respostaPayload.formato) {
    const usarBotoes = await deveUsarBotoes(colaborador.etapaCadastro, colaborador);
    
    // Se não devemos usar botões, converter para texto
    if (!usarBotoes) {
      console.log('⚠️ Convertendo resposta formatada para texto simples');
      return await enviarMensagemWhatsApp(telefone, respostaPayload.textoPlano || respostaPayload.texto);
    }
    
    // Enviar no formato adequado
    switch (respostaPayload.formato) {
      case 'botoes':
        return await enviarMensagemComBotoes(
          telefone,
          respostaPayload.titulo,
          respostaPayload.texto,
          respostaPayload.botoes,
          respostaPayload.rodape
        );
        
      case 'lista':
        return await enviarListaSelecao(
          telefone,
          respostaPayload.titulo,
          respostaPayload.texto,
          respostaPayload.textoBotao,
          respostaPayload.secoes,
          respostaPayload.rodape
        );
        
      case 'respostaRapida':
        return await enviarRespostaRapida(
          telefone,
          respostaPayload.texto,
          respostaPayload.respostas
        );
        
      default:
        // Formato desconhecido, usar texto simples
        console.warn(`⚠️ Formato desconhecido: ${respostaPayload.formato}. Usando texto simples.`);
        return await enviarMensagemWhatsApp(telefone, respostaPayload.textoPlano || respostaPayload.texto);
    }
  }
  
  // Se não for um payload formatado, tratar como texto
  return await enviarMensagemWhatsApp(telefone, respostaPayload.texto || respostaPayload);
}

/**
 * Processa resposta de botão interativo
 * @param {Object} respostaBotao - Payload da resposta do botão 
 * @returns {Object} Objeto com id do botão e texto mapeado
 */
function processarRespostaBotao(respostaBotao) {
  try {
    console.log('🔍 Processando resposta de botão:', JSON.stringify(respostaBotao));
    
    let idBotao = null;
    let textoBotao = null;
    
    // Tentar extrair de diferentes formatos de resposta
    if (respostaBotao.selectedButtonId) {
      // Formato padrão da Z-API
      idBotao = respostaBotao.selectedButtonId;
      textoBotao = respostaBotao.selectedButtonText || '';
    } else if (respostaBotao.listResponse && respostaBotao.listResponse.id) {
      // Resposta de lista
      idBotao = respostaBotao.listResponse.id;
      textoBotao = respostaBotao.listResponse.title || '';
    } else if (respostaBotao.button && respostaBotao.button.id) {
      // Outro formato possível
      idBotao = respostaBotao.button.id;
      textoBotao = respostaBotao.button.text || '';
    } else if (respostaBotao.quickReplyResponse && respostaBotao.quickReplyResponse.id) {
      // Resposta rápida
      idBotao = respostaBotao.quickReplyResponse.id;
      textoBotao = respostaBotao.quickReplyResponse.text || '';
    }
    
    // Se encontramos um ID, retornar objeto formatado
    if (idBotao) {
      return {
        tipo: 'botao',
        idBotao,
        textoBotao,
        mensagemOriginal: textoBotao // Para compatibilidade
      };
    }
    
    // Não conseguiu identificar como resposta de botão
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao processar resposta de botão:', error);
    return null;
  }
}

async function processarMensagem(telefone, mensagem, contexto) {
  try {
    console.log(`📥 Processando mensagem de ${telefone}:`, mensagem);
    console.log('🔍 Contexto recebido:', contexto || 'Nenhum');
    
    // Verificar se temos o nome no contexto
    const nomeContato = contexto && contexto.senderName ? contexto.senderName : undefined;
    
    // Usar ou não obter nome dependendo se já temos do contexto
    const obterNome = !nomeContato; // Só tenta obter via API se não veio no contexto
    const colaborador = await obterOuCriarColaborador(telefone, obterNome);
    
    // Se o colaborador não tem nome mas temos nome no contexto, atualizar
    if (!colaborador.nome && nomeContato) {
      console.log(`✅ Atualizando nome do colaborador a partir do contexto: ${nomeContato}`);
      colaborador.nome = nomeContato;
      await colaborador.save();
    }
    
    // Processar resposta de botão se for uma interação com botão
    let mensagemProcessada = mensagem;
    let tipoInteracao = 'texto';
    
    // Verificar se é uma resposta de botão (contexto pode conter esses dados)
    if (contexto && (contexto.isButton || contexto.isList || contexto.isQuickReply)) {
      const dadosBotao = processarRespostaBotao(contexto);
      
      if (dadosBotao) {
        console.log('✅ Resposta de botão detectada:', dadosBotao);
        mensagemProcessada = dadosBotao;
        tipoInteracao = 'botao';
      }
    }
    
    // Tentar detectar no próprio corpo da mensagem (enviado como JSON string às vezes)
    if (tipoInteracao === 'texto' && typeof mensagem === 'string') {
      try {
        if (mensagem.startsWith('{') && mensagem.endsWith('}')) {
          const objPotencial = JSON.parse(mensagem);
          
          if (objPotencial.selectedButtonId || 
              (objPotencial.listResponse && objPotencial.listResponse.id) || 
              (objPotencial.button && objPotencial.button.id) ||
              (objPotencial.quickReplyResponse && objPotencial.quickReplyResponse.id)) {
            
            const dadosBotao = processarRespostaBotao(objPotencial);
            
            if (dadosBotao) {
              console.log('✅ Resposta de botão detectada no corpo da mensagem:', dadosBotao);
              mensagemProcessada = dadosBotao;
              tipoInteracao = 'botao';
            }
          }
        }
      } catch (e) {
        // Não é JSON válido, continuar tratando como texto
      }
    }
    
    // Adicionar infos de interação ao contexto
    const contextoEnriquecido = {
      ...contexto,
      tipoInteracao
    };
    
    // Passa o contexto para o fsmResponder (para processar imagens, etc)
    const resposta = await fsmResponder(colaborador, mensagemProcessada, contextoEnriquecido);
    
    // Obter etapa nova e resposta formatada
    let etapaNova = resposta.etapaNova;
    let respostaFormatada = resposta.resposta;
    
    if (etapaNova && etapaNova !== colaborador.etapaCadastro) {
      colaborador.etapaCadastro = etapaNova;
    }
    
    colaborador.ultimoAcesso = new Date();
    await colaborador.save();
    
    if (respostaFormatada) {
      console.log(`📤 Resposta para ${telefone}:`, 
                  typeof respostaFormatada === 'string' ? 
                  respostaFormatada : 
                  JSON.stringify(respostaFormatada));
      
      if (process.env.WHATSAPP_ENV === 'prod') {
        const enviado = await enviarRespostaFormatada(telefone, respostaFormatada, colaborador);
        
        if (!enviado) {
          console.log('⚠️ Não foi possível enviar via WhatsApp. Adicionando à fila de pendentes...');
          // Se for objeto, converter para texto plano
          const mensagemTextual = typeof respostaFormatada === 'string' ? 
                                 respostaFormatada : 
                                 (respostaFormatada.textoPlano || respostaFormatada.texto);
          adicionarMensagemPendente(telefone, mensagemTextual);
        }
      } else {
        console.log(`🔕 Modo dev: mensagem NÃO enviada ao WhatsApp`);
      }
    }
    
    // Retornar a resposta para ser usada na função de simulação
    return respostaFormatada;
    
  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
    throw err; // Repassar o erro para ser tratado pelo chamador
  }
}

// Simulação via terminal ou Insomnia
async function processarMensagemSimulada(req, res) {
  try {
    const { telefone, mensagem, senderName, buttonResponse } = req.body;
    
    if (!telefone || !mensagem) {
      return res.status(400).json({ erro: 'Campos obrigatórios: telefone e mensagem' });
    }
    
    // Criar contexto para simulação
    const contexto = {};
    
    if (senderName) {
      contexto.senderName = senderName;
    }
    
    // Se tiver uma simulação de resposta de botão
    if (buttonResponse) {
      if (typeof buttonResponse === 'string') {
        // Formato simples: apenas ID do botão
        contexto.isButton = true;
        contexto.selectedButtonId = buttonResponse;
      } else {
        // Objeto completo representando resposta de botão
        Object.assign(contexto, buttonResponse);
        contexto.isButton = true;
      }
      
      console.log('🔘 Simulando resposta de botão:', contexto);
    }
    
    // Capturar a resposta do processarMensagem
    const respostaBot = await processarMensagem(telefone, mensagem, contexto);
    
    // Formatar a resposta para a visualização na simulação
    let respostaFormatada;
    if (typeof respostaBot === 'string') {
      respostaFormatada = respostaBot;
    } else {
      // Converter para formato legível
      respostaFormatada = {
        tipo: respostaBot.formato || 'texto',
        conteudo: respostaBot.textoPlano || respostaBot.texto,
        detalhes: respostaBot
      };
    }
    
    // Retornar um JSON com status e a resposta do bot
    return res.status(200).json({ 
      status: 'Mensagem processada com sucesso',
      mensagemOriginal: mensagem,
      resposta: respostaFormatada,
      telefone: telefone,
      nome: senderName || 'Não fornecido',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Erro no endpoint simulado:', err);
    return res.status(500).json({ 
      erro: 'Erro interno',
      mensagem: err.message
    });
  }
}

module.exports = {
  processarMensagem,
  processarMensagemSimulada,
  deveUsarBotoes,
  enviarRespostaFormatada
};