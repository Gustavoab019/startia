// src/ia/fsm/problema/estadoRelatandoProblema.js
const { criarProblema } = require('../../../domains/problema/problema.service');
const { obterObraAtiva } = require('../../../domains/obra/obra.service');

module.exports = async function estadoRelatandoProblema(colaborador, mensagem, contexto) {
  console.log('🔍 Estado Relatando Problema - entrada', { 
    subEstado: colaborador.subEstado,
    mensagem,
    temContexto: !!contexto,
    colaboradorId: colaborador._id.toString() // log do ID do colaborador
  });
  
  if (contexto) {
    console.log('📸 Contexto de imagem recebido:', contexto);
  }
  
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  // Verifica o sub-estado do relato de problema
  const subEstado = colaborador.subEstado || 'inicio';
  console.log(`🔍 Sub-estado atual: ${subEstado}`);

  if (subEstado === 'inicio') {
    colaborador.subEstado = 'descricao';
    resposta = `📝 Por favor, descreva o problema encontrado na obra:`;
    etapaNova = 'relatando_problema_descricao';
  }
  
  else if (subEstado === 'descricao') {
    // Armazena a descrição temporariamente
    colaborador.tempDescricaoProblema = mensagem;
    colaborador.subEstado = 'foto';
    
    resposta = `📸 Agora, envie uma foto do problema (ou digite "pular" para continuar sem foto).`;
    etapaNova = 'relatando_problema_foto';
  }
  
  else if (subEstado === 'foto') {
    console.log('🔍 Processando foto do problema');
    const obraAtiva = await obterObraAtiva(colaborador);
    
    if (!obraAtiva) {
      console.error('❌ Colaborador não possui obra ativa');
      resposta = `❌ Você não possui uma obra ativa. Por favor, entre em uma obra antes de relatar um problema.`;
      colaborador.subEstado = undefined;
      return { resposta, etapaNova: 'menu' };
    }
    
    console.log('✅ Obra ativa encontrada:', obraAtiva.nome);
    const descricao = colaborador.tempDescricaoProblema;
    console.log('📝 Descrição do problema:', descricao);
    
    let fotoUrl = null;
    
    // Verificando se há imagem no contexto ou se a resposta é "pular"
    if (mensagem.toLowerCase() === 'pular') {
      console.log('⏩ Usuário optou por pular o envio da foto');
    } else if (contexto && contexto.mediaUrl) {
      console.log('📸 URL de mídia detectada:', contexto.mediaUrl);
      fotoUrl = contexto.mediaUrl;
    } else {
      console.log('⚠️ Nenhuma URL de mídia encontrada no contexto e mensagem não é "pular"');
    }
    
    try {
      // Verificar se o colaborador tem nome, caso contrário usar telefone para identificação
      const identificacao = colaborador.nome ? 
        `${colaborador.nome}` : 
        `Colaborador com telefone ${colaborador.telefone}`;
      
      console.log(`🔍 Tentando criar problema reportado por: ${identificacao}`);
      console.log(`🔍 ID do colaborador: ${colaborador._id}`);
      console.log('🔍 Tentando criar problema com URL direto do WhatsApp:', fotoUrl);
      
      // Criar o problema diretamente com a URL do WhatsApp, sem tentar fazer upload para o S3
      const problema = await criarProblema({
        obraId: obraAtiva._id,
        relatorId: colaborador._id, // Garantindo que é o _id e não outra variação
        descricao,
        fotoUrl // Usar diretamente a URL do WhatsApp
      });
      
      console.log('✅ Problema criado com sucesso:', problema._id);
      console.log('🔍 Problema criado com fotoUrl?', problema.fotoUrl ? 'Sim' : 'Não');
      if (problema.fotoUrl) {
        console.log('🖼️ URL da imagem usada:', problema.fotoUrl);
      }
      console.log('👷 Relator do problema:', problema.relator);
      
      // Resposta com ou sem indicação de foto
      if (fotoUrl) {
        resposta = `✅ Problema com foto relatado com sucesso!\n\n📋 Descrição: ${descricao}\n\nO responsável pela obra será notificado.`;
      } else {
        resposta = `✅ Problema relatado com sucesso!\n\n📋 Descrição: ${descricao}\n\nO responsável pela obra será notificado.`;
      }
      
      // Limpar dados temporários
      colaborador.tempDescricaoProblema = undefined;
      colaborador.subEstado = undefined;
    } catch (error) {
      console.error('❌ Erro ao registrar problema:', error);
      resposta = `❌ Não foi possível registrar o problema. Por favor, tente novamente mais tarde.`;
    }
    
    etapaNova = 'menu';
  }

  console.log('✅ Resposta do estado:', { resposta, etapaNova });
  return { resposta, etapaNova };
};