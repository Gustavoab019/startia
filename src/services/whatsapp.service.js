const axios = require('axios');

// Configurações da Z-API
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN; // Adicionar esta variável no .env

// Logging para debug das variáveis
console.log('🔍 ZAPI_INSTANCE_ID:', ZAPI_INSTANCE_ID);
console.log('🔍 ZAPI_TOKEN:', ZAPI_TOKEN);
console.log('🔍 ZAPI_CLIENT_TOKEN:', ZAPI_CLIENT_TOKEN || 'NÃO DEFINIDO'); // Verificar se existe

// Função para formatar o telefone para o padrão da Z-API
function formatarTelefoneZAPI(numero) {
  // Remove caracteres não numéricos
  const numerosApenas = numero.replace(/\D/g, '');
  
  // Verifica se o número já tem código do país
  // Se não tiver, assume que é de Portugal (+351)
  if (!numerosApenas.startsWith('351') && numerosApenas.length <= 12) {
    return '351' + numerosApenas;
  }
  
  return numerosApenas;
}

// Função para enviar mensagens pelo WhatsApp
async function enviarMensagemWhatsApp(telefone, mensagem) {
  try {
    const numeroFormatado = formatarTelefoneZAPI(telefone);

    if (!numeroFormatado || !mensagem) {
      console.warn('⚠️ Telefone ou mensagem inválidos:');
      console.warn('Telefone:', telefone);
      console.warn('Mensagem:', mensagem);
      return false;
    }

    console.log(`✉️ Enviando mensagem para ${numeroFormatado}:\n${mensagem}`);

    // URL da API Z-API
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    
    console.log(`🔗 URL da requisição: ${url}`);
    
    // Payload básico
    const payload = {
      phone: numeroFormatado,
      message: mensagem
    };
    
    // Headers com Client-Token
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Adicionar Client-Token apenas se estiver definido
    if (ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }
    
    // Fazer a requisição
    const { data } = await axios.post(url, payload, { headers });
    
    console.log('✅ Mensagem enviada via Z-API:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data));
      
      // Mensagem específica para erros de autenticação
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('⚠️ Erro de autenticação. Verifique se ZAPI_CLIENT_TOKEN está configurado!');
      }
    }
    
    return false;
  }
}

// Armazenar mensagens pendentes em memória
const mensagensPendentes = [];

// Adicionar mensagem à fila de pendentes
function adicionarMensagemPendente(telefone, mensagem) {
  mensagensPendentes.push({
    id: Date.now(),
    telefone: formatarTelefoneZAPI(telefone),
    mensagem: mensagem,
    timestamp: new Date(),
    tentativas: 0
  });
  
  console.log(`📝 Mensagem adicionada à fila de pendentes. Total: ${mensagensPendentes.length}`);
}

// Obter lista de mensagens pendentes
function obterMensagensPendentes() {
  return mensagensPendentes;
}

// Reenviar uma mensagem pendente específica
async function reenviarMensagemPendente(id) {
  const index = mensagensPendentes.findIndex(msg => msg.id === id);
  
  if (index === -1) {
    console.error(`❌ Mensagem com ID ${id} não encontrada na fila de pendentes`);
    return false;
  }
  
  const mensagem = mensagensPendentes[index];
  mensagem.tentativas++;
  
  const sucesso = await enviarMensagemWhatsApp(mensagem.telefone, mensagem.mensagem);
  
  if (sucesso) {
    mensagensPendentes.splice(index, 1);
    return true;
  }
  
  return false;
}

module.exports = {
  enviarMensagemWhatsApp,
  adicionarMensagemPendente,
  obterMensagensPendentes,
  reenviarMensagemPendente
};