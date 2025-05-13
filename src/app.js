require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());

connectDB();

const obraRoutes = require('./domains/obra/obra.routes');
app.use('/api/obra', obraRoutes);

const colaboradorRoutes = require('./domains/colaborador/colaborador.routes');
app.use('/api/colaborador', colaboradorRoutes);

const mensagemRoutes = require('./routes/mensagem.routes');
app.use('/api', mensagemRoutes);

const tarefaRoutes = require('./domains/tarefa/tarefa.controller');
app.use('/api/tarefas', tarefaRoutes);

const presencaRoutes = require('./domains/presenca/presenca.controller');
app.use('/api/presencas', presencaRoutes);

const webhookRoutes = require('./routes/webhook.routes'); // ✅ nova rota
app.use('/api', webhookRoutes);

app.get('/', (req, res) => {
  res.send('🚧 StartIA está rodando com sucesso!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
