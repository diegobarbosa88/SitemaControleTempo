#!/bin/bash

# Script de implantação do Sistema de Controle de Tempo
# Este script automatiza o processo de implantação do sistema em um servidor de produção

echo "Iniciando implantação do Sistema de Controle de Tempo..."
echo "===================================================="

# Verificar se está sendo executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Este script deve ser executado como root"
  exit 1
fi

# Definir variáveis
APP_DIR="/opt/sistema-controle-tempo"
BACKUP_DIR="/var/backups/sistema-controle-tempo"
DB_NAME="sistema_controle_tempo"
DB_USER="sistema_user"
DB_PASS="senha_segura"
DOMAIN="seu-dominio.com"

# Criar diretórios necessários
echo "Criando diretórios..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR

# Atualizar sistema
echo "Atualizando sistema..."
apt update
apt upgrade -y

# Instalar dependências
echo "Instalando dependências..."
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs mysql-server nginx certbot python3-certbot-nginx

# Configurar MySQL
echo "Configurando MySQL..."
# Verificar se o banco de dados já existe
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Copiar arquivos da aplicação
echo "Copiando arquivos da aplicação..."
cp -r /home/ubuntu/sistema_controle_tempo/implementacao/* $APP_DIR/

# Configurar variáveis de ambiente
echo "Configurando variáveis de ambiente..."
cat > $APP_DIR/.env << EOF
PORT=3000
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
JWT_SECRET=sistema_controle_tempo_secret_key_production
NODE_ENV=production
EOF

# Instalar dependências da aplicação
echo "Instalando dependências da aplicação..."
cd $APP_DIR
npm install

# Configurar Nginx
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/sistema-controle-tempo << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar configuração do Nginx
ln -sf /etc/nginx/sites-available/sistema-controle-tempo /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configurar SSL (opcional)
echo "Deseja configurar SSL com Let's Encrypt? (s/n)"
read -r ssl_option
if [ "$ssl_option" = "s" ]; then
  echo "Configurando SSL..."
  certbot --nginx -d $DOMAIN
fi

# Instalar PM2
echo "Instalando PM2..."
npm install -g pm2

# Iniciar aplicação
echo "Iniciando aplicação..."
cd $APP_DIR
pm2 start src/index.js --name sistema-controle-tempo
pm2 save
pm2 startup

# Configurar backup automático
echo "Configurando backup automático..."
cat > /usr/local/bin/backup-db.sh << EOF
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d%H%M%S")
mysqldump -u $DB_USER -p'$DB_PASS' $DB_NAME > $BACKUP_DIR/backup_\$TIMESTAMP.sql
find $BACKUP_DIR -name "backup_*.sql" -type f -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -

echo "===================================================="
echo "Implantação concluída com sucesso!"
echo "O sistema está disponível em: http://$DOMAIN"
echo "Para monitorar a aplicação, execute: pm2 monit"
echo "===================================================="
