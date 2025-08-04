const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const Loja = require('./models/lojas'); // ajuste o caminho se necessário

const app = express();
const PORT = 3000;

/* Config admin */
const ADMIN_USER = 'giovanni';
const ADMIN_PASS_HASH = '$2b$10$P3JtDInLcBfLOslDbbXx7eRymjIChKS6Kf5LpDTJ56qcVONOj0t2W'; // senha: 777666

/* Conexão MongoDB */
mongoose.connect(
  'mongodb+srv://nekallesantos:VgaY1F11wpnaCB38@cluster0.g6xbh3r.mongodb.net/conhece-itatiba?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('✅ Banco de Dados conectado'))
.catch(err => console.error('❌ Erro MongoDB:', err));

/* Middlewares */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'seu-segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));

/* Multer upload */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* Autenticação admin */
function checkAdminAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.redirect('/login');
}

/* Rotas públicas */
app.get('/', async (req, res) => {
  try {
    const lojas = await Loja.find({ status: 'aprovado' });
    res.render('index', { lojas });
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao carregar lojas');
  }
});

app.get('/cadastre', (_, res) => res.render('cadastre'));
app.get('/cadastro', (_, res) => res.render('cadastro'));

/* Cadastro loja */
app.post('/cadastro', upload.single('logo'), async (req, res) => {
  const { nome, cnpj, endereco, descricao, telefone, instagram } = req.body;
  const logo = req.file?.filename;

  if (!nome || !cnpj || !endereco || !logo) {
    return res.send('Preencha todos os campos obrigatórios (nome, CNPJ/CPF, endereço e logo).');
  }

  try {
    const novaLoja = await Loja.create({
      nome, cnpj, endereco, descricao, telefone, instagram,
      logo, status: 'pendente',
      destaque: false
    });
    res.redirect(`/loja-cadastrada?id=${novaLoja._id}`);
  } catch (e) {
    console.error('Erro ao salvar loja:', e);
    res.status(500).send('Erro ao cadastrar loja.');
  }
});

/* Tela confirmação cadastro */
app.get('/loja-cadastrada', (req, res) => {
  const lojaId = req.query.id;
  res.render('loja-cadastrada', { lojaId });
});

/* Rota para consultar status por CPF/CNPJ (form + resultado) */
app.get('/status', (req, res) => {
  res.render('status', { error: null, loja: null });
});

app.post('/status', async (req, res) => {
  const documento = req.body.documento?.trim();

  if (!documento) {
    return res.render('status', { error: 'Informe o CPF ou CNPJ.', loja: null });
  }

  try {
    const loja = await Loja.findOne({ cnpj: documento });

    if (!loja) {
      return res.render('status', { error: 'Nenhuma loja encontrada para o documento informado.', loja: null });
    }

    res.render('status', { error: null, loja });
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao consultar status da loja.');
  }
});

/* Login admin */
app.get('/login', (_, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.render('login', { error: 'Por favor, preencha usuário e senha.' });
  }

  const isValidUser = user === ADMIN_USER;
  const isValidPass = await bcrypt.compare(pass, ADMIN_PASS_HASH);

  if (isValidUser && isValidPass) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  } else {
    return res.render('login', { error: 'Usuário ou senha inválidos' });
  }
});

/* Logout */
app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

/* Painel admin */
app.get('/admin', checkAdminAuth, async (req, res) => {
  try {
    const lojas = await Loja.find();
    res.render('admin', { lojas });
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao carregar painel');
  }
});

/* Aprovar loja */
app.post('/admin/aprovar/:id', checkAdminAuth, async (req, res) => {
  try {
    await Loja.findByIdAndUpdate(req.params.id, { status: 'aprovado' });
    res.redirect('/admin');
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao aprovar loja');
  }
});

/* Destacar loja (toggle) */
app.post('/admin/destaque/:id', checkAdminAuth, async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id);
    if (!loja) return res.status(404).send('Loja não encontrada');
    await Loja.findByIdAndUpdate(req.params.id, { destaque: !loja.destaque });
    res.redirect('/admin');
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao alterar destaque');
  }
});

/* Editar loja (GET) */
app.get('/admin/editar/:id', checkAdminAuth, async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id);
    if (!loja) return res.status(404).send('Loja não encontrada');
    res.render('editar', { loja });
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao carregar edição');
  }
});

/* Editar loja (POST) */
app.post('/admin/editar/:id', checkAdminAuth, upload.single('logo'), async (req, res) => {
  const { nome, cnpj, endereco, descricao, telefone, instagram, status } = req.body;
  const updateData = { nome, cnpj, endereco, descricao, telefone, instagram, status };

  if (req.file) {
    updateData.logo = req.file.filename;
  }

  try {
    await Loja.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin');
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao atualizar loja');
  }
});

/* Deletar loja */
app.post('/admin/deletar/:id', checkAdminAuth, async (req, res) => {
  try {
    await Loja.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao deletar loja');
  }
});

/* Página da loja individual */
app.get('/loja/:id', async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id);
    if (!loja || loja.status !== 'aprovado') {
      return res.status(404).send('Loja não encontrada ou não aprovada');
    }
    res.render('loja', { loja });
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao carregar loja');
  }
});

// Página 404
app.use((req, res) => {
  res.status(404).render("erro", {
    status: 404,
    mensagem: "Página não encontrada."
  });
});

/* Start */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
