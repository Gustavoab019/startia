// src/utils/ajudaContextual.js

/**
 * Gera mensagem de ajuda baseada no estado atual
 * @param {String} estado - Estado atual do colaborador
 * @returns {String} Mensagem de ajuda formatada
 */
function gerarAjudaContextual(estado) {
    // Ajuda genérica disponível em todos os estados
    let ajudaGenerica = [
      '🔄 *menu* - Voltar ao menu principal',
      '❓ *ajuda* - Mostrar ajuda',
      '📊 *status* - Ver seu status atual',
      '0️⃣ *0* - Voltar ao menu anterior'
    ].join('\n');
    
    // Ajuda específica para cada estado
    let ajudaEspecifica = '';
    
    switch (estado) {
      case 'menu':
        ajudaEspecifica = [
          '*🔍 Ajuda: Menu Principal*',
          '',
          'Digite o número da opção desejada para navegar:',
          '1️⃣ - Criar nova obra',
          '2️⃣ - Entrar em uma obra existente',
          '3️⃣ - Ver suas tarefas',
          '4️⃣ - Registrar presença',
          '5️⃣ - Cadastrar tarefa',
          '6️⃣ - Cadastrar colaborador',
          '7️⃣ - Ver equipe da obra',
          '8️⃣ - Informações sobre o StartIA',
          '9️⃣ - Relatar problema',
          '🔟 - Ver problemas',
          '',
          '*Atalhos úteis:*',
          '📝 *tarefas* - Ver suas tarefas',
          '⏱️ *presença* - Registrar presença',
          '👥 *equipe* - Ver colaboradores',
          '❗ *problema* - Relatar problema'
        ].join('\n');
        break;
        
      case 'em_obra':
        ajudaEspecifica = [
          '*🔍 Ajuda: Dentro da Obra*',
          '',
          'Você está em uma obra. Neste estado, você pode:',
          '• Ver suas tarefas (opção 3)',
          '• Registrar presença (opção 4)',
          '• Cadastrar tarefas (opção 5)',
          '• Visualizar equipe (opção 7)',
          '• Relatar problemas (opção 9)',
          '',
          '*Comandos rápidos:*',
          '⏱️ *entrada* - Registra sua entrada',
          '⏱️ *saída* - Registra sua saída',
          '📊 *resumo* - Ver resumo da obra'
        ].join('\n');
        break;
        
      case 'registrando_presenca':
        ajudaEspecifica = [
          '*🔍 Ajuda: Registro de Presença*',
          '',
          'Você está no registro de presença. Neste estado, você pode:',
          '1️⃣ - Registrar entrada',
          '2️⃣ - Registrar saída',
          '*status* - Verificar sua situação atual',
          '',
          'Para voltar ao menu principal, digite *menu* ou *0*'
        ].join('\n');
        break;
        
      case 'ver_tarefas':
        ajudaEspecifica = [
          '*🔍 Ajuda: Visualização de Tarefas*',
          '',
          'Você está visualizando suas tarefas. Aqui você pode:',
          '• Ver todas as suas tarefas pendentes e concluídas',
          '• Digite o número de uma tarefa para ver detalhes',
          '• Digite *5* para cadastrar uma nova tarefa',
          '',
          'Para voltar ao menu principal, digite *menu* ou *0*'
        ].join('\n');
        break;
        
      case 'criando_tarefa_titulo':
      case 'criando_tarefa_descricao':
      case 'criando_tarefa_prazo':
      case 'criando_tarefa_atribuicao':
        ajudaEspecifica = [
          '*🔍 Ajuda: Criação de Tarefa*',
          '',
          'Você está no processo de criar uma nova tarefa:',
          'Etapa 1: Informar o título da tarefa',
          'Etapa 2: Informar a descrição (ou "pular")',
          'Etapa 3: Definir o prazo (formato DD/MM/AAAA ou "sem prazo")',
          'Etapa 4: Selecionar o colaborador responsável',
          '',
          'Para cancelar a criação, digite *cancelar* ou *menu*'
        ].join('\n');
        break;
        
      case 'relatando_problema_descricao':
      case 'relatando_problema_foto':
        ajudaEspecifica = [
          '*🔍 Ajuda: Relato de Problema*',
          '',
          'Você está relatando um problema na obra:',
          'Etapa 1: Descrever o problema encontrado',
          'Etapa 2: Enviar uma foto (opcional, digite "pular" para continuar sem foto)',
          '',
          'O responsável pela obra será notificado sobre o problema relatado.',
          'Para cancelar o relato, digite *cancelar* ou *menu*'
        ].join('\n');
        break;
        
      case 'vendo_problemas':
        ajudaEspecifica = [
          '*🔍 Ajuda: Visualização de Problemas*',
          '',
          'Você está visualizando os problemas da obra:',
          '• 🔴 Problemas abertos',
          '• 🟡 Problemas em análise',
          '• 🟢 Problemas resolvidos',
          '',
          'Digite o número de um problema para ver seus detalhes',
          'Para voltar ao menu principal, digite *menu* ou *0*'
        ].join('\n');
        break;
        
      case 'cadastrando_colab_nome':
      case 'cadastrando_colab_telefone':
      case 'cadastrando_colab_tipo':
      case 'cadastrando_colab_funcao':
        ajudaEspecifica = [
          '*🔍 Ajuda: Cadastro de Colaborador*',
          '',
          'Você está cadastrando um novo colaborador:',
          'Etapa 1: Informar o nome completo',
          'Etapa 2: Informar o telefone (formato: 351912345678)',
          'Etapa 3: Selecionar o tipo (Colaborador ou Encarregado)',
          'Etapa 4: Informar a função (ex: Montador, Ajudante, etc.)',
          '',
          'Para cancelar o cadastro, digite *cancelar* ou *menu*'
        ].join('\n');
        break;
        
      case 'ver_colaboradores':
        ajudaEspecifica = [
          '*🔍 Ajuda: Visualização de Equipe*',
          '',
          'Você está visualizando a equipe da obra:',
          '• Lista de todos os colaboradores cadastrados',
          '• Nome, função e tipo de cada colaborador',
          '',
          'Para voltar ao menu principal, digite *menu* ou *0*'
        ].join('\n');
        break;
        
      case 'criando_obra_nome':
      case 'criando_obra_endereco':
      case 'criando_obra_almoco_inicio':
      case 'criando_obra_almoco_hora_inicio':
      case 'criando_obra_almoco_hora_fim':
        ajudaEspecifica = [
          '*🔍 Ajuda: Criação de Obra*',
          '',
          'Você está criando uma nova obra:',
          'Etapa 1: Informar o nome da obra',
          'Etapa 2: Informar o endereço da obra',
          'Etapa 3: Configurar horário de almoço (padrão ou personalizado)',
          '',
          'Ao concluir, você receberá um código de acesso para compartilhar com os colaboradores.',
          'Para cancelar a criação, digite *cancelar* ou *menu*'
        ].join('\n');
        break;
        
      case 'entrando_obra_codigo':
        ajudaEspecifica = [
          '*🔍 Ajuda: Acesso à Obra*',
          '',
          'Você está informando o código de acesso para entrar em uma obra:',
          '• Digite o código de 6 caracteres fornecido pelo criador da obra',
          '• O código não diferencia maiúsculas de minúsculas',
          '• Exemplo de código válido: ABC123',
          '',
          'Para voltar ao menu principal, digite *menu* ou *0*'
        ].join('\n');
        break;
        
      default:
        ajudaEspecifica = [
          '*🔍 Ajuda: Navegação*',
          '',
          'Você pode usar os seguintes comandos:',
          '• Digite o número correspondente à opção desejada',
          '• Digite *menu* para voltar ao menu principal',
          '• Digite *ajuda* para ver as opções disponíveis',
          '• Digite *status* para verificar onde você está'
        ].join('\n');
        break;
    }
    
    return `${ajudaEspecifica}\n\n*Comandos gerais:*\n${ajudaGenerica}`;
  }
  
  module.exports = { gerarAjudaContextual };