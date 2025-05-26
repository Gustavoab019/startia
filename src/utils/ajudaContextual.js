// src/utils/ajudaContextual.js - VERSÃO MELHORADA

/**
 * Gera mensagem de ajuda baseada no estado atual
 * @param {String} estado - Estado atual do colaborador
 * @returns {String} Mensagem de ajuda formatada
 */
function gerarAjudaContextual(estado) {
  // Ajuda genérica disponível em todos os estados
  let ajudaGenerica = [
    '🔄 *menu* - Voltar ao menu principal',
    '❓ *ajuda* - Mostrar esta ajuda',
    '📊 *status* - Ver seu status atual',
    '❌ *cancelar* - Cancelar operação atual',
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
        '❗ *problema* - Relatar problema',
        '📊 *resumo* - Ver resumo da obra'
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
        '📊 *resumo* - Ver resumo da obra',
        '📝 *minhas tarefas* - Ver suas tarefas pessoais'
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
        '*Comandos rápidos:*',
        '⏱️ *entrada* ou *entrar* - Registrar entrada',
        '⏱️ *saída* ou *sair* - Registrar saída',
        '',
        'Para voltar ao menu principal, digite *menu* ou *0*'
      ].join('\n');
      break;
      
    case 'ver_tarefas':
      ajudaEspecifica = [
        '*🔍 Ajuda: Visualização de Tarefas*',
        '',
        'Você está visualizando tarefas. Aqui você pode:',
        '• Ver todas as tarefas disponíveis no POOL',
        '• Digite o número de uma tarefa para "pegá-la"',
        '• Ver suas tarefas pessoais com *minhas*',
        '• Criar nova tarefa com *5*',
        '',
        '*Comandos especiais:*',
        '📝 *minhas* - Ver apenas suas tarefas',
        '🔢 *1, 2, 3...* - Pegar uma tarefa do POOL',
        '5️⃣ *5* - Criar nova tarefa',
        '',
        'Para voltar ao menu principal, digite *menu* ou *0*'
      ].join('\n');
      break;
      
    // ✅ NOVOS ESTADOS DE CRIAÇÃO DE TAREFA
    case 'criando_tarefa_titulo':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Tarefa - Título*',
        '',
        'Você está criando uma nova tarefa (etapa 1/5).',
        '',
        '*O que fazer:*',
        '• Digite um título descritivo para a tarefa',
        '• Mínimo de 3 caracteres',
        '• Seja específico sobre o trabalho',
        '',
        '*Exemplos bons:*',
        '• "Instalar cortinados"',
        '• "Colocar calhas do 2º andar"',
        '• "Pintura das paredes"',
        '• "Acabamento dos quartos"',
        '',
        '*Evite títulos vagos como:*',
        '• "Trabalho"',
        '• "Fazer isso"',
        '• "Concluir"'
      ].join('\n');
      break;

    case 'criando_tarefa_unidades':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Tarefa - Unidades*',
        '',
        'Você está definindo onde a tarefa será executada (etapa 2/5).',
        '',
        '*Formatos aceitos:*',
        '• *Um quarto:* "101"',
        '• *Lista:* "101,102,103"',
        '• *Sequência:* "101-105" (do 101 ao 105)',
        '• *Andar completo:* "andar 1"',
        '',
        '*Dicas importantes:*',
        '• Será criada uma tarefa para cada unidade',
        '• Máximo recomendado: 20 unidades por vez',
        '• Use sequências para economizar tempo',
        '',
        '*Exemplos práticos:*',
        '• "andar 2" = todos os quartos do 2º andar',
        '• "201-210" = 10 quartos consecutivos',
        '• "101,105,110" = 3 quartos específicos'
      ].join('\n');
      break;

    case 'criando_tarefa_fase':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Tarefa - Tipo de Trabalho*',
        '',
        'Você está definindo o tipo de trabalho (etapa 3/5).',
        '',
        '*Opções pré-definidas:*',
        '1️⃣ *Calhas* - Instalação/manutenção de calhas',
        '2️⃣ *Cortinados* - Instalação/ajuste de cortinas',
        '3️⃣ *Acabamento* - Retoques e finalizações',
        '4️⃣ *Personalizado* - Digite o nome do trabalho',
        '',
        '*Para trabalhos personalizados:*',
        '• Digite diretamente: "pintura", "elétrica", "hidráulica"',
        '• Seja específico sobre o tipo de serviço',
        '• Mínimo de 2 caracteres',
        '',
        '*Exemplos personalizados:*',
        '• "pintura"',
        '• "elétrica"',
        '• "limpeza"',
        '• "gesso"'
      ].join('\n');
      break;

    case 'criando_tarefa_prazo':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Tarefa - Prazo*',
        '',
        'Você está definindo quando a tarefa deve ser concluída (etapa 4/5).',
        '',
        '*Formatos aceitos:*',
        '⏰ *Atalhos rápidos:*',
        '• "hoje" - até o fim do dia',
        '• "amanha" - até amanhã',
        '• "sem prazo" - sem data limite',
        '',
        '📅 *Data específica:*',
        '• "25/01/2025" (formato DD/MM/AAAA)',
        '• "15/02/2025"',
        '',
        '*Dicas importantes:*',
        '• O prazo se aplica a TODAS as unidades',
        '• Considere o tempo necessário por unidade',
        '• Prazos realistas motivam mais a equipe',
        '',
        '*Recomendação:*',
        'Para várias unidades, considere prazos de alguns dias.'
      ].join('\n');
      break;

    case 'criando_tarefa_confirmacao':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Tarefa - Confirmação*',
        '',
        'Você está revisando as tarefas antes da criação (etapa 5/5).',
        '',
        '*Opções disponíveis:*',
        '✅ *1* ou *sim* - Criar todas as tarefas',
        '✏️ *2* ou *editar* - Voltar para editar o prazo',
        '❌ *0* ou *cancelar* - Cancelar toda a operação',
        '',
        '*O que acontece ao confirmar:*',
        '• Uma tarefa será criada para cada unidade',
        '• Todas as tarefas ficam no POOL (disponíveis para qualquer colaborador)',
        '• A equipe poderá "pegar" as tarefas digitando "3"',
        '',
        '*Revise cuidadosamente:*',
        '• Título está correto?',
        '• Unidades estão certas?',
        '• Tipo de trabalho está adequado?',
        '• Prazo é realista?'
      ].join('\n');
      break;
      
    case 'relatando_problema_descricao':
      ajudaEspecifica = [
        '*🔍 Ajuda: Relato de Problema - Descrição*',
        '',
        'Você está relatando um problema na obra (etapa 1/2).',
        '',
        '*O que incluir na descrição:*',
        '📍 *Localização:* Onde está acontecendo?',
        '❗ *O que está errado:* Descreva o problema',
        '⚠️ *Urgência:* É urgente? Pode esperar?',
        '🛠️ *Impacto:* Está atrapalhando o trabalho?',
        '',
        '*Exemplo de boa descrição:*',
        '"Vazamento no banheiro do quarto 205. Água saindo do chuveiro mesmo fechado. Está molhando o piso e pode escorregar. Urgente - está atrapalhando a instalação dos cortinados."',
        '',
        '*Seja específico e claro:*',
        '• Use detalhes que ajudem a localizar',
        '• Explique como descobriu o problema',
        '• Mencione se já tentou resolver'
      ].join('\n');
      break;

    case 'relatando_problema_foto':
      ajudaEspecifica = [
        '*🔍 Ajuda: Relato de Problema - Foto*',
        '',
        'Você está anexando uma foto do problema (etapa 2/2).',
        '',
        '*Como proceder:*',
        '📸 *Enviar foto:* Tire uma foto e envie',
        '⏭️ *Pular foto:* Digite "pular" para continuar sem foto',
        '',
        '*Dicas para boas fotos:*',
        '• Mostre claramente o problema',
        '• Inclua referências (número do quarto, etc.)',
        '• Use boa iluminação',
        '• Foque no detalhe problemático',
        '',
        '*Quando a foto ajuda mais:*',
        '• Problemas visuais (rachaduras, vazamentos)',
        '• Defeitos em acabamentos',
        '• Instalações incorretas',
        '• Danos em materiais',
        '',
        '*Lembre-se:*',
        'A foto facilita o entendimento e acelera a solução!'
      ].join('\n');
      break;
      
    case 'vendo_problemas':
      ajudaEspecifica = [
        '*🔍 Ajuda: Visualização de Problemas*',
        '',
        'Você está vendo os problemas reportados na obra.',
        '',
        '*Status dos problemas:*',
        '🔴 *Aberto* - Problema reportado, aguardando ação',
        '🟡 *Em análise* - Sendo investigado/resolvido',
        '🟢 *Resolvido* - Problema solucionado',
        '',
        '*Como navegar:*',
        '🔢 *1, 2, 3...* - Ver detalhes de um problema específico',
        '📋 *listar* - Ver lista completa novamente',
        '*menu* - Voltar ao menu principal',
        '',
        '*Informações mostradas:*',
        '• Data e hora do relato',
        '• Quem reportou o problema',
        '• Descrição detalhada',
        '• Foto (se disponível)',
        '• Status atual'
      ].join('\n');
      break;
      
    case 'cadastrando_colab_nome':
      ajudaEspecifica = [
        '*🔍 Ajuda: Cadastro de Colaborador - Nome*',
        '',
        'Você está cadastrando um novo membro da equipe (etapa 1/4).',
        '',
        '*O que fazer:*',
        '• Digite o nome completo da pessoa',
        '• Mínimo de 2 caracteres',
        '• Use o nome real (será usado nas tarefas)',
        '',
        '*Exemplos corretos:*',
        '• "João Silva"',
        '• "Maria Santos"',
        '• "António"',
        '',
        '*Evite:*',
        '• Apelidos apenas',
        '• Abreviações',
        '• Nomes muito curtos',
        '',
        '*Importante:*',
        'Este nome aparecerá nas tarefas e relatórios, então seja preciso!'
      ].join('\n');
      break;

    case 'cadastrando_colab_telefone':
      ajudaEspecifica = [
        '*🔍 Ajuda: Cadastro de Colaborador - Telefone*',
        '',
        'Você está informando o telefone do colaborador (etapa 2/4).',
        '',
        '*Formato obrigatório:*',
        '📱 *Portugal:* 351XXXXXXXXX',
        '• Deve começar com 351 (código do país)',
        '• Seguido de 9 dígitos',
        '• Total: 12 dígitos',
        '',
        '*Exemplos corretos:*',
        '• 351912345678',
        '• 351967123456',
        '• 351925987654',
        '',
        '*Importante:*',
        '• Este será o número de acesso ao WhatsApp',
        '• Certifique-se de que está correto',
        '• O colaborador receberá mensagens neste número',
        '',
        '*Verifique se:*',
        '• O número tem 12 dígitos',
        '• Começa com 351',
        '• Não tem espaços ou caracteres especiais'
      ].join('\n');
      break;

    case 'cadastrando_colab_tipo':
      ajudaEspecifica = [
        '*🔍 Ajuda: Cadastro de Colaborador - Tipo*',
        '',
        'Você está definindo o tipo de colaborador (etapa 3/4).',
        '',
        '*Opções disponíveis:*',
        '1️⃣ *Colaborador* - Membro regular da equipe',
        '2️⃣ *Encarregado* - Responsável/supervisor',
        '',
        '*Diferenças importantes:*',
        '',
        '*👷 Colaborador:*',
        '• Pode pegar e executar tarefas',
        '• Registra própria presença',
        '• Reporta problemas',
        '• Vê tarefas da obra',
        '',
        '*👨‍💼 Encarregado:*',
        '• Todas as funções do colaborador +',
        '• Pode criar tarefas para outros',
        '• Pode cadastrar novos colaboradores',
        '• Acesso a relatórios de presença',
        '• Pode gerenciar problemas reportados',
        '',
        '*Escolha com cuidado:*',
        'Encarregados têm mais responsabilidades e acesso.'
      ].join('\n');
      break;

    case 'cadastrando_colab_funcao':
      ajudaEspecifica = [
        '*🔍 Ajuda: Cadastro de Colaborador - Função*',
        '',
        'Você está definindo a função/especialidade (etapa 4/4).',
        '',
        '*Exemplos de funções comuns:*',
        '🔧 *Instalação:*',
        '• Montador',
        '• Instalador',
        '• Técnico',
        '',
        '🎨 *Acabamento:*',
        '• Pintor',
        '• Gesseiro',
        '• Acabador',
        '',
        '⚡ *Especializadas:*',
        '• Eletricista',
        '• Encanador',
        '• Soldador',
        '',
        '👷 *Gerais:*',
        '• Ajudante',
        '• Servente',
        '• Faxineiro',
        '',
        '*Dicas:*',
        '• Seja específico sobre a especialidade',
        '• Use termos conhecidos na construção',
        '• A função ajuda na atribuição de tarefas adequadas'
      ].join('\n');
      break;
      
    case 'criando_obra_nome':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Obra - Nome*',
        '',
        'Você está criando uma nova obra (etapa 1/3).',
        '',
        '*O que fazer:*',
        '• Digite um nome identificativo para a obra',
        '• Mínimo de 3 caracteres',
        '• Seja específico e claro',
        '',
        '*Exemplos bons:*',
        '• "Residencial Vila Nova"',
        '• "Reforma Apartamento 302"',
        '• "Edifício Comercial Centro"',
        '• "Casa João Silva"',
        '',
        '*Evite nomes vagos como:*',
        '• "Obra"',
        '• "Projeto"',
        '• "Casa"',
        '',
        '*Dica importante:*',
        'Este nome aparecerá em todos os relatórios e será visto pela equipe!'
      ].join('\n');
      break;

    case 'criando_obra_endereco':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Obra - Endereço*',
        '',
        'Você está informando o endereço da obra (etapa 2/3).',
        '',
        '*O que incluir:*',
        '• Rua/Avenida e número',
        '• Bairro ou zona',
        '• Cidade',
        '• Referências úteis (opcional)',
        '',
        '*Exemplos completos:*',
        '• "Rua das Flores, 123 - Vila Nova - Lisboa"',
        '• "Avenida Central, 456 - Próximo ao Shopping"',
        '• "Travessa do Porto, 78 - Cedofeita - Porto"',
        '',
        '*Dicas importantes:*',
        '• Seja preciso para facilitar localização',
        '• Inclua pontos de referência conhecidos',
        '• Mínimo de 5 caracteres',
        '',
        '*Para que serve:*',
        'A equipe usa o endereço para se localizar e o sistema para relatórios.'
      ].join('\n');
      break;

    case 'criando_obra_almoco_inicio':
    case 'criando_obra_almoco_hora_inicio':
    case 'criando_obra_almoco_hora_fim':
      ajudaEspecifica = [
        '*🔍 Ajuda: Criação de Obra - Horário de Almoço*',
        '',
        'Você está configurando o horário de almoço da obra (etapa 3/3).',
        '',
        '*Por que é importante:*',
        '• O sistema calcula automaticamente as horas trabalhadas',
        '• Desconta o tempo de almoço do total',
        '• Gera relatórios de presença precisos',
        '',
        '*Opções disponíveis:*',
        '1️⃣ *Usar padrão* - 12:00 às 13:00 (recomendado)',
        '2️⃣ *Personalizar* - Definir horários específicos',
        '',
        '*Para horários personalizados:*',
        '• Use formato HH:MM (ex: 11:30)',
        '• Máximo de 4 horas de almoço',
        '• Fim deve ser depois do início',
        '',
        '*Exemplos válidos:*',
        '• Início: 12:00, Fim: 13:00',
        '• Início: 11:30, Fim: 12:30',
        '• Início: 13:00, Fim: 14:00',
        '',
        '*Lembre-se:*',
        'Este horário afeta o cálculo de horas de TODA a equipe!'
      ].join('\n');
      break;
      
    case 'entrando_obra_codigo':
      ajudaEspecifica = [
        '*🔍 Ajuda: Acesso à Obra*',
        '',
        'Você está tentando entrar em uma obra existente.',
        '',
        '*O que fazer:*',
        '• Digite o código de 6 caracteres',
        '• O código foi fornecido pelo criador da obra',
        '• Não diferencia maiúsculas de minúsculas',
        '',
        '*Formato do código:*',
        '• 6 caracteres (letras e números)',
        '• Exemplo: ABC123, XYZ789, DEF456',
        '',
        '*Onde obter o código:*',
        '• Pergunte ao responsável/encarregado da obra',
        '• Pode estar em grupos do WhatsApp da equipe',
        '• Normalmente compartilhado quando a obra é criada',
        '',
        '*Se o código não funcionar:*',
        '• Verifique se digitou corretamente',
        '• Confirme com quem te passou',
        '• O código pode ter sido alterado',
        '',
        '*Após entrar:*',
        'Você terá acesso a tarefas, presença e outras funcionalidades da obra.'
      ].join('\n');
      break;
      
    case 'ver_colaboradores':
      ajudaEspecifica = [
        '*🔍 Ajuda: Visualização da Equipe*',
        '',
        'Você está vendo a equipe da obra atual.',
        '',
        '*Informações mostradas:*',
        '👤 *Nome* - Nome completo do colaborador',
        '💼 *Função* - Especialidade/cargo',
        '🏷️ *Tipo* - Colaborador ou Encarregado',
        '📱 *Telefone* - Contato (se disponível)',
        '',
        '*Tipos de colaboradores:*',
        '👷 *Colaborador* - Executa tarefas',
        '👨‍💼 *Encarregado* - Supervisiona e gerencia',
        '',
        '*Para gerenciar a equipe:*',
        '• Digite "6" para adicionar novo colaborador',
        '• Digite "5" para criar tarefas para a equipe',
        '• Use "4" para ver relatórios de presença (encarregados)',
        '',
        '*Comandos úteis:*',
        '📋 *tarefas* - Ver distribuição de tarefas',
        '⏱️ *presença* - Ver quem está presente',
        '*menu* - Voltar ao menu principal'
      ].join('\n');
      break;
      
    case 'guia_startia':
      ajudaEspecifica = [
        '*🔍 Ajuda: Guia do StartIA*',
        '',
        'Você está explorando as funcionalidades do StartIA.',
        '',
        '*Navegação no guia:*',
        '🛠️ *recursos* - Ver todos os recursos disponíveis',
        '📋 *tarefas* - Como funciona o sistema de tarefas',
        '⏱️ *presença* - Como registrar presença',
        '*menu* - Voltar ao menu principal',
        '',
        '*Seções disponíveis:*',
        '• Visão geral do sistema',
        '• Como usar cada funcionalidade',
        '• Dicas para melhor produtividade',
        '• Perguntas frequentes',
        '',
        '*Para novos usuários:*',
        'Recomendamos ler sobre "recursos" primeiro para entender todas as funcionalidades.',
        '',
        '*Lembre-se:*',
        'O StartIA funciona 100% via WhatsApp - sem necessidade de instalar aplicativos!'
      ].join('\n');
      break;

    case 'coletando_nome':
      ajudaEspecifica = [
        '*🔍 Ajuda: Configuração Inicial*',
        '',
        'Bem-vindo ao StartIA! Precisamos configurar seu perfil.',
        '',
        '*O que fazer agora:*',
        '• Digite seu nome completo',
        '• Mínimo de 2 caracteres',
        '• Use seu nome real de trabalho',
        '',
        '*Por que precisamos do seu nome:*',
        '• Personalizar as mensagens',
        '• Identificar você nas tarefas',
        '• Melhorar a comunicação da equipe',
        '• Gerar relatórios precisos',
        '',
        '*Exemplos:*',
        '• "João Silva"',
        '• "Maria"',
        '• "António Santos"',
        '',
        '*Não se preocupe:*',
        'Você pode alterar seu nome depois usando "meu nome é [novo nome]"',
        '',
        '*Próximos passos:*',
        'Após definir o nome, você terá acesso completo ao sistema!'
      ].join('\n');
      break;

    case 'ver_tarefa_detalhe':
      ajudaEspecifica = [
        '*🔍 Ajuda: Detalhes da Tarefa*',
        '',
        'Você está vendo os detalhes de uma tarefa específica.',
        '',
        '*Informações mostradas:*',
        '📝 *Título e descrição* da tarefa',
        '🏠 *Localização* (unidade/quarto)',
        '📅 *Prazo* (se definido)',
        '🔄 *Status atual* (pendente/andamento/concluída)',
        '👤 *Responsável* (se já atribuída)',
        '',
        '*Ações disponíveis:*',
        '1️⃣ *Marcar como Pendente*',
        '2️⃣ *Marcar como Em Andamento*',
        '3️⃣ *Marcar como Concluída*',
        '',
        '*Status explicados:*',
        '🟡 *Pendente* - Não iniciada ainda',
        '🟠 *Em Andamento* - Sendo executada',
        '✅ *Concluída* - Finalizada',
        '',
        '*Comandos úteis:*',
        '*voltar* - Retornar à lista de tarefas',
        '*lista* - Ver todas as tarefas',
        '*menu* - Voltar ao menu principal'
      ].join('\n');
      break;
      
    default:
      ajudaEspecifica = [
        '*🔍 Ajuda: Navegação Geral*',
        '',
        'Você pode usar os seguintes comandos:',
        '• Digite o número correspondente à opção desejada',
        '• Use palavras-chave para ações rápidas',
        '• Siga as instruções em cada tela',
        '',
        '*Comandos universais:*',
        '📱 *menu* - Ir ao menu principal',
        '❓ *ajuda* - Ver ajuda contextual',
        '📊 *status* - Ver sua situação atual',
        '❌ *cancelar* - Cancelar operação',
        '',
        '*Dicas de navegação:*',
        '• Leia as opções disponíveis',
        '• Use números para escolhas rápidas',
        '• Digite palavras-chave quando souber',
        '• Sempre pode voltar ao menu com "menu"',
        '',
        '*Em caso de dúvida:*',
        'Digite "status" para saber onde está ou "menu" para recomeçar.'
      ].join('\n');
      break;
  }
  
  return `${ajudaEspecifica}\n\n*━━━━━━━━━━━━━━━━━━━━━━━━━━━*\n\n*Comandos sempre disponíveis:*\n${ajudaGenerica}\n\n💡 *Dica:* O StartIA aprende com seu uso. Quanto mais você usar, mais eficiente fica!`;
}

module.exports = { gerarAjudaContextual };