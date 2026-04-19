from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import secrets
from functools import wraps

app = Flask(__name__)

# Configurar encoding UTF-8
app.config['JSON_AS_ASCII'] = False

# CORS SIMPLIFICADO
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'admin123',
    'database': 'salestrack',
    'charset': 'utf8mb4',
    'use_unicode': True
}

# Armazenar tokens em memória
active_tokens = {}

# Conectar ao banco
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SET NAMES utf8mb4")
        cursor.execute("SET CHARACTER SET utf8mb4")
        cursor.execute("SET character_set_connection=utf8mb4")
        cursor.close()
        return conn
    except Error as e:
        print(f"Erro ao conectar: {e}")
        return None

# Decorador para verificar token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            print("❌ Token não fornecido")
            return jsonify({'error': 'Token não fornecido'}), 401
        
        # Remover 'Bearer ' se existir
        if token.startswith('Bearer '):
            token = token[7:]
        
        if token not in active_tokens:
            print(f"❌ Token inválido: {token[:10]}...")
            return jsonify({'error': 'Token inválido'}), 401
        
        # Adicionar dados do usuário ao request
        request.user = active_tokens[token]
        print(f"✅ Usuário autenticado: {request.user['nome']}")
        return f(*args, **kwargs)
    
    return decorated

# =============================================
# AUTENTICAÇÃO
# =============================================

@app.route('/api/login', methods=['POST'])
def login():
    print(f"\n{'='*60}")
    print("🔐 LOGIN")
    print(f"{'='*60}")
    
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    
    print(f"Email: {email}")
    
    if not email or not senha:
        return jsonify({'error': 'Email e senha obrigatórios'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro de conexão'}), 500
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM Usuario WHERE email = %s AND senha = %s AND ativo = TRUE",
        (email, senha)
    )
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user:
        # Gerar token único
        token = secrets.token_urlsafe(32)
        
        # Armazenar token
        active_tokens[token] = {
            'id': user['idUsuario'],
            'nome': user['nome'],
            'email': user['email'],
            'tipo': user['tipo']
        }
        
        print(f"✅ Login OK: {user['nome']}")
        print(f"Token: {token[:10]}...")
        print(f"Tokens ativos: {len(active_tokens)}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': active_tokens[token]
        })
    else:
        print("❌ Credenciais inválidas")
        return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
@token_required
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token in active_tokens:
        del active_tokens[token]
    return jsonify({'success': True})

# =============================================
# DASHBOARD
# =============================================

@app.route('/api/dashboard/kpis', methods=['GET'])
@token_required
def get_kpis():
    periodo = request.args.get('periodo', '30')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            COUNT(*) as totalVendas,
            COALESCE(SUM(valorFinal), 0) as receitaTotal,
            COALESCE(AVG(valorFinal), 0) as ticketMedio
        FROM Venda 
        WHERE dataVenda >= DATE_SUB(NOW(), INTERVAL %s DAY)
        AND status = 'concluida'
    """, (periodo,))
    
    kpis = cursor.fetchone()
    
    cursor.execute("""
        SELECT COUNT(*) as produtosBaixoEstoque
        FROM Produto WHERE estoque < 10 AND ativo = TRUE
    """)
    
    estoque = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({
        'totalVendas': kpis['totalVendas'],
        'receitaTotal': float(kpis['receitaTotal']),
        'ticketMedio': float(kpis['ticketMedio']),
        'produtosBaixoEstoque': estoque['produtosBaixoEstoque']
    })

@app.route('/api/dashboard/vendas-periodo', methods=['GET'])
@token_required
def get_vendas_periodo():
    dias = int(request.args.get('dias', '30'))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE(dataVenda) as data,
            COUNT(*) as quantidade,
            SUM(valorFinal) as receita
        FROM Venda
        WHERE dataVenda >= DATE_SUB(NOW(), INTERVAL %s DAY)
        AND status = 'concluida'
        GROUP BY DATE(dataVenda)
        ORDER BY data
    """, (dias,))
    
    vendas = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for venda in vendas:
        venda['data'] = venda['data'].strftime('%Y-%m-%d')
        venda['receita'] = float(venda['receita'])
    
    return jsonify(vendas)

@app.route('/api/dashboard/produtos-mais-vendidos', methods=['GET'])
@token_required
def get_produtos_mais_vendidos():
    limite = int(request.args.get('limite', '10'))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            p.nome,
            c.nome as categoria,
            SUM(iv.quantidade) as totalVendido,
            SUM(iv.subtotal) as receitaTotal
        FROM ItemVenda iv
        JOIN Produto p ON iv.idProduto = p.idProduto
        LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
        JOIN Venda v ON iv.idVenda = v.idVenda
        WHERE v.status = 'concluida'
        GROUP BY p.idProduto, p.nome, c.nome
        ORDER BY totalVendido DESC
        LIMIT %s
    """, (limite,))
    
    produtos = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for produto in produtos:
        produto['receitaTotal'] = float(produto['receitaTotal'])
    
    return jsonify(produtos)

# =============================================
# PRODUTOS
# =============================================

@app.route('/api/produtos', methods=['GET'])
@token_required
def get_produtos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.*, c.nome as categoriaNome
        FROM Produto p
        LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
        WHERE p.ativo = TRUE
        ORDER BY p.nome
    """)
    
    produtos = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for produto in produtos:
        produto['preco'] = float(produto['preco'])
    
    return jsonify(produtos)

@app.route('/api/produtos', methods=['POST'])
@token_required
def create_produto():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO Produto (nome, descricao, preco, estoque, idCategoria)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data['nome'],
        data.get('descricao', ''),
        data['preco'],
        data.get('estoque', 0),
        data.get('idCategoria')
    ))
    
    conn.commit()
    produto_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'id': produto_id}), 201

@app.route('/api/produtos/<int:id>', methods=['PUT'])
@token_required
def update_produto(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE Produto 
        SET nome = %s, descricao = %s, preco = %s, estoque = %s, idCategoria = %s
        WHERE idProduto = %s
    """, (
        data['nome'],
        data.get('descricao', ''),
        data['preco'],
        data.get('estoque', 0),
        data.get('idCategoria'),
        id
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/produtos/<int:id>', methods=['DELETE'])
@token_required
def delete_produto(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Produto SET ativo = FALSE WHERE idProduto = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

# =============================================
# CLIENTES
# =============================================

@app.route('/api/clientes', methods=['GET'])
@token_required
def get_clientes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Cliente WHERE ativo = TRUE ORDER BY nome")
    clientes = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(clientes)

@app.route('/api/clientes', methods=['POST'])
@token_required
def create_cliente():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO Cliente (nome, cpf, telefone, email, endereco)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data['nome'],
        data.get('cpf'),
        data.get('telefone'),
        data.get('email'),
        data.get('endereco')
    ))
    
    conn.commit()
    cliente_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'id': cliente_id}), 201

@app.route('/api/clientes/<int:id>', methods=['DELETE'])
@token_required
def delete_cliente(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Cliente SET ativo = FALSE WHERE idCliente = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

# =============================================
# VENDAS
# =============================================

@app.route('/api/vendas', methods=['GET'])
@token_required
def get_vendas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            v.*,
            c.nome as clienteNome,
            u.nome as vendedorNome
        FROM Venda v
        LEFT JOIN Cliente c ON v.idCliente = c.idCliente
        JOIN Usuario u ON v.idUsuario = u.idUsuario
        ORDER BY v.dataVenda DESC
        LIMIT 100
    """)
    
    vendas = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for venda in vendas:
        venda['valorTotal'] = float(venda['valorTotal'])
        venda['desconto'] = float(venda['desconto'])
        venda['valorFinal'] = float(venda['valorFinal'])
        venda['dataVenda'] = venda['dataVenda'].strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify(vendas)

@app.route('/api/vendas/<int:id>', methods=['GET'])
@token_required
def get_venda_detalhes(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            v.*,
            c.nome as clienteNome,
            u.nome as vendedorNome
        FROM Venda v
        LEFT JOIN Cliente c ON v.idCliente = c.idCliente
        JOIN Usuario u ON v.idUsuario = u.idUsuario
        WHERE v.idVenda = %s
    """, (id,))
    
    venda = cursor.fetchone()
    
    if not venda:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Venda não encontrada'}), 404
    
    cursor.execute("""
        SELECT 
            iv.*,
            p.nome as produtoNome
        FROM ItemVenda iv
        JOIN Produto p ON iv.idProduto = p.idProduto
        WHERE iv.idVenda = %s
    """, (id,))
    
    itens = cursor.fetchall()
    cursor.close()
    conn.close()
    
    venda['valorTotal'] = float(venda['valorTotal'])
    venda['desconto'] = float(venda['desconto'])
    venda['valorFinal'] = float(venda['valorFinal'])
    venda['dataVenda'] = venda['dataVenda'].strftime('%Y-%m-%d %H:%M:%S')
    
    for item in itens:
        item['precoUnitario'] = float(item['precoUnitario'])
        item['subtotal'] = float(item['subtotal'])
    
    venda['itens'] = itens
    return jsonify(venda)

@app.route('/api/vendas', methods=['POST'])
@token_required
def create_venda():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO Venda (idCliente, idUsuario, valorTotal, desconto, valorFinal, formaPagamento, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('idCliente'),
            request.user['id'],
            data['valorTotal'],
            data.get('desconto', 0),
            data['valorFinal'],
            data['formaPagamento'],
            data.get('observacoes', '')
        ))
        
        venda_id = cursor.lastrowid
        
        for item in data['itens']:
            cursor.execute("""
                INSERT INTO ItemVenda (idVenda, idProduto, quantidade, precoUnitario, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                venda_id,
                item['idProduto'],
                item['quantidade'],
                item['precoUnitario'],
                item['subtotal']
            ))
            
            cursor.execute("""
                UPDATE Produto 
                SET estoque = estoque - %s 
                WHERE idProduto = %s
            """, (item['quantidade'], item['idProduto']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Venda #{venda_id} criada!")
        return jsonify({'success': True, 'id': venda_id}), 201
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({'error': str(e)}), 500

# =============================================
# CATEGORIAS
# =============================================

@app.route('/api/categorias', methods=['GET'])
@token_required
def get_categorias():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Categoria ORDER BY nome")
    categorias = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(categorias)

# =============================================
# INICIAR
# =============================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SalesTrack Backend SIMPLIFICADO")
    print("="*60)
    print("📍 http://localhost:5000")
    print("🔓 CORS: Permite todas as origens")
    print("🎫 Autenticação: Token no header Authorization")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)