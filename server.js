
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// 1. Conexão com o PostgreSQL
const pool = new Pool({
  user: 'postgres',          
  host: 'localhost',
  database: 'grownectacesso',   
  password: '#21640Postgre', // <- COLOQUE SUA SENHA AQUI
  port: 5432,
});

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

// 5. Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando com sucesso! Acesse: http://localhost:3000');
});