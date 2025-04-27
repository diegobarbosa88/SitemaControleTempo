# Guia de Implantação - Sistema de Controle de Tempo

Este documento descreve os passos necessários para implantar o Sistema de Controle de Tempo em um ambiente de produção.

## Requisitos de Sistema

- Node.js 14.x ou superior
- MySQL 8.0 ou superior
- Servidor web (Nginx ou Apache) para proxy reverso (opcional)
- Certificado SSL para HTTPS (recomendado)

## Passos para Implantação

### 1. Preparação do Ambiente

#### 1.1 Instalar Dependências

```bash
# Atualizar pacotes
sudo apt update
sudo apt upgrade -y

# Instalar Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server

# Configurar MySQL
sudo mysql_secure_installation
```

#### 1.2 Criar Banco de Dados

```bash
# Acessar MySQL
sudo mysql

# Criar banco de dados
CREATE DATABASE sistema_controle_tempo;
CREATE USER 'sistema_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON sistema_controle_tempo.* TO 'sistema_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Configuração da Aplicação

#### 2.1 Clonar Repositório

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/sistema-controle-tempo.git
cd sistema-controle-tempo
```

#### 2.2 Instalar Dependências da Aplicação

```bash
npm install
```

#### 2.3 Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```
PORT=3000
DB_HOST=localhost
DB_NAME=sistema_controle_tempo
DB_USER=sistema_user
DB_PASSWORD=senha_segura
JWT_SECRET=chave_secreta_muito_segura_para_jwt
NODE_ENV=production
```

### 3. Inicialização do Banco de Dados

```bash
# Executar migrações
npx sequelize-cli db:migrate

# Executar seeders (dados iniciais)
npx sequelize-cli db:seed:all
```

### 4. Configuração do Servidor Web (Opcional)

#### 4.1 Instalar Nginx

```bash
sudo apt install -y nginx
```

#### 4.2 Configurar Nginx como Proxy Reverso

Criar arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/sistema-controle-tempo
```

Adicionar configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar configuração:

```bash
sudo ln -s /etc/nginx/sites-available/sistema-controle-tempo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4.3 Configurar SSL com Certbot (Recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### 5. Execução da Aplicação

#### 5.1 Instalação do PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2
```

#### 5.2 Iniciar Aplicação com PM2

```bash
pm2 start src/index.js --name sistema-controle-tempo
pm2 save
pm2 startup
```

### 6. Verificação da Implantação

- Acessar `https://seu-dominio.com` (ou `http://localhost:3000` se não estiver usando Nginx)
- Fazer login com as credenciais de administrador:
  - Email: admin@exemplo.com
  - Senha: admin123

### 7. Backup e Manutenção

#### 7.1 Configurar Backup do Banco de Dados

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-db.sh
```

Adicionar ao script:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/var/backups/sistema-controle-tempo"
mkdir -p $BACKUP_DIR
mysqldump -u sistema_user -p'senha_segura' sistema_controle_tempo > $BACKUP_DIR/backup_$TIMESTAMP.sql
```

Tornar executável e agendar:

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
```

Adicionar ao crontab:

```
0 2 * * * /usr/local/bin/backup-db.sh
```

#### 7.2 Configurar Logs

```bash
# Criar diretório de logs
mkdir -p logs

# Atualizar configuração de logs no arquivo de configuração
```

### 8. Monitoramento

#### 8.1 Monitoramento com PM2

```bash
pm2 monit
```

#### 8.2 Configurar Alertas (Opcional)

```bash
pm2 install pm2-server-monit
pm2 install pm2-logrotate
```

## Resolução de Problemas

### Aplicação não inicia

- Verificar logs: `pm2 logs sistema-controle-tempo`
- Verificar variáveis de ambiente: `cat .env`
- Verificar conexão com banco de dados: `mysql -u sistema_user -p'senha_segura' -e "SELECT 1;"`

### Erro de conexão com banco de dados

- Verificar se o serviço MySQL está rodando: `sudo systemctl status mysql`
- Verificar credenciais no arquivo `.env`
- Verificar permissões do usuário do banco de dados

### Problemas de performance

- Verificar uso de CPU e memória: `pm2 monit`
- Verificar logs de acesso do Nginx: `sudo tail -f /var/log/nginx/access.log`
- Considerar escalar horizontalmente com mais instâncias: `pm2 scale sistema-controle-tempo 2`

## Atualização do Sistema

Para atualizar o sistema para uma nova versão:

```bash
# Parar a aplicação
pm2 stop sistema-controle-tempo

# Fazer backup do banco de dados
/usr/local/bin/backup-db.sh

# Atualizar código
git pull

# Instalar dependências
npm install

# Executar migrações
npx sequelize-cli db:migrate

# Reiniciar aplicação
pm2 restart sistema-controle-tempo
```
