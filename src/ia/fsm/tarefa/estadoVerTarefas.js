// src/ia/fsm/tarefa/estadoVerTarefas.js - VERSÃO COMPLETA COM RESUMO E CORREÇÕES

const Tarefa = require('../../../domains/tarefa/tarefa.model');
const Problema = require('../../../domains/problema/problema.model');
const mongoose = require('mongoose');

module.exports = async function estadoVerTarefas(colaborador, mensagem) {
 try {
   // ✅ CORREÇÃO: Buscar obra ativa corretamente
   let obraId = null;
   if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
     obraId = colaborador.subEstado;
   } else if (colaborador.obras && colaborador.obras.length > 0) {
     obraId = colaborador.obras[0];
   }
   
   if (!obraId) {
     return {
       resposta: `❌ Você não está em nenhuma obra. Digite "2" para entrar em uma obra.`,
       etapaNova: 'menu'
     };
   }

   // ✅ BUSCAR TODAS AS TAREFAS DA OBRA
   const todasTarefas = await Tarefa.find({ obra: obraId }).sort({ andar: 1, unidade: 1 });
   
   if (!todasTarefas.length) {
     return {
       resposta: `📭 Nenhuma tarefa encontrada nesta obra.

Digite "5" para cadastrar uma nova tarefa.`,
       etapaNova: 'menu'
     };
   }

   // ✅ PROCESSAR COMANDOS ESPECIAIS
   if (mensagem) {
     const cmd = mensagem.toLowerCase().trim();
     
     // ✅ NOVO: Comando "resumo" - Estatísticas da obra
     if (cmd === 'resumo') {
       const problemasAbertos = await Problema.countDocuments({ 
         obra: obraId, 
         status: { $ne: 'resolvido' } 
       });
       
       const stats = {
         total: todasTarefas.length,
         pendentes: todasTarefas.filter(t => t.status === 'pendente').length,
         andamento: todasTarefas.filter(t => t.status === 'em_andamento').length,
         concluidas: todasTarefas.filter(t => t.status === 'concluida').length,
         problemas: problemasAbertos
       };
       
       const progresso = stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0;
       const progressBar = '█'.repeat(Math.floor(progresso / 10)) + '░'.repeat(10 - Math.floor(progresso / 10));
       
       return {
         resposta: `📊 *RESUMO DA OBRA*

${progressBar} ${progresso}% concluído

📋 *TAREFAS:*
✅ Concluídas: ${stats.concluidas}
🔄 Em andamento: ${stats.andamento}  
🟡 Pendentes: ${stats.pendentes}
📊 Total: ${stats.total}

⚠️ *PROBLEMAS:*
🔴 Abertos: ${stats.problemas}

🎯 *COMANDOS:*
- *"minhas"* - Suas tarefas pessoais
- *"todas"* - Ver todas disponíveis
- *"5"* - Criar nova tarefa
- *"menu"* - Voltar ao menu`,
         etapaNova: 'ver_tarefas'
       };
     }
     
     // ✅ COMANDO: "todas" - Ver todas as tarefas (sem limite)
     if (cmd === 'todas' || cmd === 'all') {
       const tarefasDisponiveis = todasTarefas.filter(t => 
         t.status === 'pendente' && t.atribuidaPara.length === 0
       );
       
       if (!tarefasDisponiveis.length) {
         return {
           resposta: `✅ Todas as tarefas estão atribuídas ou concluídas!
           
Digite "resumo" para ver estatísticas gerais.`,
           etapaNova: 'ver_tarefas'
         };
       }
       
       let resposta = `🟢 *TODAS AS TAREFAS DISPONÍVEIS (${tarefasDisponiveis.length}):*\n\n`;
       
       // ✅ CORREÇÃO: Mostrar TODAS as tarefas com numeração contínua
       tarefasDisponiveis.forEach((tarefa, i) => {
         resposta += `${i + 1}️⃣ ${tarefa.titulo}\n`;
         resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
       });
       
       resposta += `\n💡 Digite o número (1 a ${tarefasDisponiveis.length}) para PEGAR uma tarefa`;
       resposta += `\n📋 Digite "resumo" para ver estatísticas gerais`;
       
       // ✅ SALVAR TODAS as tarefas para seleção
       colaborador.tempTarefasIds = tarefasDisponiveis.map(t => t._id.toString());
       await colaborador.save();
       
       return { resposta, etapaNova: 'ver_tarefas' };
     }
     
     // Comando "minhas" - tarefas pessoais
     if (cmd === 'minhas') {
       const minhasTarefas = todasTarefas.filter(t => 
         t.atribuidaPara.some(id => id.toString() === colaborador._id.toString())
       );
       
       if (!minhasTarefas.length) {
         return {
           resposta: `📋 Você não tem tarefas em andamento.

🟢 Digite "todas" para ver TODAS as tarefas disponíveis.
📊 Digite "resumo" para ver estatísticas da obra.`,
           etapaNova: 'menu'
         };
       }
       
       // ✅ SE TEM APENAS 1 TAREFA, IR DIRETO PARA GERENCIAR
       if (minhasTarefas.length === 1) {
         const tarefa = minhasTarefas[0];
         colaborador.tempTarefaSelecionadaId = tarefa._id.toString();
         await colaborador.save();
         
         const tempoDecorrido = calcularTempoDecorrido(tarefa.updatedAt);
         
         return {
           resposta: `📋 *SUA TAREFA EM ANDAMENTO*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
⏰ Em andamento há: ${tempoDecorrido}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas
4️⃣ Ver problemas desta tarefa
0️⃣ Voltar ao menu`,
           etapaNova: 'gerenciando_tarefa_ativa'
         };
       }
       
       // ✅ SE TEM MÚLTIPLAS, MOSTRAR LISTA COMPLETA
       let resposta = `📋 *SUAS TAREFAS EM ANDAMENTO (${minhasTarefas.length}):*\n\n`;
       
       minhasTarefas.forEach((tarefa, i) => {
         const statusIcon = tarefa.status === 'em_andamento' ? '🔄' : '✅';
         resposta += `${i + 1}️⃣ ${statusIcon} ${tarefa.titulo}\n`;
         resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
       });
       
       resposta += `\n💡 Digite o número para gerenciar uma tarefa`;
       
       // ✅ SALVAR IDS DAS TAREFAS PARA SELEÇÃO
       colaborador.tempTarefasIds = minhasTarefas.map(t => t._id.toString());
       await colaborador.save();
       
       return { resposta, etapaNova: 'selecionando_minha_tarefa' };
     }

     // ✅ NOVO: Comando "completo" - Relatório detalhado
if (cmd === 'completo') {
  const problemasDetalhados = await Problema.find({ obra: obraId })
    .populate('relator', 'nome')
    .populate('tarefa', 'titulo unidade fase')
    .sort({ createdAt: -1 });
  
  let resposta = `📊 *RELATÓRIO COMPLETO DA OBRA*\n\n`;
  
  // ✅ AGRUPAR TAREFAS POR ANDAR
  const tarefasPorAndar = {};
  todasTarefas.forEach(tarefa => {
    const andar = tarefa.andar || 0;
    if (!tarefasPorAndar[andar]) {
      tarefasPorAndar[andar] = [];
    }
    tarefasPorAndar[andar].push(tarefa);
  });
  
  // ✅ MOSTRAR CADA ANDAR COM DETALHES
  Object.keys(tarefasPorAndar)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(andar => {
      const tarefasAndar = tarefasPorAndar[andar];
      const concluidas = tarefasAndar.filter(t => t.status === 'concluida').length;
      const total = tarefasAndar.length;
      const progresso = Math.round((concluidas / total) * 100);
      
      resposta += `🏢 *${andar}º ANDAR* - ${progresso}% (${concluidas}/${total})\n`;
      resposta += `${'='.repeat(35)}\n`;
      
      // ✅ ORDENAR POR UNIDADE
      tarefasAndar.sort((a, b) => a.unidade?.localeCompare(b.unidade) || 0);
      
      tarefasAndar.forEach(tarefa => {
        // Status da tarefa
        const statusIcon = tarefa.status === 'concluida' ? '✅' : 
                          tarefa.status === 'em_andamento' ? '🔄' : '🟡';
        const statusTexto = tarefa.status === 'concluida' ? 'CONCLUÍDA' : 
                           tarefa.status === 'em_andamento' ? 'EM ANDAMENTO' : 'PENDENTE';
        
        resposta += `\n📋 ${statusIcon} **${tarefa.unidade}** - ${tarefa.fase}\n`;
        resposta += `   📝 ${tarefa.titulo}\n`;
        resposta += `   📊 Status: ${statusTexto}\n`;
        
        // ✅ RESPONSÁVEL (se atribuída)
        if (tarefa.atribuidaPara && tarefa.atribuidaPara.length > 0) {
          // Aqui precisaríamos popular, mas por simplicidade vamos mostrar que está atribuída
          resposta += `   👤 Atribuída: Sim\n`;
        }
        
        // ✅ PRAZO (se definido)
        if (tarefa.prazo) {
          const prazoFormatado = tarefa.prazo.toLocaleDateString('pt-BR');
          const hoje = new Date();
          const diasRestantes = Math.ceil((tarefa.prazo - hoje) / (1000 * 60 * 60 * 24));
          
          let prazoStatus = '';
          if (diasRestantes < 0) {
            prazoStatus = ' ⚠️ ATRASADA';
          } else if (diasRestantes === 0) {
            prazoStatus = ' 📌 HOJE';
          } else if (diasRestantes <= 2) {
            prazoStatus = ' ⚡ URGENTE';
          }
          
          resposta += `   📅 Prazo: ${prazoFormatado}${prazoStatus}\n`;
        }
        
        // ✅ PROBLEMAS DESTA TAREFA
        const problemasTarefa = problemasDetalhados.filter(p => 
          p.tarefa && p.tarefa._id.toString() === tarefa._id.toString()
        );
        
        if (problemasTarefa.length > 0) {
          resposta += `   ⚠️ Problemas (${problemasTarefa.length}):\n`;
          
          problemasTarefa.slice(0, 2).forEach(prob => {
            const pStatusIcon = prob.status === 'aberto' ? '🔴' : 
                               prob.status === 'em_analise' ? '🟡' : '🟢';
            const pData = prob.createdAt.toLocaleDateString('pt-BR');
            
            resposta += `      ${pStatusIcon} ${prob.descricao.substring(0, 25)}${prob.descricao.length > 25 ? '...' : ''}\n`;
            resposta += `         📅 ${pData} por ${prob.relator?.nome || 'Anônimo'}\n`;
          });
          
          if (problemasTarefa.length > 2) {
            resposta += `      💡 ... e mais ${problemasTarefa.length - 2} problema${problemasTarefa.length - 2 > 1 ? 's' : ''}\n`;
          }
        }
        
        resposta += `\n`;
      });
      
      resposta += `\n`;
    });
  
  // ✅ RESUMO FINAL
  const stats = {
    total: todasTarefas.length,
    concluidas: todasTarefas.filter(t => t.status === 'concluida').length,
    andamento: todasTarefas.filter(t => t.status === 'em_andamento').length,
    pendentes: todasTarefas.filter(t => t.status === 'pendente').length
  };
  
  const problemasAbertos = problemasDetalhados.filter(p => p.status !== 'resolvido').length;
  const progressoGeral = Math.round((stats.concluidas / stats.total) * 100);
  
  resposta += `📊 *RESUMO GERAL:*\n`;
  resposta += `✅ Concluídas: ${stats.concluidas} (${progressoGeral}%)\n`;
  resposta += `🔄 Em andamento: ${stats.andamento}\n`;
  resposta += `🟡 Pendentes: ${stats.pendentes}\n`;
  resposta += `⚠️ Problemas abertos: ${problemasAbertos}\n`;
  
  resposta += `\n🎯 *COMANDOS:*\n`;
  resposta += `• "resumo" - Visão geral rápida\n`;
  resposta += `• "minhas" - Suas tarefas\n`;
  resposta += `• "menu" - Voltar ao menu`;
  
  return {
    resposta,
    etapaNova: 'ver_tarefas'
  };
}
     
     // ✅ PROCESSAR SELEÇÃO DE TAREFA (PEGAR DO POOL)
     if (!isNaN(parseInt(mensagem))) {
       const indice = parseInt(mensagem) - 1;
       
       // ✅ CORREÇÃO: Usar tarefas salvas se existirem (para "todas")
       let tarefasParaSelecao;
       
       if (colaborador.tempTarefasIds && colaborador.tempTarefasIds.length > 0) {
         // Usar lista completa salva
         tarefasParaSelecao = await Tarefa.find({
           _id: { $in: colaborador.tempTarefasIds }
         }).sort({ andar: 1, unidade: 1 });
       } else {
         // Usar apenas as 8 primeiras (comportamento padrão)
         tarefasParaSelecao = todasTarefas.filter(t => 
           t.status === 'pendente' && t.atribuidaPara.length === 0
         ).slice(0, 8);
       }
       
       if (indice >= 0 && indice < tarefasParaSelecao.length) {
         const tarefa = tarefasParaSelecao[indice];
         
         // ✅ VERIFICAR SE TAREFA AINDA ESTÁ DISPONÍVEL
         const tarefaAtual = await Tarefa.findById(tarefa._id);
         if (!tarefaAtual || tarefaAtual.status !== 'pendente' || tarefaAtual.atribuidaPara.length > 0) {
           // Limpar cache
           colaborador.tempTarefasIds = undefined;
           await colaborador.save();
           
           return {
             resposta: `❌ Essa tarefa já foi pega por outro colaborador!

Digite "todas" para ver tarefas atualizadas.`,
             etapaNova: 'ver_tarefas'
           };
         }
         
         // ✅ PEGAR TAREFA (POOL)
         tarefaAtual.status = 'em_andamento';
         tarefaAtual.atribuidaPara = [colaborador._id];
         await tarefaAtual.save();
         
         // ✅ CORREÇÃO: Salvar como tarefa ativa e ir para gerenciamento
         colaborador.tempTarefaSelecionadaId = tarefaAtual._id.toString();
         colaborador.tempTarefasIds = undefined; // Limpar cache
         await colaborador.save();
         
         return {
           resposta: `✅ *TAREFA INICIADA!*

📋 ${tarefaAtual.titulo}
🏠 Unidade: ${tarefaAtual.unidade}
🔧 Fase: ${tarefaAtual.fase}
⏰ Iniciado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas
4️⃣ Ver problemas desta tarefa

💡 Digite "minhas" para ver suas tarefas em andamento`,
           etapaNova: 'gerenciando_tarefa_ativa' // ✅ CORRIGIDO
         };
       } else {
         const maxIndice = colaborador.tempTarefasIds ? 
           colaborador.tempTarefasIds.length : 
           Math.min(8, todasTarefas.filter(t => t.status === 'pendente' && t.atribuidaPara.length === 0).length);
           
         return {
           resposta: `❌ Número inválido. Digite entre 1 e ${maxIndice}.

💡 Digite "todas" para ver todas as opções.`,
           etapaNova: 'ver_tarefas'
         };
       }
     }
   }

   // ✅ AGRUPAR POR ANDAR (VISÃO GERAL)
   const tarefasPorAndar = {};
   todasTarefas.forEach(tarefa => {
     const andar = tarefa.andar || 'Sem andar';
     if (!tarefasPorAndar[andar]) {
       tarefasPorAndar[andar] = { total: 0, concluidas: 0, andamento: 0, disponiveis: 0 };
     }
     
     tarefasPorAndar[andar].total++;
     
     if (tarefa.status === 'concluida') {
       tarefasPorAndar[andar].concluidas++;
     } else if (tarefa.status === 'em_andamento') {
       tarefasPorAndar[andar].andamento++;
     } else if (tarefa.atribuidaPara.length === 0) {
       tarefasPorAndar[andar].disponiveis++;
     }
   });

   // ✅ TAREFAS DISPONÍVEIS PARA PEGAR
   const tarefasDisponiveis = todasTarefas.filter(t => 
     t.status === 'pendente' && t.atribuidaPara.length === 0
   );
   
   // ✅ GERAR RESPOSTA PRINCIPAL
   let resposta = `📋 *TAREFAS DA OBRA*\n\n`;
   
   // Resumo por andar
   resposta += `🏢 *RESUMO POR ANDAR:*\n`;
   Object.keys(tarefasPorAndar)
     .sort((a, b) => parseInt(a) - parseInt(b))
     .forEach(andar => {
       const stats = tarefasPorAndar[andar];
       const progresso = Math.round((stats.concluidas / stats.total) * 100);
       const progressBar = '█'.repeat(Math.floor(progresso / 10)) + '░'.repeat(10 - Math.floor(progresso / 10));
       
       resposta += `${andar}º: ${progressBar} ${progresso}% (${stats.concluidas}/${stats.total})\n`;
       resposta += `   🟢 ${stats.concluidas} | 🔄 ${stats.andamento} | 🟡 ${stats.disponiveis}\n`;
     });
   
   // ✅ MOSTRAR PRIMEIRAS TAREFAS DISPONÍVEIS
   if (tarefasDisponiveis.length > 0) {
     resposta += `\n🟢 *TAREFAS DISPONÍVEIS (${tarefasDisponiveis.length} total):*\n`;
     
     // Mostrar apenas as primeiras 8 para não sobrecarregar
     const tarefasExibir = tarefasDisponiveis.slice(0, 8);
     
     tarefasExibir.forEach((tarefa, i) => {
       resposta += `${i + 1}️⃣ ${tarefa.titulo}\n`;
       resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
     });
     
     if (tarefasDisponiveis.length > 8) {
       resposta += `\n... e mais ${tarefasDisponiveis.length - 8} tarefas\n`;
       resposta += `💡 Digite *"todas"* para ver TODAS as ${tarefasDisponiveis.length} tarefas\n`;
     }
     
     resposta += `\n🔢 Digite o número para PEGAR uma tarefa`;
   } else {
     resposta += `\n✅ Todas as tarefas estão atribuídas ou concluídas!`;
   }
   
   resposta += `\n\n🎯 *COMANDOS:*`;
   resposta += `\n• *"minhas"* - Suas tarefas em andamento`;
   resposta += `\n• *"todas"* - Ver TODAS as tarefas disponíveis`;
   resposta += `\n• *"resumo"* - Estatísticas gerais da obra`;
   resposta += `\n• *"5"* - Criar nova tarefa`;
   resposta += `\n• *"menu"* - Voltar ao menu`;

   return {
     resposta,
     etapaNova: 'ver_tarefas'
   };
   
 } catch (error) {
   console.error('❌ Erro ao ver tarefas:', error);
   return {
     resposta: `❌ Erro ao carregar tarefas. Tente novamente.`,
     etapaNova: 'menu'
   };
 }
};

// ✅ FUNÇÃO AUXILIAR: Calcular tempo decorrido
function calcularTempoDecorrido(dataInicio) {
 if (!dataInicio) return 'tempo indeterminado';
 
 const agora = new Date();
 const inicio = new Date(dataInicio);
 const diffMs = agora - inicio;
 
 const horas = Math.floor(diffMs / (1000 * 60 * 60));
 const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
 
 if (horas === 0) {
   return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
 } else if (minutos === 0) {
   return `${horas} hora${horas !== 1 ? 's' : ''}`;
 } else {
   return `${horas}h${minutos}min`;
 }
}