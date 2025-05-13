// src/ia/fsm/tarefa/estadoCriandoTarefa.js

const Colaborador = require('../../../domains/colaborador/colaborador.model');
const Obra = require('../../../domains/obra/obra.model');
const Tarefa = require('../../../domains/tarefa/tarefa.model');
const { templates } = require('../../../utils/mensagensConfirmacao');
const { gerarBreadcrumb } = require('../../../utils/gerarResumoContextual');

module.exports = async function estadoCriandoTarefa(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  switch (colaborador.etapaCadastro) {
    case 'criando_tarefa_titulo':
      // Verificar se o título é válido (não vazio)
      if (!mensagem.trim()) {
        return { 
          resposta: '❌ O título da tarefa não pode estar vazio. Por favor, informe um título válido.', 
          etapaNova 
        };
      }
      
      colaborador.tempTituloTarefa = mensagem;
      etapaNova = 'criando_tarefa_descricao';
      
      // Resposta com breadcrumb
      resposta = `📝 Título registrado: *${mensagem}*\n\nAgora descreva a tarefa (ou digite "pular" para continuar sem descrição).\n\n${gerarBreadcrumb('criando_tarefa_descricao')}`;
      
      await colaborador.save();
      break;

    case 'criando_tarefa_descricao':
      colaborador.tempDescricaoTarefa = (mensagem.toLowerCase() === 'pular') ? '' : mensagem;
      etapaNova = 'criando_tarefa_prazo';
      
      // Resposta condicional com indicação de progresso
      if (mensagem.toLowerCase() === 'pular') {
        resposta = `⏩ Descrição pulada.\n\n📅 Qual o *prazo* da tarefa? (ex: 15/05/2025 ou digite "sem prazo")\n\n${gerarBreadcrumb('criando_tarefa_prazo')}`;
      } else {
        resposta = `📝 Descrição registrada.\n\n📅 Qual o *prazo* da tarefa? (ex: 15/05/2025 ou digite "sem prazo")\n\n${gerarBreadcrumb('criando_tarefa_prazo')}`;
      }
      
      await colaborador.save();
      break;

    case 'criando_tarefa_prazo':
      let prazo = null;
      
      if (mensagem.toLowerCase() !== 'sem prazo') {
        // Aceitar formato DD/MM/AAAA
        const partes = mensagem.split('/');
        if (partes.length === 3) {
          const [dia, mes, ano] = partes;
          // Converte para formato ISO (AAAA-MM-DD)
          prazo = new Date(`${ano}-${mes}-${dia}`);
        } else {
          // Tentativa direta de parsing
          prazo = new Date(mensagem);
        }
        
        if (isNaN(prazo)) {
          return { 
            resposta: '❌ Data inválida. Tente no formato: 15/05/2025 ou digite "sem prazo".', 
            etapaNova 
          };
        }
      }

      colaborador.tempPrazoTarefa = prazo;

      const ultimaObraId = colaborador.obras[colaborador.obras.length - 1];
      const obra = await Obra.findById(ultimaObraId).populate('colaboradores');

      if (!obra || obra.colaboradores.length === 0) {
        return { 
          resposta: '⚠️ Nenhum colaborador encontrado nesta obra. Volte ao menu e tente novamente.', 
          etapaNova: 'menu' 
        };
      }

      // Gera lista com nome + função
      const lista = obra.colaboradores.map((c, i) => {
        const nome = c.nome || c.telefone;
        const funcao = c.funcao ? ` (${c.funcao})` : '';
        return `${i + 1}️⃣ ${nome}${funcao}`;
      }).join('\n');

      colaborador.tempColaboradoresDisponiveis = obra.colaboradores.map(c => c._id);
      etapaNova = 'criando_tarefa_atribuicao';
      
      // Resposta com breadcrumb e resumo da tarefa até agora
      resposta = `💼 *Resumo da tarefa até agora:*\n`;
      resposta += `📌 Título: ${colaborador.tempTituloTarefa}\n`;
      if (colaborador.tempDescricaoTarefa) {
        resposta += `📝 Descrição: ${colaborador.tempDescricaoTarefa}\n`;
      }
      resposta += `📅 Prazo: ${prazo ? prazo.toLocaleDateString('pt-PT') : 'Sem prazo'}\n\n`;
      resposta += `👥 Quem deve receber esta tarefa?\n\n${lista}\n\nDigite o número do colaborador.\n\n${gerarBreadcrumb('criando_tarefa_atribuicao')}`;
      
      await colaborador.save();
      break;

    case 'criando_tarefa_atribuicao':
      const index = parseInt(mensagem) - 1;
      const ids = colaborador.tempColaboradoresDisponiveis || [];

      if (isNaN(index) || index < 0 || index >= ids.length) {
        return { 
          resposta: '❌ Número inválido. Digite o número de um colaborador listado.', 
          etapaNova 
        };
      }

      // Buscar nome do colaborador para feedback
      const colaboradorSelecionado = await Colaborador.findById(ids[index]);
      const nomeColaborador = colaboradorSelecionado?.nome || 'colaborador selecionado';
      
      // Criar a nova tarefa
      const novaTarefa = new Tarefa({
        titulo: colaborador.tempTituloTarefa,
        descricao: colaborador.tempDescricaoTarefa,
        prazo: colaborador.tempPrazoTarefa,
        atribuidaPara: [ids[index]],
        obra: colaborador.obras[colaborador.obras.length - 1]
      });

      await novaTarefa.save();

      // Limpar campos temporários
      colaborador.tempTituloTarefa = undefined;
      colaborador.tempDescricaoTarefa = undefined;
      colaborador.tempPrazoTarefa = undefined;
      colaborador.tempColaboradoresDisponiveis = undefined;

      etapaNova = 'menu';
      
      // Usar template de confirmação
      resposta = templates.tarefaCriada(novaTarefa, nomeColaborador);
      
      await colaborador.save();
      break;
  }

  return { resposta, etapaNova };
};