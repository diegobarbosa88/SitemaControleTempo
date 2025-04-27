const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');
const { Funcionario, Departamento } = require('../src/models');
const { sequelize } = require('../src/config/database');

describe('Testes de Autenticação e Segurança', () => {
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;

  before(async () => {
    // Limpar e recriar tabelas para testes
    await sequelize.sync({ force: true });
    
    // Criar departamento de teste
    const departamento = await Departamento.create({
      nome: 'Departamento de Teste',
      descricao: 'Departamento para testes automatizados'
    });
    
    // Criar usuário de teste (funcionário comum)
    testUser = await Funcionario.create({
      nome: 'Usuário Teste',
      email: 'teste@exemplo.com',
      senha: 'senha123',
      departamento_id: departamento.id,
      nivel_acesso: 'Funcionário',
      status: 'Ativo'
    });
    
    // Criar usuário administrador
    adminUser = await Funcionario.create({
      nome: 'Admin Teste',
      email: 'admin@exemplo.com',
      senha: 'admin123',
      departamento_id: departamento.id,
      nivel_acesso: 'Admin',
      status: 'Ativo'
    });
    
    // Gerar tokens
    userToken = jwt.sign(
      { id: testUser.id, nivel_acesso: testUser.nivel_acesso },
      process.env.JWT_SECRET || 'sistema_controle_tempo_secret_key',
      { expiresIn: '1h' }
    );
    
    adminToken = jwt.sign(
      { id: adminUser.id, nivel_acesso: adminUser.nivel_acesso },
      process.env.JWT_SECRET || 'sistema_controle_tempo_secret_key',
      { expiresIn: '1h' }
    );
  });
  
  describe('AT01 - Login com credenciais válidas', () => {
    it('deve autenticar o usuário e retornar um token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          senha: 'senha123'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('funcionario');
      expect(res.body.funcionario.email).to.equal('teste@exemplo.com');
    });
  });
  
  describe('AT02 - Login com credenciais inválidas', () => {
    it('deve retornar erro para email incorreto', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@exemplo.com',
          senha: 'senha123'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('mensagem');
    });
    
    it('deve retornar erro para senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          senha: 'senhaerrada'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('mensagem');
    });
  });
  
  describe('AT04 - Acesso a página protegida sem autenticação', () => {
    it('deve retornar erro ao acessar rota protegida sem token', async () => {
      const res = await request(app)
        .get('/api/funcionarios');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('mensagem');
    });
  });
  
  describe('AT05 - Acesso a funcionalidade restrita', () => {
    it('deve negar acesso a funcionário tentando criar outro funcionário', async () => {
      const res = await request(app)
        .post('/api/funcionarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Novo Funcionário',
          email: 'novo@exemplo.com',
          senha: 'senha123',
          nivel_acesso: 'Funcionário'
        });
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('mensagem');
    });
    
    it('deve permitir que admin crie novo funcionário', async () => {
      const res = await request(app)
        .post('/api/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Novo Funcionário',
          email: 'novo@exemplo.com',
          senha: 'senha123',
          nivel_acesso: 'Funcionário'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('funcionario');
    });
  });
});

describe('Testes de Registro de Entrada/Saída', () => {
  let testUser;
  let userToken;
  
  before(async () => {
    // Obter usuário de teste
    testUser = await Funcionario.findOne({ where: { email: 'teste@exemplo.com' } });
    
    // Gerar token
    userToken = jwt.sign(
      { id: testUser.id, nivel_acesso: testUser.nivel_acesso },
      process.env.JWT_SECRET || 'sistema_controle_tempo_secret_key',
      { expiresIn: '1h' }
    );
  });
  
  describe('RE01 - Registrar entrada', () => {
    it('deve criar um registro de entrada', async () => {
      const res = await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Entrada',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('registro');
      expect(res.body.registro.tipo).to.equal('Entrada');
    });
  });
  
  describe('RE02 - Registrar saída', () => {
    it('deve criar um registro de saída', async () => {
      const res = await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Saída',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('registro');
      expect(res.body.registro.tipo).to.equal('Saída');
    });
  });
  
  describe('RE03 - Registrar pausa', () => {
    it('deve criar um registro de início de pausa', async () => {
      // Primeiro registrar entrada
      await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Entrada',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      // Depois registrar pausa
      const res = await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Pausa Início',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('registro');
      expect(res.body.registro.tipo).to.equal('Pausa Início');
    });
  });
  
  describe('RE04 - Retornar da pausa', () => {
    it('deve criar um registro de fim de pausa', async () => {
      const res = await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Pausa Fim',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('registro');
      expect(res.body.registro.tipo).to.equal('Pausa Fim');
    });
  });
  
  describe('RE05 - Verificar geolocalização', () => {
    it('deve armazenar coordenadas de geolocalização com o registro', async () => {
      const latitude = -23.5505;
      const longitude = -46.6333;
      
      const res = await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Entrada',
          latitude,
          longitude,
          metodo_registro: 'Web'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('registro');
      expect(res.body.registro.latitude).to.equal(latitude.toString());
      expect(res.body.registro.longitude).to.equal(longitude.toString());
    });
  });
});

describe('Testes de Gestão de Funcionários', () => {
  let adminToken;
  let funcionarioId;
  
  before(async () => {
    // Obter usuário admin
    const adminUser = await Funcionario.findOne({ where: { email: 'admin@exemplo.com' } });
    
    // Gerar token
    adminToken = jwt.sign(
      { id: adminUser.id, nivel_acesso: adminUser.nivel_acesso },
      process.env.JWT_SECRET || 'sistema_controle_tempo_secret_key',
      { expiresIn: '1h' }
    );
  });
  
  describe('GF01 - Listar funcionários', () => {
    it('deve listar todos os funcionários', async () => {
      const res = await request(app)
        .get('/api/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('funcionarios');
      expect(res.body.funcionarios).to.be.an('array');
      expect(res.body.funcionarios.length).to.be.at.least(3); // Os 3 que criamos nos testes anteriores
    });
  });
  
  describe('GF02 - Criar novo funcionário', () => {
    it('deve criar um novo funcionário', async () => {
      const res = await request(app)
        .post('/api/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Funcionário Teste GF02',
          email: 'gf02@exemplo.com',
          senha: 'senha123',
          telefone: '11987654321',
          cargo: 'Analista',
          nivel_acesso: 'Funcionário',
          status: 'Ativo'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('funcionario');
      expect(res.body.funcionario.nome).to.equal('Funcionário Teste GF02');
      
      // Guardar ID para testes subsequentes
      funcionarioId = res.body.funcionario.id;
    });
  });
  
  describe('GF03 - Editar funcionário', () => {
    it('deve atualizar dados de um funcionário existente', async () => {
      const res = await request(app)
        .put(`/api/funcionarios/${funcionarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Funcionário Teste GF03 Atualizado',
          cargo: 'Coordenador'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('funcionario');
      expect(res.body.funcionario.nome).to.equal('Funcionário Teste GF03 Atualizado');
      expect(res.body.funcionario.cargo).to.equal('Coordenador');
    });
  });
  
  describe('GF04 - Excluir funcionário', () => {
    it('deve excluir um funcionário existente', async () => {
      const res = await request(app)
        .delete(`/api/funcionarios/${funcionarioId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('mensagem');
      
      // Verificar se foi realmente excluído
      const checkRes = await request(app)
        .get(`/api/funcionarios/${funcionarioId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkRes.status).to.equal(404);
    });
  });
});

describe('Testes de Geração de Relatórios', () => {
  let adminToken;
  let dataInicio;
  let dataFim;
  
  before(async () => {
    // Obter usuário admin
    const adminUser = await Funcionario.findOne({ where: { email: 'admin@exemplo.com' } });
    
    // Gerar token
    adminToken = jwt.sign(
      { id: adminUser.id, nivel_acesso: adminUser.nivel_acesso },
      process.env.JWT_SECRET || 'sistema_controle_tempo_secret_key',
      { expiresIn: '1h' }
    );
    
    // Definir período para relatórios
    const hoje = new Date();
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]; // Primeiro dia do mês
    dataFim = hoje.toISOString().split('T')[0]; // Hoje
  });
  
  describe('GR01 - Gerar relatório de horas trabalhadas', () => {
    it('deve gerar relatório de horas trabalhadas', async () => {
      const res = await request(app)
        .get('/api/relatorios/horas-trabalhadas')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          data_inicio: dataInicio,
          data_fim: dataFim
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('relatorio');
      expect(res.body).to.have.property('periodo');
    });
  });
  
  describe('GR02 - Gerar relatório de presença', () => {
    it('deve gerar relatório de presença', async () => {
      const res = await request(app)
        .get('/api/relatorios/presenca')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          data_inicio: dataInicio,
          data_fim: dataFim
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('relatorio');
      expect(res.body).to.have.property('periodo');
    });
  });
  
  describe('GR03 - Gerar relatório de horas extras', () => {
    it('deve gerar relatório de horas extras', async () => {
      const res = await request(app)
        .get('/api/relatorios/horas-extras')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          data_inicio: dataInicio,
          data_fim: dataFim
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('relatorio');
      expect(res.body).to.have.property('periodo');
    });
  });
  
  describe('GR04 - Filtrar relatório por departamento', () => {
    it('deve filtrar relatório por departamento', async () => {
      // Obter departamento
      const departamento = await Departamento.findOne();
      
      const res = await request(app)
        .get('/api/relatorios/horas-trabalhadas')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          data_inicio: dataInicio,
          data_fim: dataFim,
          departamento_id: departamento.id
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('relatorio');
    });
  });
});

after(async () => {
  // Limpar dados de teste
  await sequelize.close();
});
