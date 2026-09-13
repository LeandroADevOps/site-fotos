const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs'); // <--- Importante: Módulo de arquivos do Node

const app = express();

// 0. Garante que a pasta 'uploads' exista no servidor na nuvem
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. Conexão Inteligente com o PostgreSQL:
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

// Cria a tabela 'fotos' automaticamente se ela não existir
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
app.use('/uploads', express.static(uploadsDir));

// 3. Onde as fotos serão salvas
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
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
    console.error('Erro no upload:', err);
    res.status(500).send('Erro ao salvar no banco de dados.');
  }
});

// 5. Rota para listar todas as fotos salvas no banco
app.get('/fotos', async (req, res) => {
  try {
    // Busca todas as fotos ordenadas pela data de criação mais recente
    const resultado = await pool.query('SELECT * FROM fotos ORDER BY id DESC');
    
    // Retorna a lista de fotos em formato JSON
    res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar fotos:', err);
    res.status(500).send('Erro ao buscar fotos no banco de dados.');
  }
});

// 6. Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});






