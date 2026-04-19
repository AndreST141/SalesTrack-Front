-- =============================================
-- SalesTrack - Database Setup
-- =============================================

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS salestrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salestrack;

-- Tabela de Usuários (para autenticação)
CREATE TABLE IF NOT EXISTS Usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'vendedor') DEFAULT 'vendedor',
    ativo BOOLEAN DEFAULT TRUE,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS Cliente (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    dataCadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS Categoria (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS Produto (
    idProduto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT DEFAULT 0,
    idCategoria INT,
    ativo BOOLEAN DEFAULT TRUE,
    dataCadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idCategoria) REFERENCES Categoria(idCategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS Venda (
    idVenda INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT,
    idUsuario INT NOT NULL,
    valorTotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valorFinal DECIMAL(10,2) NOT NULL,
    formaPagamento ENUM('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'outro') DEFAULT 'dinheiro',
    status ENUM('pendente', 'concluida', 'cancelada') DEFAULT 'concluida',
    observacoes TEXT,
    dataVenda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES Cliente(idCliente),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Itens da Venda
CREATE TABLE IF NOT EXISTS ItemVenda (
    idItemVenda INT AUTO_INCREMENT PRIMARY KEY,
    idVenda INT NOT NULL,
    idProduto INT NOT NULL,
    quantidade INT NOT NULL,
    precoUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idVenda) REFERENCES Venda(idVenda) ON DELETE CASCADE,
    FOREIGN KEY (idProduto) REFERENCES Produto(idProduto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Dados Iniciais
-- =============================================

-- Inserir usuário administrador padrão
-- Senha: admin123 (hash será gerado pelo backend)
INSERT INTO Usuario (nome, email, senha, tipo) VALUES 
('Administrador', 'admin@salestrack.com', 'admin123', 'admin'),
('Vendedor Teste', 'vendedor@salestrack.com', 'vendedor123', 'vendedor');

-- Inserir categorias padrão
INSERT INTO Categoria (nome, descricao) VALUES 
('Eletrônicos', 'Produtos eletrônicos e tecnologia'),
('Alimentos', 'Produtos alimentícios'),
('Bebidas', 'Bebidas em geral'),
('Vestuário', 'Roupas e acessórios'),
('Higiene', 'Produtos de higiene pessoal'),
('Outros', 'Produtos diversos');

-- Inserir clientes de exemplo
INSERT INTO Cliente (nome, cpf, telefone, email) VALUES 
('João Silva', '123.456.789-00', '(62) 98765-4321', 'joao@email.com'),
('Maria Santos', '987.654.321-00', '(62) 99876-5432', 'maria@email.com'),
('Pedro Oliveira', '456.789.123-00', '(62) 97654-3210', 'pedro@email.com'),
('Ana Costa', '789.123.456-00', '(62) 96543-2109', 'ana@email.com');

-- Inserir produtos de exemplo
INSERT INTO Produto (nome, descricao, preco, estoque, idCategoria) VALUES 
('Mouse Gamer', 'Mouse óptico com LED RGB', 89.90, 50, 1),
('Teclado Mecânico', 'Teclado mecânico retroiluminado', 299.90, 30, 1),
('Fone de Ouvido', 'Fone bluetooth com cancelamento de ruído', 149.90, 45, 1),
('Arroz 5kg', 'Arroz tipo 1 pacote 5kg', 25.90, 100, 2),
('Feijão 1kg', 'Feijão carioca tipo 1', 8.50, 120, 2),
('Refrigerante 2L', 'Refrigerante sabor cola', 7.90, 80, 3),
('Suco Natural 1L', 'Suco de laranja natural', 12.50, 60, 3),
('Camiseta Básica', 'Camiseta 100% algodão', 39.90, 150, 4),
('Calça Jeans', 'Calça jeans masculina', 129.90, 70, 4),
('Sabonete', 'Sabonete antibacteriano', 3.50, 200, 5);

-- Inserir vendas de exemplo para dashboard
INSERT INTO Venda (idCliente, idUsuario, valorTotal, desconto, valorFinal, formaPagamento, dataVenda) VALUES 
(1, 2, 389.80, 0.00, 389.80, 'cartao_credito', '2025-10-01 10:30:00'),
(2, 2, 34.40, 5.00, 29.40, 'pix', '2025-10-03 14:20:00'),
(3, 2, 169.80, 0.00, 169.80, 'dinheiro', '2025-10-05 09:15:00'),
(1, 2, 20.40, 0.00, 20.40, 'pix', '2025-10-08 16:45:00'),
(4, 2, 149.90, 10.00, 139.90, 'cartao_debito', '2025-10-10 11:30:00'),
(2, 2, 79.80, 0.00, 79.80, 'dinheiro', '2025-10-12 13:00:00'),
(3, 2, 299.90, 20.00, 279.90, 'cartao_credito', '2025-10-15 10:00:00'),
(1, 2, 155.30, 0.00, 155.30, 'pix', '2025-10-18 15:30:00'),
(4, 2, 51.00, 0.00, 51.00, 'dinheiro', '2025-10-20 12:15:00'),
(2, 2, 89.90, 5.00, 84.90, 'cartao_credito', '2025-10-22 14:45:00');

-- Itens das vendas (Pipeline Funcional)
-- Venda 1
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(1, 1, 1, 89.90, 89.90),
(1, 2, 1, 299.90, 299.90);

-- Venda 2
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(2, 4, 1, 25.90, 25.90),
(2, 5, 1, 8.50, 8.50);

-- Venda 3
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(3, 3, 1, 149.90, 149.90),
(3, 7, 2, 12.50, 25.00);

-- Venda 4
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(4, 6, 2, 7.90, 15.80),
(4, 10, 2, 3.50, 7.00);

-- Venda 5
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(5, 3, 1, 149.90, 149.90);

-- Venda 6
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(6, 8, 2, 39.90, 79.80);

-- Venda 7
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(7, 2, 1, 299.90, 299.90);

-- Venda 8
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(8, 9, 1, 129.90, 129.90),
(8, 4, 1, 25.90, 25.90);

-- Venda 9
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(9, 5, 3, 8.50, 25.50),
(9, 4, 1, 25.90, 25.90);

-- Venda 10
INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal) VALUES 
(10, 1, 1, 89.90, 89.90);

-- =============================================
-- Views para Relatórios
-- =============================================

-- View: Vendas com detalhes
CREATE OR REPLACE VIEW vw_vendas_detalhadas AS
SELECT 
    v.idVenda,
    v.dataVenda,
    c.nome AS cliente,
    u.nome AS vendedor,
    v.valorTotal,
    v.desconto,
    v.valorFinal,
    v.formaPagamento,
    v.status
FROM Venda v
LEFT JOIN Cliente c ON v.idCliente = c.idCliente
JOIN Usuario u ON v.idUsuario = u.idUsuario
ORDER BY v.dataVenda DESC;

-- View: Produtos mais vendidos
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
    p.idProduto,
    p.nome,
    cat.nome AS categoria,
    SUM(iv.quantidade) AS totalVendido,
    SUM(iv.subtotal) AS receitaTotal
FROM ItemVenda iv
JOIN Produto p ON iv.idProduto = p.idProduto
LEFT JOIN Categoria cat ON p.idCategoria = cat.idCategoria
GROUP BY p.idProduto, p.nome, cat.nome
ORDER BY totalVendido DESC;

-- =============================================
-- Índices para Performance
-- =============================================

CREATE INDEX idx_venda_data ON Venda(dataVenda);
CREATE INDEX idx_venda_cliente ON Venda(idCliente);
CREATE INDEX idx_venda_usuario ON Venda(idUsuario);
CREATE INDEX idx_produto_categoria ON Produto(idCategoria);
CREATE INDEX idx_itemvenda_produto ON ItemVenda(idProduto);