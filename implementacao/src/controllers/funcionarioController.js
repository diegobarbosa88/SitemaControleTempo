const { Funcionario, Departamento } = require('../models');
const bcrypt = require('bcryptjs');

// Controlador para gestão de funcionários
const funcionarioController = {
  // Listar todos os funcionários
  listarFuncionarios: async (req, res) => {
    try {
      const { departamento_id, status, tag } = req.query;
      
      // Construir condições de busca
      const where = {};
      
      if (departamento_id) {
        where.departamento_id = departamento_id;
      }
      
      if (status) {
        where.status = status;
      }
      
      // Buscar funcionários com filtros
      const funcionarios = await Funcionario.findAll({
        where,
        include: [
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        attributes: { exclude: ['senha'] },
        order: [['nome', 'ASC']]
      });
      
      // Filtrar por tag se necessário (feito após a consulta pois requer join com tabela de tags)
      let resultado = funcionarios;
      if (tag) {
        // Implementação futura: filtrar por tag
      }
      
      return res.status(200).json({ funcionarios: resultado });
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Obter detalhes de um funcionário específico
  obterFuncionario: async (req, res) => {
    try {
      const { id } = req.params;
      
      const funcionario = await Funcionario.findByPk(id, {
        include: [
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        attributes: { exclude: ['senha'] }
      });
      
      if (!funcionario) {
        return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json({ funcionario });
    } catch (error) {
      console.error('Erro ao obter funcionário:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Criar novo funcionário
  criarFuncionario: async (req, res) => {
    try {
      const {
        nome,
        email,
        senha,
        telefone,
        cargo,
        departamento_id,
        data_contratacao,
        status,
        jornada_contratada,
        tipo_autenticacao,
        codigo_pin,
        nivel_acesso
      } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios' });
      }
      
      // Verificar se email já existe
      const emailExistente = await Funcionario.findOne({ where: { email } });
      if (emailExistente) {
        return res.status(400).json({ mensagem: 'Email já cadastrado' });
      }
      
      // Criar funcionário
      const funcionario = await Funcionario.create({
        nome,
        email,
        senha, // Será criptografada pelo hook beforeCreate
        telefone,
        cargo,
        departamento_id,
        data_contratacao,
        status: status || 'Ativo',
        jornada_contratada,
        tipo_autenticacao: tipo_autenticacao || 'Email',
        codigo_pin,
        nivel_acesso: nivel_acesso || 'Funcionário'
      });
      
      // Retornar funcionário criado (sem a senha)
      const { senha: _, ...funcionarioSemSenha } = funcionario.toJSON();
      
      return res.status(201).json({
        mensagem: 'Funcionário criado com sucesso',
        funcionario: funcionarioSemSenha
      });
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Atualizar funcionário existente
  atualizarFuncionario: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nome,
        email,
        senha,
        telefone,
        cargo,
        departamento_id,
        data_contratacao,
        status,
        jornada_contratada,
        tipo_autenticacao,
        codigo_pin,
        nivel_acesso,
        foto
      } = req.body;
      
      // Verificar se funcionário existe
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario) {
        return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
      }
      
      // Verificar se email já existe (se estiver sendo alterado)
      if (email && email !== funcionario.email) {
        const emailExistente = await Funcionario.findOne({ where: { email } });
        if (emailExistente) {
          return res.status(400).json({ mensagem: 'Email já cadastrado para outro funcionário' });
        }
      }
      
      // Atualizar funcionário
      await funcionario.update({
        nome: nome || funcionario.nome,
        email: email || funcionario.email,
        senha: senha || funcionario.senha,
        telefone: telefone !== undefined ? telefone : funcionario.telefone,
        cargo: cargo || funcionario.cargo,
        departamento_id: departamento_id || funcionario.departamento_id,
        data_contratacao: data_contratacao || funcionario.data_contratacao,
        status: status || funcionario.status,
        jornada_contratada: jornada_contratada || funcionario.jornada_contratada,
        tipo_autenticacao: tipo_autenticacao || funcionario.tipo_autenticacao,
        codigo_pin: codigo_pin || funcionario.codigo_pin,
        nivel_acesso: nivel_acesso || funcionario.nivel_acesso,
        foto: foto || funcionario.foto
      });
      
      // Buscar funcionário atualizado com relacionamentos
      const funcionarioAtualizado = await Funcionario.findByPk(id, {
        include: [
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        attributes: { exclude: ['senha'] }
      });
      
      return res.status(200).json({
        mensagem: 'Funcionário atualizado com sucesso',
        funcionario: funcionarioAtualizado
      });
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Excluir funcionário
  excluirFuncionario: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se funcionário existe
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario) {
        return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
      }
      
      // Verificar se o funcionário é responsável por algum departamento
      const departamentoResponsavel = await Departamento.findOne({
        where: { responsavel_id: id }
      });
      
      if (departamentoResponsavel) {
        return res.status(400).json({
          mensagem: 'Não é possível excluir este funcionário pois ele é responsável por um departamento',
          departamento: departamentoResponsavel.nome
        });
      }
      
      // Excluir funcionário
      await funcionario.destroy();
      
      return res.status(200).json({
        mensagem: 'Funcionário excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Alterar senha do funcionário
  alterarSenha: async (req, res) => {
    try {
      const { id } = req.params;
      const { senha_atual, nova_senha } = req.body;
      
      // Verificar se funcionário existe
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario) {
        return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
      }
      
      // Verificar se o usuário tem permissão (admin ou o próprio funcionário)
      if (req.funcionario.nivel_acesso !== 'Admin' && req.funcionario.id !== parseInt(id)) {
        return res.status(403).json({ mensagem: 'Não autorizado a alterar senha deste funcionário' });
      }
      
      // Se não for admin, verificar senha atual
      if (req.funcionario.nivel_acesso !== 'Admin') {
        const senhaCorreta = await funcionario.verificarSenha(senha_atual);
        if (!senhaCorreta) {
          return res.status(400).json({ mensagem: 'Senha atual incorreta' });
        }
      }
      
      // Atualizar senha
      funcionario.senha = nova_senha;
      await funcionario.save();
      
      return res.status(200).json({
        mensagem: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = funcionarioController;
