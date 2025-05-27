// src/ia/fsm/problema/estadoRelatandoProblema.js - VERSÃO CORRIGIDA E FUNCIONAL

const { criarProblema } = require('../../../domains/problema/problema.service');
const Obra = require('../../../domains/obra/obra.model');
const Tarefa = require('../../../domains/tarefa/tarefa.model');

module.exports = async function estadoRelatandoProblema(colaborador, mensagem, contexto) {
 console.log('🔍 Estado Relatando Problema - entrada', { 
   subEstado: colaborador.subEstado,
   mensagem,
   temContexto: !!contexto,
   colaboradorId: colaborador._id.toString(),
   estadoAnterior: colaborador.tempEstadoAnterior
 });
 
 let resposta = '';
 let etapaNova = colaborador.etapaCadastro;

 // Verifica o sub-estado do relato de problema
 const subEstado = colaborador.subEstado || 'inicio';
 console.log(`🔍 Sub-estado atual: ${subEstado}`);

 if (subEstado === 'inicio') {
   colaborador.subEstado = 'descricao';
   resposta = `📝 Por favor, descreva o problema encontrado na obra:`;
   etapaNova = 'relatando_problema_descricao';
   await colaborador.save();
 }
 
 else if (subEstado === 'descricao') {
   // Armazena a descrição temporariamente
   colaborador.tempDescricaoProblema = mensagem;
   colaborador.subEstado = 'foto';
   
   resposta = `📸 Agora, envie uma foto do problema (ou digite "pular" para continuar sem foto).`;
   etapaNova = 'relatando_problema_foto';
   await colaborador.save();
 }
 
 else if (subEstado === 'foto') {
   console.log('🔍 Processando foto do problema');
   
   // ✅ CORREÇÃO: Buscar obra ativa corretamente
   let obraAtiva = null;
   
   // Primeiro tentar pegar da lista de obras do colaborador
   if (colaborador.obras && colaborador.obras.length > 0) {
     const obraId = colaborador.obras[0]; // Primeira obra = ativa
     console.log('🔍 Buscando obra com ID:', obraId);
     obraAtiva = await Obra.findById(obraId);
   }
   
   if (!obraAtiva) {
     console.error('❌ Colaborador não possui obra ativa');
     
     // Limpar dados temporários
     colaborador.tempDescricaoProblema = undefined;
     colaborador.subEstado = undefined;
     colaborador.tempEstadoAnterior = undefined;
     await colaborador.save();
     
     resposta = `❌ Você não possui uma obra ativa. Por favor, entre em uma obra antes de relatar um problema.`;
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
     console.log(`🔍 Tentando criar problema reportado por: ${colaborador.nome || colaborador.telefone}`);
     console.log('🔍 Tentando criar problema com URL direto do WhatsApp:', fotoUrl);
     
     // Criar o problema
     const problema = await criarProblema({
       obraId: obraAtiva._id,
       relatorId: colaborador._id,
       tarefaId: colaborador.tempTarefaSelecionadaId,
       descricao,
       fotoUrl
     });
     
     console.log('✅ Problema criado com sucesso:', problema._id);
     
     // ✅ VERIFICAR SE DEVE VOLTAR AO ESTADO ANTERIOR
     const estadoAnterior = colaborador.tempEstadoAnterior;
     
     if (estadoAnterior === 'gerenciando_tarefa_ativa' && colaborador.tempTarefaSelecionadaId) {
       // Voltar para gerenciar a tarefa
       const tarefa = await Tarefa.findById(colaborador.tempTarefaSelecionadaId);
       
       if (tarefa) {
         // Limpar dados temporários do problema
         colaborador.tempDescricaoProblema = undefined;
         colaborador.subEstado = undefined;
         colaborador.tempEstadoAnterior = undefined;
         await colaborador.save();
         
         // Resposta com link de volta para a tarefa
         resposta = `✅ *PROBLEMA RELATADO COM SUCESSO!*

📋 Descrição: ${descricao}
${fotoUrl ? '📸 Foto: Anexada\n' : ''}🏗️ Obra: ${obraAtiva.nome}

O responsável foi notificado automaticamente.

🔄 *VOLTANDO PARA SUA TAREFA:*
📋 ${tarefa.titulo} - ${tarefa.unidade}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar outro problema
3️⃣ Ver mais tarefas
0️⃣ Voltar ao menu`;
         
         etapaNova = 'gerenciando_tarefa_ativa';
       } else {
         // Tarefa não existe mais, voltar ao menu
         colaborador.tempDescricaoProblema = undefined;
         colaborador.subEstado = undefined;
         colaborador.tempEstadoAnterior = undefined;
         colaborador.tempTarefaSelecionadaId = undefined;
         await colaborador.save();
         
         resposta = `✅ *PROBLEMA RELATADO COM SUCESSO!*

📋 Descrição: ${descricao}
${fotoUrl ? '📸 Foto: Anexada\n' : ''}🏗️ Obra: ${obraAtiva.nome}

O responsável foi notificado.

⚠️ Sua tarefa anterior não foi encontrada. Voltando ao menu principal.`;
         etapaNova = 'menu';
       }
     } else {
       // Fluxo normal - voltar ao menu
       colaborador.tempDescricaoProblema = undefined;
       colaborador.subEstado = undefined;
       colaborador.tempEstadoAnterior = undefined;
       await colaborador.save();
       
       resposta = `✅ *PROBLEMA RELATADO COM SUCESSO!*

📋 Descrição: ${descricao}
${fotoUrl ? '📸 Foto: Anexada\n' : ''}🏗️ Obra: ${obraAtiva.nome}

O responsável foi notificado automaticamente.

🎯 *Próximos passos:*
3️⃣ Ver suas tarefas
🔟 Ver todos os problemas
0️⃣ Voltar ao menu`;
       
       etapaNova = 'menu';
     }
     
   } catch (error) {
     console.error('❌ Erro ao registrar problema:', error);
     
     // Limpar dados temporários mesmo em caso de erro
     colaborador.tempDescricaoProblema = undefined;
     colaborador.subEstado = undefined;
     colaborador.tempEstadoAnterior = undefined;
     await colaborador.save();
     
     resposta = `❌ Não foi possível registrar o problema. Por favor, tente novamente mais tarde.

Digite "menu" para voltar ao menu principal.`;
     etapaNova = 'menu';
   }
 }

 console.log('✅ Resposta do estado:', { resposta, etapaNova });
 return { resposta, etapaNova };
};