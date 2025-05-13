const { obterOuCriarColaborador } = require('../domains/colaborador/colaborador.service');
const { fsmResponder } = require('../ia/fsm/fsmHandler');
const { enviarMensagemWhatsApp } = require('./whatsapp.service');

async function processarMensagem(telefone, mensagem, contexto) {
  try {
    const colaborador = await obterOuCriarColaborador(telefone);
    
    // Passa o contexto para o fsmResponder (para processar imagens, etc)
    const { resposta, etapaNova } = await fsmResponder(colaborador, mensagem, contexto);
    
    if (etapaNova && etapaNova !== colaborador.etapaCadastro) {
      colaborador.etapaCadastro = etapaNova;
    }
    
    colaborador.ultimoAcesso = new Date();
    await colaborador.save();
    
    if (resposta) {
      console.log(`📤 Resposta para ${telefone}:\n${resposta}`);
      
      if (process.env.WHATSAPP_ENV === 'prod') {
        const enviado = await enviarMensagemWhatsApp(telefone, resposta);
        
        if (!enviado) {
          console.log('⚠️ Não foi possível enviar via WhatsApp. Adicionando à fila de pendentes...');
          adicionarMensagemPendente(telefone, resposta);
        }
      } else {
        console.log(`🔕 Modo dev: mensagem NÃO enviada ao WhatsApp`);
      }
    }
    
    // Retornar a resposta para ser usada na função de simulação
    return resposta;
    
  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
    throw err; // Repassar o erro para ser tratado pelo chamador
  }
}

// Simulação via terminal ou Insomnia
async function processarMensagemSimulada(req, res) {
  try {
    const { telefone, mensagem } = req.body;
    
    if (!telefone || !mensagem) {
      return res.status(400).json({ erro: 'Campos obrigatórios: telefone e mensagem' });
    }
    
    // Capturar a resposta do processarMensagem
    const respostaBot = await processarMensagem(telefone, mensagem);
    
    // Retornar um JSON com status e a resposta do bot
    return res.status(200).json({ 
      status: 'Mensagem processada com sucesso',
      mensagemOriginal: mensagem,
      resposta: respostaBot,
      telefone: telefone,
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
  processarMensagemSimulada
};