// src/ia/fsm/colaborador/estadoGuiaStartIA.js

module.exports = async function estadoGuiaStartIA(colaborador, mensagem) {
  // Botões de navegação para o guia
  const botoesNavegacao = [
    { id: 'guia_recursos', texto: '🛠️ Recursos disponíveis' },
    { id: 'guia_tarefas', texto: '📋 Sistema de tarefas' },
    { id: 'guia_presenca', texto: '⏱️ Registro de presença' },
    { id: 'menu_voltar', texto: '🏠 Menu principal' }
  ];
  
  // Se temos uma mensagem, verificar se é uma navegação específica
  if (mensagem) {
    const comando = mensagem.toLowerCase();
    
    // Mostrar guia específico baseado no comando
    if (comando === 'guia_recursos' || comando.includes('recursos')) {
      return {
        resposta: {
          formato: 'botoes',
          titulo: 'RECURSOS DO STARTIA',
          texto: `🛠️ *Principais recursos do StartIA:*

1. *Gestão de obras*: Crie e gerencie múltiplas obras simultaneamente.

2. *Gestão de equipe*: Adicione colaboradores e encarregados às suas obras.

3. *Controle de tarefas*: Crie, atribua e acompanhe tarefas.

4. *Registro de presença*: Controle de ponto digital via WhatsApp.

5. *Gestão de problemas*: Reporte problemas com fotos e acompanhe a resolução.

6. *Comunicação direta*: Acesso simples via WhatsApp, sem necessidade de instalar aplicativos adicionais.`,
          botoes: botoesNavegacao,
          textoPlano: `🛠️ *Principais recursos do StartIA:*

1. *Gestão de obras*: Crie e gerencie múltiplas obras simultaneamente.

2. *Gestão de equipe*: Adicione colaboradores e encarregados às suas obras.

3. *Controle de tarefas*: Crie, atribua e acompanhe tarefas.

4. *Registro de presença*: Controle de ponto digital via WhatsApp.

5. *Gestão de problemas*: Reporte problemas com fotos e acompanhe a resolução.

6. *Comunicação direta*: Acesso simples via WhatsApp, sem necessidade de instalar aplicativos adicionais.

Digite "menu" para voltar ao menu principal.`
        },
        etapaNova: 'guia_startia'
      };
    }
    else if (comando === 'guia_tarefas' || comando.includes('tarefas')) {
      return {
        resposta: {
          formato: 'botoes',
          titulo: 'SISTEMA DE TAREFAS',
          texto: `📋 *Sistema de tarefas do StartIA:*

📌 *Criação de tarefas:*
- Digite "5" no menu principal ou use o botão "Cadastrar tarefa"
- Defina título, descrição (opcional), prazo e responsável

📊 *Status das tarefas:*
- 🟡 *Pendente*: Tarefa criada mas não iniciada
- 🟠 *Em andamento*: Tarefa em execução
- ✅ *Concluída*: Tarefa finalizada

👁️ *Visualização:*
- Digite "3" no menu ou use o botão "Ver tarefas"
- Agrupamento por obra e status
- Filtros por status disponíveis
- Detalhe completo ao selecionar uma tarefa específica

📱 *Acesso móvel:*
- Acompanhe suas tarefas de qualquer lugar
- Atualize status diretamente pelo WhatsApp`,
          botoes: botoesNavegacao,
          textoPlano: `📋 *Sistema de tarefas do StartIA:*

📌 *Criação de tarefas:*
- Digite "5" no menu principal
- Defina título, descrição (opcional), prazo e responsável

📊 *Status das tarefas:*
- 🟡 *Pendente*: Tarefa criada mas não iniciada
- 🟠 *Em andamento*: Tarefa em execução
- ✅ *Concluída*: Tarefa finalizada

👁️ *Visualização:*
- Digite "3" no menu
- Agrupamento por obra e status
- Filtros por status disponíveis
- Detalhe completo ao selecionar uma tarefa específica

📱 *Acesso móvel:*
- Acompanhe suas tarefas de qualquer lugar
- Atualize status diretamente pelo WhatsApp

Digite "menu" para voltar ao menu principal.`
        },
        etapaNova: 'guia_startia'
      };
    }
    else if (comando === 'guia_presenca' || comando.includes('presença') || comando.includes('presenca')) {
      return {
        resposta: {
          formato: 'botoes',
          titulo: 'REGISTRO DE PRESENÇA',
          texto: `⏱️ *Sistema de registro de presença:*

📝 *Como registrar presença:*
- Digite "4" no menu principal ou use o botão "Registrar presença"
- Escolha entre registrar entrada ou saída
- O sistema registra automaticamente a data e hora

📊 *Controle de horas:*
- Ao registrar saída, o sistema calcula automaticamente as horas trabalhadas
- Visualize seu histórico do dia digitando "status"

🔄 *Fluxo diário recomendado:*
1. Registre entrada ao chegar na obra
2. Trabalhe normalmente durante o dia
3. Registre saída ao final do expediente
4. Verifique suas horas trabalhadas

⚙️ *Funcionalidades adicionais:*
- Relatórios de horas por colaborador (para encarregados)
- Histórico de presença
- Alertas de esquecimento de registro`,
          botoes: botoesNavegacao,
          textoPlano: `⏱️ *Sistema de registro de presença:*

📝 *Como registrar presença:*
- Digite "4" no menu principal
- Escolha entre registrar entrada ou saída
- O sistema registra automaticamente a data e hora

📊 *Controle de horas:*
- Ao registrar saída, o sistema calcula automaticamente as horas trabalhadas
- Visualize seu histórico do dia digitando "status"

🔄 *Fluxo diário recomendado:*
1. Registre entrada ao chegar na obra
2. Trabalhe normalmente durante o dia
3. Registre saída ao final do expediente
4. Verifique suas horas trabalhadas

⚙️ *Funcionalidades adicionais:*
- Relatórios de horas por colaborador (para encarregados)
- Histórico de presença
- Alertas de esquecimento de registro

Digite "menu" para voltar ao menu principal.`
        },
        etapaNova: 'guia_startia'
      };
    }
  }
  
  // Página inicial do guia (padrão)
  return {
    resposta: {
      formato: 'botoes',
      titulo: 'O QUE É O STARTIA?',
      texto: `🤖 *StartIA - Assistente de Obras via WhatsApp*

O StartIA é um assistente virtual para gestão de obras de construção civil que funciona diretamente via WhatsApp.

📱 *Acesso simplificado:*
Não é necessário instalar aplicativos adicionais. Toda a interação acontece pelo WhatsApp que você já usa.

🏗️ *Gestão completa:*
Gerencie suas obras, equipes, tarefas e presenças em um só lugar, de forma simples e direta.

👥 *Para todos os perfis:*
- Encarregados podem supervisionar a obra completa
- Colaboradores acompanham suas tarefas e registram presença
- Administradores têm visão geral de todas as obras

Selecione uma opção abaixo para saber mais sobre recursos específicos:`,
      botoes: botoesNavegacao,
      textoPlano: `🤖 *StartIA - Assistente de Obras via WhatsApp*

O StartIA é um assistente virtual para gestão de obras de construção civil que funciona diretamente via WhatsApp.

📱 *Acesso simplificado:*
Não é necessário instalar aplicativos adicionais. Toda a interação acontece pelo WhatsApp que você já usa.

🏗️ *Gestão completa:*
Gerencie suas obras, equipes, tarefas e presenças em um só lugar, de forma simples e direta.

👥 *Para todos os perfis:*
- Encarregados podem supervisionar a obra completa
- Colaboradores acompanham suas tarefas e registram presença
- Administradores têm visão geral de todas as obras

Digite "recursos" para ver todos os recursos disponíveis.
Digite "menu" para voltar ao menu principal.`
    },
    etapaNova: 'guia_startia'
  };
};