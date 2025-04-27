const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/index');

describe('Testes de Desempenho', () => {
  let userToken;
  
  before(async () => {
    // Obter token para testes
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@exemplo.com',
        senha: 'admin123'
      });
    
    userToken = loginRes.body.token;
  });
  
  describe('DE01 - Tempo de resposta para login', () => {
    it('deve responder ao login em menos de 2 segundos', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@exemplo.com',
          senha: 'admin123'
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.at.most(2000);
    });
  });
  
  describe('DE02 - Tempo de resposta para registro de ponto', () => {
    it('deve registrar ponto em menos de 2 segundos', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/registro-ponto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipo: 'Entrada',
          latitude: -23.5505,
          longitude: -46.6333,
          metodo_registro: 'Web'
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.at.most(2000);
    });
  });
  
  describe('DE03 - Tempo de resposta para geração de relatório', () => {
    it('deve gerar relatório em menos de 5 segundos', async () => {
      const hoje = new Date();
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]; // Primeiro dia do mês
      const dataFim = hoje.toISOString().split('T')[0]; // Hoje
      
      const startTime = Date.now();
      
      await request(app)
        .get('/api/relatorios/horas-trabalhadas')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          data_inicio: dataInicio,
          data_fim: dataFim
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.at.most(5000);
    });
  });
  
  describe('DE04 - Carga de múltiplos usuários', () => {
    it('deve suportar múltiplas requisições simultâneas', async () => {
      const numRequests = 10;
      const requests = [];
      
      const startTime = Date.now();
      
      // Criar múltiplas requisições simultâneas
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          request(app)
            .get('/api/funcionarios')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }
      
      // Executar todas as requisições
      await Promise.all(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // O tempo médio por requisição deve ser menor que 1 segundo
      const avgTime = totalTime / numRequests;
      expect(avgTime).to.be.at.most(1000);
    });
  });
});
