

const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// 1. Conexão Inteligente com o PostgreSQL:
// Se existir DATABASE_URL (Render na nuvem), conecta na Render com SSL.
// Se NÃO existir (seu computador), conecta no seu banco local 'grownectacesso'.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'grownectacesso',
      password: '#21640Postgre',
      port: 5432,
    });

// Cria a tabela 'fotos' automaticamente com a coluna 'url' se ela ainda não existir
const criarTabela = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fotos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela fotos verificada/criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar/verificar tabela:', err);
  }
};

criarTabela();

// 2. Servir arquivos da pasta
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Onde as fotos serão salvas
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// 4. Rota para receber a foto
app.post('/upload', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nenhum arquivo enviado.');
    }

    const nomeOriginal = req.file.originalname;
    const caminhoFoto = `/uploads/${req.file.filename}`;

    await pool.query(
      'INSERT INTO fotos (nome, url) VALUES ($1, $2)',
      [nomeOriginal, caminhoFoto]
    );

    res.send(`Foto enviada com sucesso! Caminho: ${caminhoFoto}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar no banco de dados.');
  }
});

// 5. Iniciar o servidor (Porta dinâmica da Render ou 3000 local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});