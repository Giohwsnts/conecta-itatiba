const mongoose = require('mongoose');

const LojaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cnpj: { type: String, required: true },
  endereco: { type: String, required: true },
  descricao: { type: String },
  telefone: { type: String, required: true },
  instagram: { type: String },
  categoria: { 
    type: String, 
    required: true,
    enum: [
      "alimentos-bebidas",
      "vestuario-acessorios",
      "eletro-eletronicos",
      "casa-construcao",
      "veiculos-pecas",
      "pets",
      "papelaria-escritorio",
      "outros-comercio",
      "saude-bem-estar",
      "beleza",
      "servicos-automotivos",
      "construcao-civil",
      "eventos",
      "tecnicos-manutencao",
      "educacao-cursos",
      "transporte-logistica",
      "servicos-gerais",
      "juridico-contabil",
      "servicos-empresariais",
      "comunitarios-instituicoes"
    ]
  },
  logo: { type: String, required: true },
  status: { 
    type: String,
    enum: ["pendente", "aprovado", "reprovado"],
    default: "pendente"
  },
  destaque: { type: Boolean, default: false },
  latitude: { type: Number },
  longitude: { type: Number }
});

module.exports = mongoose.model('Loja', LojaSchema);
