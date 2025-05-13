const express = require('express');
const router = express.Router();
const processarMensagem = require('../services/mensagem.service').processarMensagem;

router.post('/webhook', async (req, res) => {
  console.log('📦 Webhook recebido - corpo completo:', JSON.stringify(req.body));
  
  try {
    let phone, message, mediaUrl;
    
    // Z-API está enviando num formato específico
    if (req.body.fromMe === false) {
      phone = req.body.phone;
      
      // Verificações de imagem com logs detalhados
      console.log('🔍 Verificando tipo de mensagem...');
      
      if (req.body.image) {
        console.log('🖼️ Campo "image" detectado no payload:', req.body.image);
        mediaUrl = req.body.image.imageUrl;
        message = req.body.image.caption || "imagem";
        console.log('📸 Imagem detectada - URL:', mediaUrl);
        console.log('📝 Legenda da imagem:', message);
      } 
      else if (req.body.type === 'image') {
        console.log('🖼️ Tipo "image" detectado no payload');
        mediaUrl = req.body.mediaUrl || req.body.content;
        message = req.body.caption || "imagem";
        console.log('📸 Imagem detectada - URL:', mediaUrl);
      }
      // Verificar outros formatos possíveis
      else if (req.body.media && req.body.media.url) {
        console.log('🖼️ Campo "media" detectado no payload:', req.body.media);
        mediaUrl = req.body.media.url;
        message = req.body.media.caption || "imagem";
        console.log('📸 Imagem via media - URL:', mediaUrl);
      }
      // Verificar se existe informação de mídia em algum lugar do payload
      else {
        // Procurar em todas as propriedades para encontrar URLs potenciais de imagem
        for (const key in req.body) {
          if (typeof req.body[key] === 'object' && req.body[key] !== null) {
            console.log(`🔍 Examinando propriedade "${key}":`, JSON.stringify(req.body[key]));
            
            if (req.body[key].url || req.body[key].mediaUrl || req.body[key].imageUrl) {
              console.log(`🖼️ Possível URL de mídia encontrada em "${key}"`);
              mediaUrl = req.body[key].url || req.body[key].mediaUrl || req.body[key].imageUrl;
              message = req.body[key].caption || req.body[key].message || "imagem";
              console.log('📸 URL de mídia encontrada:', mediaUrl);
              break;
            }
          }
        }
      }
      
      // Para mensagens de texto
      if (!mediaUrl) {
        if (req.body.text && typeof req.body.text === 'object' && req.body.text.message) {
          message = req.body.text.message;
        } else if (req.body.text && typeof req.body.text === 'string') {
          message = req.body.text;
        } else {
          message = req.body.message || req.body.body || "mensagem não identificada";
        }
        console.log('💬 Mensagem de texto:', message);
      }
    }
    
    console.log('📱 Telefone extraído:', phone);
    console.log('💬 Mensagem final:', message);
    console.log('🖼️ URL de mídia final:', mediaUrl || 'Nenhuma');
    
    if (!phone || !message) {
      console.error('❌ Dados incompletos:', { phone, message });
      return res.status(200).json({ error: 'Dados incompletos', received: req.body });
    }

    // Criar contexto apenas se detectarmos uma URL de mídia
    const contexto = mediaUrl ? { 
      mediaUrl, 
      isImage: true,
      messageType: 'image' 
    } : undefined;
    
    if (contexto) {
      console.log('✅ Contexto de mídia criado:', contexto);
    }
    
    // Processar a mensagem
    await processarMensagem(phone, message, contexto);
    console.log('✅ Mensagem processada com sucesso');
    res.status(200).json({ status: 'success' });
    
  } catch (err) {
    console.error('❌ Erro no webhook:', err.message);
    console.error('Stack de erro:', err.stack);
    res.status(200).json({ error: 'Erro interno, mas registrado com sucesso' });
  }
});

// Rota de teste para verificar se o webhook está funcionando
router.get('/webhook', (req, res) => {
  res.status(200).json({ message: 'Webhook está funcionando!' });
});

module.exports = router;