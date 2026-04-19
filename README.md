# SalesTrack - Sistema de Gestão de Vendas

Sistema web de gestão de vendas com dashboard, controle de produtos, clientes e histórico de vendas.

## Evolução do Projeto (Histórico)

Este repositório está organizado para mostrar a evolução técnica do sistema ao longo do desenvolvimento:

- **v1 (Protótipo Inicial):** Modelo inicial com arquitetura e interface primárias. Foco na marcação básica com HTML, CSS e JavaScript estático "bruto".
- **v2 (Aplicação API REST):** Reestruturação do sistema para o formato de API backend e banco de dados, separando a lógica de dados da interface.
- **v3 (Integração com React):** Versão atualizada utilizando React + Vite para o frontend, consumindo a API e oferecendo uma experiência de usuário moderna.

## Integrantes do Grupo

- Matheus Sabino Ribeiro - 2313148
- André Marcos de Sousa Tavares - 2313280
- Gabriel Pedro Silva Dutra - 2310154
- Guilherme Poloniato Salomão - 2310359

## Tecnologias Utilizadas

| Frontend | React + Vite |
| Backend | Python com Flask |
| Banco de Dados | MySQL |

## Como Executar

### Pré-requisitos

- [Python 3.11+](https://www.python.org/) instalado
- [Node.js 18+](https://nodejs.org/) instalado
- [MySQL 9.5+](https://downloads.mysql.com/archives/community/) instalado e rodando

### 1. Banco de Dados

Abra o **CMD como administrador** e execute os comandos abaixo:

```bash
cd "C:\Program Files\MySQL\MySQL Server 9.5\bin"
mysql -u root -p
```

Digite sua senha do MySQL. Em seguida, execute o script abaixo:

```sql
source C:/caminho/para/SalesTrack-V3/database/database_setup.sql
```

> Exemplo: `source C:/Users/andre/OneDrive/Documentos/SalesTrack-V3/database/database_setup.sql`

### 2. Configurar o `.env`

Abra o arquivo `backend_V2/.env` e coloque a sua senha do MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=salestrack
```

### 3. Backend

Abra um terminal, entre na pasta `backend_V2` e execute:

```bash
cd backend_V2
pip install -r requirements.txt
python app.py
```

> O `pip install` só é necessário na primeira vez.

O servidor ficará disponível em: `http://localhost:5000`

### 4. Frontend (React)

Abra um **segundo terminal**, entre na pasta `frontend-react` e execute:

```bash
cd frontend_react
npm install
npm run dev
```

> O `npm install` só é necessário na primeira vez.

O sistema ficará disponível em: `http://localhost:5173`

> Os dois terminais (backend e frontend) precisam ficar abertos enquanto o sistema estiver em uso.

---

### Atalho — Iniciar tudo de uma vez

Para facilitar, há um script na raiz do projeto que abre o backend, o frontend e o navegador automaticamente com um duplo clique:

```
Script_SalesTrack.bat
```

---

## Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | admin@salestrack.com | admin123 |
| Vendedor | vendedor@salestrack.com | vendedor123 |

---

🔗 **Backend:** O código da API e banco de dados está localizado no repositório [SalesTrack-Back](https://github.com/AndreST141/SalesTrack-Back)