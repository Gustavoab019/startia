// src/ia/fsm/tarefa/estadoSelecionandoMinhaTarefa.js - VERSÃO COMPLETA COM PROBLEMAS VINCULADOS

const Tarefa = require('../../../domains/tarefa/tarefa.model');
const Problema = require('../../../domains/problema/problema.model');

module.exports = async function estadoSelecionandoMinhaTarefa(colaborador, mensagem) {
 try {
   // Verificar se tem tarefas salvas para seleção
   if (!colaborador.tempTarefasIds || colaborador.tempTarefasIds.length === 0) {
     // Limpar estado e voltar
     colaborador.tempTarefasIds = undefined;
     await colaborador.save();
     
     return {
       resposta: `❌ Nenhuma tarefa encontrada. Voltando ao menu.`,
       etapaNova: 'menu'
     };
   }

   const comando = mensagem.trim().toLowerCase();

   // Comandos especiais
   if (comando === 'menu' || comando === '0') {
     colaborador.tempTarefasIds = undefined;
     await colaborador.save();
     return {
       resposta: `🔙 Voltando ao menu principal...`,
       etapaNova: 'menu'
     };
   }

   // Processar seleção numérica
   if (!isNaN(parseInt(mensagem))) {
     const indice = parseInt(mensagem) - 1;
     
     if (indice >= 0 && indice < colaborador.tempTarefasIds.length) {
       const tarefaId = colaborador.tempTarefasIds[indice];
       
       // Buscar a tarefa selecionada
       const tarefa = await Tarefa.findById(tarefaId);
       
       if (!tarefa) {
         return {
           resposta: `❌ Tarefa não encontrada. Tente novamente.`,
           etapaNova: 'selecionando_minha_tarefa'
         };
       }

       // Definir como tarefa ativa e ir para gerenciar
       colaborador.tempTarefaSelecionadaId = tarefaId;
       colaborador.tempTarefasIds = undefined; // Limpar lista
       await colaborador.save();

       // ✅ BUSCAR PROBLEMAS DA TAREFA
       const problemas = await Problema.find({ tarefa: tarefaId })
         .populate('relator', 'nome')
         .sort({ createdAt: -1 });

       // Calcular tempo decorrido
       const tempoDecorrido = calcularTempoDecorrido(tarefa.updatedAt);

       let resposta = `📋 *TAREFA SELECIONADA*

📋 ${tarefa.titulo}
🏠 Unidade: ${tarefa.unidade}
🔧 Fase: ${tarefa.fase}
📊 Status: ${tarefa.status === 'em_andamento' ? '🔄 Em andamento' : tarefa.status === 'concluida' ? '✅ Concluída' : '🟡 Pendente'}
⏰ ${tarefa.status === 'em_andamento' ? `Em andamento há: ${tempoDecorrido}` : 
        tarefa.status === 'concluida' ? 'Concluída' : 'Aguardando início'}`;

       // ✅ MOSTRAR PROBLEMAS SE EXISTIREM
       if (problemas.length > 0) {
         resposta += `\n\n⚠️ *PROBLEMAS DESTA TAREFA (${problemas.length}):*`;
         
         // Mostrar até 3 problemas mais recentes
         problemas.slice(0, 3).forEach((prob, i) => {
           const statusIcon = prob.status === 'aberto' ? '🔴' : 
                             prob.status === 'em_analise' ? '🟡' : '🟢';
           const data = prob.createdAt.toLocaleDateString('pt-BR');
           const hora = prob.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
           
           resposta += `\n\n${statusIcon} ${prob.descricao.substring(0, 35)}${prob.descricao.length > 35 ? '...' : ''}`;
           resposta += `\n   📅 ${data} ${hora} por ${prob.relator?.nome || 'Anônimo'}`;
           if (prob.fotoUrl) {
             resposta += `\n   📸 Com foto anexada`;
           }
         });
         
         if (problemas.length > 3) {
           resposta += `\n\n💡 ... e mais ${problemas.length - 3} problema${problemas.length - 3 > 1 ? 's' : ''}`;
         }
       } else {
         resposta += `\n\n✅ Nenhum problema reportado para esta tarefa.`;
       }

       resposta += `\n\n🎯 *O que fazer agora?*
1️⃣ Marcar como concluída
2️⃣ Reportar problema
3️⃣ Ver mais tarefas
4️⃣ Ver todos os problemas desta tarefa
0️⃣ Voltar ao menu`;

       return {
         resposta,
         etapaNova: 'gerenciando_tarefa_ativa'
       };
     } else {
       return {
         resposta: `❌ Número inválido. Escolha entre 1 e ${colaborador.tempTarefasIds.length}.`,
         etapaNova: 'selecionando_minha_tarefa'
       };
     }
   }

   // ✅ COMANDOS ESPECIAIS ADICIONAIS
   if (comando === 'todas' || comando === 'all') {
     // Mostrar todas as tarefas novamente
     const tarefas = await Tarefa.find({
       _id: { $in: colaborador.tempTarefasIds }
     }).sort({ andar: 1, unidade: 1 });
     
     let resposta = `📋 *SUAS TAREFAS EM ANDAMENTO (${tarefas.length}):*\n\n`;
     
     tarefas.forEach((tarefa, i) => {
       const statusIcon = tarefa.status === 'em_andamento' ? '🔄' : 
                         tarefa.status === 'concluida' ? '✅' : '🟡';
       resposta += `${i + 1}️⃣ ${statusIcon} ${tarefa.titulo}\n`;
       resposta += `   🏠 ${tarefa.unidade} | 🔧 ${tarefa.fase}\n`;
     });
     
     resposta += `\n💡 Digite o número para gerenciar uma tarefa
📊 Digite "resumo" para ver estatísticas das suas tarefas
0️⃣ Digite "0" para voltar ao menu`;
     
     return {
       resposta,
       etapaNova: 'selecionando_minha_tarefa'
     };
   }
   
   if (comando === 'resumo') {
     // Resumo das tarefas pessoais
     const tarefas = await Tarefa.find({
       _id: { $in: colaborador.tempTarefasIds }
     });
     
     const stats = {
       total: tarefas.length,
       concluidas: tarefas.filter(t => t.status === 'concluida').length,
       andamento: tarefas.filter(t => t.status === 'em_andamento').length,
       pendentes: tarefas.filter(t => t.status === 'pendente').length
     };
     
     // Buscar problemas das suas tarefas
     const problemasMinhasTarefas = await Problema.countDocuments({
       tarefa: { $in: colaborador.tempTarefasIds },
       status: { $ne: 'resolvido' }
     });
     
     const progresso = stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0;
     const progressBar = '█'.repeat(Math.floor(progresso / 10)) + '░'.repeat(10 - Math.floor(progresso / 10));
     
     return {
       resposta: `📊 *RESUMO DAS SUAS TAREFAS*

${progressBar} ${progresso}% das suas tarefas concluídas

📋 *SUAS ESTATÍSTICAS:*
✅ Concluídas: ${stats.concluidas}
🔄 Em andamento: ${stats.andamento}
🟡 Pendentes: ${stats.pendentes}
📊 Total suas: ${stats.total}

⚠️ *SEUS PROBLEMAS:*
🔴 Abertos: ${problemasMinhasTarefas}

💡 Digite o número de uma tarefa para gerenciá-la
0️⃣ Digite "0" para voltar ao menu`,
       etapaNova: 'selecionando_minha_tarefa'
     };
   }

   // Comando não reconhecido
   return {
     resposta: `❓ *COMANDO NÃO RECONHECIDO*

Digite o número da tarefa que deseja gerenciar (1 a ${colaborador.tempTarefasIds.length})

🎯 *COMANDOS DISPONÍVEIS:*
- **Número (1-${colaborador.tempTarefasIds.length})** - Selecionar tarefa
- **"todas"** - Ver lista completa novamente  
- **"resumo"** - Suas estatísticas pessoais
- **"menu"** ou **"0"** - Voltar ao menu principal`,
     etapaNova: 'selecionando_minha_tarefa'
   };

 } catch (error) {
   console.error('❌ Erro ao selecionar tarefa:', error);
   
   // Limpar dados e voltar ao menu
   colaborador.tempTarefasIds = undefined;
   await colaborador.save();
   
   return {
     resposta: `❌ Erro inesperado: ${error.message}

Voltando ao menu principal.`,
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