const jwt = require('jsonwebtoken');
const { Funcionario } = require('../models');

// Middleware para autenticação via JWT
const autenticar = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ mensagem: 'Token não fornecido' });
    }

    // Extrair o token do header (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensagem: 'Formato de token inválido' });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo');
    
    // Buscar o funcionário no banco de dados
    const funcionario = await Funcionario.findByPk(decoded.id);
    if (!funcionario) {
      return res.status(401).json({ mensagem: 'Funcionário não encontrado' });
    }

    // Adicionar o funcionário ao objeto de requisição
    req.funcionario = funcionario;
    
    // Prosseguir para o próximo middleware ou controlador
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ mensagem: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensagem: 'Token expirado' });
    }
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Middleware para verificar permissões de acesso
const verificarPermissao = (niveisPermitidos) => {
  return (req, res, next) => {
    // Verificar se o funcionário existe na requisição (autenticado)
    if (!req.funcionario) {
      return res.status(401).json({ mensagem: 'Não autenticado' });
    }

    // Verificar se o nível de acesso do funcionário está na lista de níveis permitidos
    if (!niveisPermitidos.includes(req.funcionario.nivel_acesso)) {
      return res.status(403).json({ mensagem: 'Acesso não autorizado' });
    }

    // Prosseguir para o próximo middleware ou controlador
    next();
  };
};

module.exports = {
  autenticar,
  verificarPermissao
};
