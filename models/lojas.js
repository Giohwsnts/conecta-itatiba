// models/Loja.js
const mongoose = require('mongoose');

const lojaSchema = new mongoose.Schema({
 nome: String,
  cnpj: String,
  endereco: String,  // adicione aqui
  descricao: String,
  telefone: String,
  instagram: String,
  logo: String,
  status: {
    type: String,
    enum: ['pendente', 'aprovado'],
    default: 'pendente'
  },
  destaque: {
    type: Boolean,
    default: false
  },
  categoria: {
    type: String,
    required: true // ou false, se quiser opcional
  }
});

module.exports = mongoose.model('lojas', lojaSchema);
