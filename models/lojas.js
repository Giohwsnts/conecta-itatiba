const mongoose = require('mongoose');

const lojaSchema = new mongoose.Schema({
  nome: String,
  cnpj: String,
  endereco: String,  // adicione aqui
  descricao: String,
  telefone: String,
  instagram: String,
  logo: String,
  status: String,
  destaque: { type: Boolean, default: false }
});

module.exports = mongoose.model('lojas', lojaSchema);

