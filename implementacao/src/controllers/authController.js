const jwt = require('jsonwebtoken');
const { Funcionario } = require('../models');

// Controlador para autenticação de usuários
const authController = {
  // Login de funcionário
  login: async (req, res) => {
    try {
      const { email, senha } = req.body;

      // Validar dados de entrada
      if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios' });
      }

      // Buscar funcionário pelo email
      const funcionario = await Funcionario.findOne({ where: { email } });
      if (!funcionario) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas' });
      }

      // Verificar senha
      const senhaCorreta = await funcionario.verificarSenha(senha);
      if (!senhaCorreta) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          nivel_acesso: funcionario.nivel_acesso
        },
        process.env.JWT_SECRET || 'segredo',
        { expiresIn: '24h' }
      );

      // Retornar dados do funcionário e token
      return res.status(200).json({
        funcionario: {
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          cargo: funcionario.cargo,
          departamento_id: funcionario.departamento_id,
          nivel_acesso: funcionario.nivel_acesso,
          foto: funcionario.foto
        },
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  // Verificar token e retornar dados do funcionário
  verificarToken: async (req, res) => {
    try {
      // O middleware de autenticação já verificou o token e adicionou o funcionário à requisição
      const funcionario = req.funcionario;

      return res.status(200).json({
        funcionario: {
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          cargo: funcionario.cargo,
          departamento_id: funcionario.departamento_id,
          nivel_acesso: funcionario.nivel_acesso,
          foto: funcionario.foto
        }
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = authController;
