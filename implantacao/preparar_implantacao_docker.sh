#!/bin/bash

# Script para implantação do Sistema de Controle de Tempo em ambiente de produção
# Este script prepara o ambiente e implanta a aplicação usando Docker para facilitar a portabilidade

echo "Iniciando preparação para implantação do Sistema de Controle de Tempo..."
echo "===================================================="

# Criar diretório para arquivos Docker
mkdir -p /home/ubuntu/sistema_controle_tempo/implantacao/docker

# Criar Dockerfile para a aplicação
cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/Dockerfile << EOF
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
EOF

# Criar docker-compose.yml
cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/docker-compose.yml << EOF
version: '3'

services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - PORT=3000
      - DB_HOST=db
      - DB_NAME=sistema_controle_tempo
      - DB_USER=sistema_user
      - DB_PASSWORD=senha_segura
      - JWT_SECRET=sistema_controle_tempo_secret_key_production
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs

  db:
    image: mysql:8
    restart: always
    environment:
      - MYSQL_DATABASE=sistema_controle_tempo
      - MYSQL_USER=sistema_user
      - MYSQL_PASSWORD=senha_segura
      - MYSQL_ROOT_PASSWORD=root_senha_segura
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  db_data:
EOF

# Criar configuração do Nginx
mkdir -p /home/ubuntu/sistema_controle_tempo/implantacao/docker/nginx/conf.d
mkdir -p /home/ubuntu/sistema_controle_tempo/implantacao/docker/nginx/ssl

cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Criar script de backup
mkdir -p /home/ubuntu/sistema_controle_tempo/implantacao/docker/scripts

cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/scripts/backup.sh << EOF
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/backups"

# Criar diretório de backup se não existir
mkdir -p \$BACKUP_DIR

# Backup do banco de dados
docker exec sistema-controle-tempo_db_1 mysqldump -u sistema_user -p'senha_segura' sistema_controle_tempo > \$BACKUP_DIR/backup_\$TIMESTAMP.sql

# Remover backups com mais de 7 dias
find \$BACKUP_DIR -name "backup_*.sql" -type f -mtime +7 -delete

echo "Backup concluído: \$BACKUP_DIR/backup_\$TIMESTAMP.sql"
EOF

chmod +x /home/ubuntu/sistema_controle_tempo/implantacao/docker/scripts/backup.sh

# Criar script de implantação
cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/deploy.sh << EOF
#!/bin/bash

# Script de implantação do Sistema de Controle de Tempo usando Docker

echo "Iniciando implantação do Sistema de Controle de Tempo..."
echo "===================================================="

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker \$USER
    echo "Docker instalado. Por favor, faça logout e login novamente para aplicar as alterações de grupo."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose não encontrado. Instalando..."
    curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose instalado."
fi

# Copiar arquivos da aplicação
echo "Copiando arquivos da aplicação..."
cp -r /home/ubuntu/sistema_controle_tempo/implementacao/* .

# Construir e iniciar os containers
echo "Construindo e iniciando containers..."
docker-compose up -d --build

# Configurar backup automático
echo "Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * \$(pwd)/scripts/backup.sh") | crontab -

echo "===================================================="
echo "Implantação concluída com sucesso!"
echo "O sistema está disponível em: http://localhost"
echo "Para verificar os logs: docker-compose logs -f"
echo "===================================================="
EOF

chmod +x /home/ubuntu/sistema_controle_tempo/implantacao/docker/deploy.sh

# Criar README com instruções
cat > /home/ubuntu/sistema_controle_tempo/implantacao/docker/README.md << EOF
# Implantação do Sistema de Controle de Tempo com Docker

Este diretório contém os arquivos necessários para implantar o Sistema de Controle de Tempo usando Docker e Docker Compose.

## Requisitos

- Docker
- Docker Compose

## Instruções de Implantação

1. Copie este diretório para o servidor de produção
2. Execute o script de implantação:

\`\`\`bash
./deploy.sh
\`\`\`

3. Acesse o sistema em http://localhost (ou configure o domínio no arquivo nginx/conf.d/default.conf)

## Estrutura de Diretórios

- \`Dockerfile\`: Configuração para construir a imagem da aplicação
- \`docker-compose.yml\`: Configuração dos serviços (aplicação, banco de dados, nginx)
- \`nginx/\`: Configurações do servidor web
- \`scripts/\`: Scripts utilitários (backup, etc.)

## Manutenção

### Backup do Banco de Dados

Um backup automático é configurado para ser executado diariamente às 2h da manhã. Os backups são armazenados no diretório \`/backups\`.

Para executar um backup manual:

\`\`\`bash
./scripts/backup.sh
\`\`\`

### Atualização do Sistema

Para atualizar o sistema:

1. Atualize os arquivos da aplicação
2. Reconstrua e reinicie os containers:

\`\`\`bash
docker-compose up -d --build
\`\`\`

### Monitoramento

Para verificar os logs da aplicação:

\`\`\`bash
docker-compose logs -f app
\`\`\`

Para verificar o status dos containers:

\`\`\`bash
docker-compose ps
\`\`\`
EOF

echo "===================================================="
echo "Arquivos de implantação Docker criados com sucesso!"
echo "Para implantar o sistema, navegue até o diretório docker e execute o script deploy.sh"
echo "===================================================="
