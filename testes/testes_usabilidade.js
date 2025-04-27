const { expect } = require('chai');
const puppeteer = require('puppeteer');

describe('Testes de Usabilidade e Interface', () => {
  let browser;
  let page;
  
  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });
  
  after(async () => {
    await browser.close();
  });
  
  describe('UI01 - Visualização em desktop', () => {
    it('deve exibir a página de login corretamente', async () => {
      await page.goto('http://localhost:3000/login.html');
      
      // Verificar elementos principais
      const title = await page.$eval('title', el => el.textContent);
      expect(title).to.include('Sistema de Controle de Tempo');
      
      const loginForm = await page.$('form');
      expect(loginForm).to.not.be.null;
      
      const emailInput = await page.$('input[type="email"]');
      expect(emailInput).to.not.be.null;
      
      const passwordInput = await page.$('input[type="password"]');
      expect(passwordInput).to.not.be.null;
      
      const loginButton = await page.$('button[type="submit"]');
      expect(loginButton).to.not.be.null;
    });
  });
  
  describe('UI02/UI03 - Visualização em dispositivos móveis', () => {
    it('deve adaptar a interface para tablet', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000/login.html');
      
      // Verificar adaptação responsiva
      const containerWidth = await page.$eval('.container', el => {
        const style = window.getComputedStyle(el);
        return style.width;
      });
      
      // Em tablets, o container deve ter largura menor que a viewport
      expect(parseInt(containerWidth)).to.be.at.most(768);
    });
    
    it('deve adaptar a interface para smartphone', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/login.html');
      
      // Verificar adaptação responsiva
      const containerWidth = await page.$eval('.container', el => {
        const style = window.getComputedStyle(el);
        return style.width;
      });
      
      // Em smartphones, o container deve ter largura próxima à viewport
      expect(parseInt(containerWidth)).to.be.at.most(375);
    });
  });
  
  describe('UI04 - Navegação entre páginas', () => {
    it('deve realizar login e navegar para o dashboard', async () => {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto('http://localhost:3000/login.html');
      
      // Preencher formulário de login
      await page.type('input[type="email"]', 'admin@exemplo.com');
      await page.type('input[type="password"]', 'admin123');
      
      // Clicar no botão de login
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation()
      ]);
      
      // Verificar se foi redirecionado para o dashboard
      const url = page.url();
      expect(url).to.include('dashboard.html');
      
      // Verificar elementos do dashboard
      const userName = await page.$eval('.user-name', el => el.textContent);
      expect(userName).to.include('Admin');
    });
    
    it('deve navegar entre as diferentes seções do sistema', async () => {
      // Navegar para registro de ponto
      await Promise.all([
        page.click('a[href="registro_ponto.html"]'),
        page.waitForNavigation()
      ]);
      
      let url = page.url();
      expect(url).to.include('registro_ponto.html');
      
      // Navegar para gestão de funcionários
      await Promise.all([
        page.click('a[href="gestao_funcionarios.html"]'),
        page.waitForNavigation()
      ]);
      
      url = page.url();
      expect(url).to.include('gestao_funcionarios.html');
      
      // Navegar para relatórios
      await Promise.all([
        page.click('a[href="relatorios.html"]'),
        page.waitForNavigation()
      ]);
      
      url = page.url();
      expect(url).to.include('relatorios.html');
    });
  });
  
  describe('UI05 - Feedback visual', () => {
    it('deve exibir feedback visual ao interagir com elementos', async () => {
      await page.goto('http://localhost:3000/gestao_funcionarios.html');
      
      // Clicar no botão "Novo Funcionário"
      await page.click('#btn-new-employee');
      
      // Verificar se o modal foi aberto
      const modalDisplay = await page.$eval('#employee-modal', el => {
        return window.getComputedStyle(el).display;
      });
      
      expect(modalDisplay).to.not.equal('none');
      
      // Fechar o modal
      await page.click('.modal-close');
      
      // Verificar se o modal foi fechado
      const modalDisplayAfterClose = await page.$eval('#employee-modal', el => {
        return window.getComputedStyle(el).display;
      });
      
      expect(modalDisplayAfterClose).to.equal('none');
    });
  });
});
