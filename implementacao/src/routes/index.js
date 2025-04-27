const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const registroPontoController = require('../controllers/registroPontoController');
const funcionarioController = require('../controllers/funcionarioController');
const departamentoController = require('../controllers/departamentoController');
const tagController = require('../controllers/tagController');
const relatorioController = require('../controllers/relatorioController');
const { autenticar, verificarPermissao } = require('../middleware/auth');

// Rotas de autenticação
router.post('/auth/login', authController.login);
router.get('/auth/verificar', autenticar, authController.verificarToken);

// Rotas de registro de ponto
router.post('/registro-ponto', autenticar, registroPontoController.registrarPonto);
router.get('/registro-ponto', autenticar, registroPontoController.listarRegistros);
router.get('/registro-ponto/status', autenticar, registroPontoController.obterStatusAtual);

// Rotas de funcionários
router.get('/funcionarios', autenticar, funcionarioController.listarFuncionarios);
router.get('/funcionarios/:id', autenticar, funcionarioController.obterFuncionario);
router.post('/funcionarios', autenticar, verificarPermissao(['Admin', 'Gestor']), funcionarioController.criarFuncionario);
router.put('/funcionarios/:id', autenticar, verificarPermissao(['Admin', 'Gestor']), funcionarioController.atualizarFuncionario);
router.delete('/funcionarios/:id', autenticar, verificarPermissao(['Admin']), funcionarioController.excluirFuncionario);
router.post('/funcionarios/:id/senha', autenticar, funcionarioController.alterarSenha);

// Rotas de departamentos
router.get('/departamentos', autenticar, departamentoController.listarDepartamentos);
router.get('/departamentos/:id', autenticar, departamentoController.obterDepartamento);
router.post('/departamentos', autenticar, verificarPermissao(['Admin']), departamentoController.criarDepartamento);
router.put('/departamentos/:id', autenticar, verificarPermissao(['Admin']), departamentoController.atualizarDepartamento);
router.delete('/departamentos/:id', autenticar, verificarPermissao(['Admin']), departamentoController.excluirDepartamento);

// Rotas de tags
router.get('/tags', autenticar, tagController.listarTags);
router.get('/tags/:id', autenticar, tagController.obterTag);
router.post('/tags', autenticar, verificarPermissao(['Admin', 'Gestor']), tagController.criarTag);
router.put('/tags/:id', autenticar, verificarPermissao(['Admin', 'Gestor']), tagController.atualizarTag);
router.delete('/tags/:id', autenticar, verificarPermissao(['Admin']), tagController.excluirTag);
router.post('/tags/associar', autenticar, verificarPermissao(['Admin', 'Gestor']), tagController.associarTagFuncionario);
router.delete('/tags/associar/:funcionario_id/:tag_id', autenticar, verificarPermissao(['Admin', 'Gestor']), tagController.removerTagFuncionario);

// Rotas de relatórios
router.get('/relatorios/horas-trabalhadas', autenticar, verificarPermissao(['Admin', 'Gestor']), relatorioController.relatorioHorasTrabalhadas);
router.get('/relatorios/presenca', autenticar, verificarPermissao(['Admin', 'Gestor']), relatorioController.relatorioPresenca);
router.get('/relatorios/horas-extras', autenticar, verificarPermissao(['Admin', 'Gestor']), relatorioController.relatorioHorasExtras);
router.get('/relatorios/tags', autenticar, relatorioController.listarTags);

module.exports = router;
