// src/ia/fsm/tarefa/estadoVerTarefas.js

const { listarTarefasPorColaborador } = require('../../../domains/tarefa/tarefa.service');
const Obra = require('../../../domains/obra/obra.model');
const { gerarBreadcrumb } = require('../../../utils/gerarResumoContextual');

module.exports = async function estadoVerTarefas(colaborador, mensagem) {
  // Se recebemos um número e temos tarefas armazenadas, selecionar a tarefa
  if (mensagem && !isNaN(parseInt(mensagem)) && colaborador.tempTarefasIds) {
    const indice = parseInt(mensagem) - 1;
    if (indice >= 0 && indice < colaborador.tempTarefasIds.length) {
      // Armazenar o ID da tarefa selecionada
      colaborador.tempTarefaSelecionadaId = colaborador.tempTarefasIds[indice];
      await colaborador.save();
      
      // Redirecionar para o estado de detalhes da tarefa
      const estadoVerTarefaDetalhe = require('./estadoVerTarefaDetalhe');
      return await estadoVerTarefaDetalhe(colaborador);
    } else {
      // Índice inválido
      return {
        resposta: `❌ Opção inválida. Digite um número entre 1 e ${colaborador.tempTarefasIds.length} ou "menu" para voltar.`,
        etapaNova: 'ver_tarefas'
      };
    }
  }

  // Listar tarefas
  const tarefas = await listarTarefasPorColaborador(colaborador._id);

  if (!tarefas.length) {
    return {
      resposta: `📭 Você não possui tarefas atribuídas no momento.
      
${gerarBreadcrumb('ver_tarefas')}

O que você gostaria de fazer agora?
- Digite 5 para cadastrar uma nova tarefa
- Digite "menu" para voltar ao menu principal`,
      etapaNova: 'menu'
    };
  }

  // Agrupar por obra e status
  const tarefasPorObra = {};
  
  // Lista plana de IDs de tarefas para recuperar pelo índice
  const tarefasIds = [];
  const tarefasObjetos = {};
  
  for (const tarefa of tarefas) {
    // Adicionar à lista plana de IDs
    const tarefaId = tarefa._id.toString();
    tarefasIds.push(tarefaId);
    tarefasObjetos[tarefaId] = tarefa;
    
    // Agrupar por obra e status
    const obraId = tarefa.obra.toString();
    if (!tarefasPorObra[obraId]) tarefasPorObra[obraId] = {
      pendentes: [],
      emAndamento: [],
      concluidas: []
    };
    
    // Categorizar por status
    if (tarefa.status === 'pendente') {
      tarefasPorObra[obraId].pendentes.push(tarefa);
    } else if (tarefa.status === 'em_andamento') {
      tarefasPorObra[obraId].emAndamento.push(tarefa);
    } else {
      tarefasPorObra[obraId].concluidas.push(tarefa);
    }
  }
  
  // Salvar os IDs de tarefas no colaborador temporariamente
  colaborador.tempTarefasIds = tarefasIds;
  // Também armazenar o índice global de cada tarefa
  colaborador.tempIndicesPorTarefa = {};
  tarefasIds.forEach((id, index) => {
    colaborador.tempIndicesPorTarefa[id] = index + 1; // +1 para UI amigável (começa em 1)
  });
  await colaborador.save();

  let resposta = `📋 *Suas Tarefas:*\n`;

  // Resumo quantitativo
  const totalPendentes = tarefas.filter(t => t.status === 'pendente').length;
  const totalEmAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
  const totalConcluidas = tarefas.filter(t => t.status === 'concluida').length;
  
  resposta += `\n📊 *Resumo:*`;
  resposta += `\n🟡 Pendentes: ${totalPendentes}`;
  resposta += `\n🟠 Em andamento: ${totalEmAndamento}`;
  resposta += `\n✅ Concluídas: ${totalConcluidas}`;
  resposta += `\n`;

  // Contador global para numerar tarefas de 1 a N
  let contadorGlobal = 1;

  // Detalhes por obra
  for (const [obraId, categorias] of Object.entries(tarefasPorObra)) {
    const obra = await Obra.findById(obraId);
    resposta += `\n🏗️ *${obra?.nome || 'Obra Desconhecida'}*\n`;

    // Tarefas pendentes primeiro
    if (categorias.pendentes.length > 0) {
      resposta += `\n🟡 *Pendentes:*\n`;
      categorias.pendentes.forEach((tarefa) => {
        // Usar o contador global para listar tarefas de 1 a N
        resposta += `${contadorGlobal}. ${tarefa.titulo}\n`;
        if (tarefa.prazo) {
          const prazoFormatado = tarefa.prazo.toLocaleDateString('pt-PT');
          resposta += `   📅 Até: ${prazoFormatado}\n`;
        }
        contadorGlobal++;
      });
    }

    // Tarefas em andamento
    if (categorias.emAndamento.length > 0) {
      resposta += `\n🟠 *Em Andamento:*\n`;
      categorias.emAndamento.forEach((tarefa) => {
        resposta += `${contadorGlobal}. ${tarefa.titulo}\n`;
        contadorGlobal++;
      });
    }

    // Tarefas concluídas (limitadas a 3 para não sobrecarregar)
    if (categorias.concluidas.length > 0) {
      const limitadas = categorias.concluidas.slice(0, 3);
      resposta += `\n✅ *Concluídas (${categorias.concluidas.length}):*\n`;
      limitadas.forEach((tarefa) => {
        resposta += `${contadorGlobal}. ${tarefa.titulo}\n`;
        contadorGlobal++;
      });
      
      if (categorias.concluidas.length > 3) {
        resposta += `   ...e mais ${categorias.concluidas.length - 3}\n`;
        // Incrementar o contador para as tarefas não mostradas
        contadorGlobal += (categorias.concluidas.length - 3);
      }
    }
  }

  resposta += `\n${gerarBreadcrumb('ver_tarefas')}`;
  resposta += `\n\n💡 Digite o número da tarefa para ver detalhes ou "menu" para voltar.`;

  return {
    resposta: resposta.trim(),
    etapaNova: 'ver_tarefas' // IMPORTANTE: Manter no estado ver_tarefas em vez de menu
  };
};