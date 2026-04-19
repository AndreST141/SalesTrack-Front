console.log('🔵 Carregando app.js...');

// =============================================
// CONFIGURAÇÃO DA API
// =============================================
const API_URL = 'http://localhost:5000/api';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM carregado - Mostrando tela de login');
    
    // Garantir que apenas a tela de login está visível
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.classList.add('active');
    if (dashboardScreen) dashboardScreen.classList.remove('active');
    
    console.log('✅ Pronto para fazer login!');
    
    // Configurar evento de login
    setupLoginForm();
});

// =============================================
// CONFIGURAR FORMULÁRIO DE LOGIN
// =============================================
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (!loginForm) {
        console.error('❌ Formulário de login não encontrado!');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
        console.log('🔐 Tentando fazer login com:', email);
        
        // Limpar erro anterior
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            
            const data = await response.json();
            console.log('📦 Resposta do servidor:', data);
            
            if (response.ok) {
                console.log('✅ Login bem-sucedido!');
                
                // Salvar token e dados do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Trocar telas
                document.getElementById('login-screen').classList.remove('active');
                document.getElementById('dashboard-screen').classList.add('active');
                
                // Inicializar dashboard
                initDashboard();
            } else {
                console.error('❌ Erro no login:', data.error);
                if (errorDiv) {
                    errorDiv.textContent = data.error || 'Erro ao fazer login';
                    errorDiv.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('❌ Erro de conexão:', error);
            if (errorDiv) {
                errorDiv.textContent = 'Erro de conexão. Verifique se o backend está rodando em http://localhost:5000';
                errorDiv.style.display = 'block';
            }
        }
    });
}

// =============================================
// INICIALIZAR DASHBOARD
// =============================================
async function initDashboard() {
    console.log('📊 Inicializando dashboard...');
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        console.error('❌ Usuário não encontrado');
        return;
    }
    
    // Atualizar informações do usuário
    document.getElementById('user-name').textContent = user.nome;
    document.getElementById('user-type').textContent = user.tipo === 'admin' ? 'Administrador' : 'Vendedor';
    
    // Data atual
    const hoje = new Date();
    document.getElementById('current-date').textContent = hoje.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Configurar logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Configurar navegação
    setupNavigation();
    
    // Carregar dados
    console.log('📥 Carregando dados do dashboard...');
    await Promise.all([
        carregarCategorias(),
        carregarClientes(),
        carregarProdutos(),
        carregarKPIs(),
        carregarGraficoVendas(),
        carregarProdutosMaisVendidos()
    ]);
    
    console.log('✅ Dashboard carregado com sucesso!');
}

// =============================================
// LOGOUT
// =============================================
async function logout() {
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
    
    localStorage.clear();
    location.reload();
}

// =============================================
// NAVEGAÇÃO
// =============================================
function setupNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover active de todos
            document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(cs => cs.classList.remove('active'));
            
            // Adicionar active ao clicado
            item.classList.add('active');
            const screen = item.getAttribute('data-screen');
            document.getElementById(`content-${screen}`).classList.add('active');
            
            // Atualizar título
            const titles = {
                'dashboard': 'Dashboard',
                'vendas': 'Nova Venda',
                'historico': 'Histórico de Vendas',
                'produtos': 'Produtos',
                'clientes': 'Clientes',
                'relatorios': 'Relatórios'
            };
            document.getElementById('page-title').textContent = titles[screen];
            
            // Carregar dados específicos
            if (screen === 'historico') carregarHistoricoVendas();
            else if (screen === 'produtos') carregarProdutos();
            else if (screen === 'clientes') carregarClientes();
        });
    });
}

// =============================================
// REQUISIÇÕES COM AUTENTICAÇÃO
// =============================================
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        console.error('❌ Não autorizado - redirecionando para login');
        localStorage.clear();
        location.reload();
        throw new Error('Não autorizado');
    }
    
    return response;
}

// =============================================
// DASHBOARD - KPIs
// =============================================
async function carregarKPIs() {
    try {
        const response = await fetchAPI('/dashboard/kpis?periodo=30');
        const data = await response.json();
        
        document.getElementById('kpi-receita').textContent = formatarMoeda(data.receitaTotal);
        document.getElementById('kpi-vendas').textContent = data.totalVendas;
        document.getElementById('kpi-ticket').textContent = formatarMoeda(data.ticketMedio);
        document.getElementById('kpi-estoque').textContent = data.produtosBaixoEstoque;
    } catch (error) {
        console.error('Erro ao carregar KPIs:', error);
    }
}

// =============================================
// DASHBOARD - GRÁFICO
// =============================================
let chartVendas = null;

async function carregarGraficoVendas() {
    try {
        const canvas = document.getElementById('chart-vendas-periodo');
        
        // Verificar se o canvas existe
        if (!canvas) {
            console.warn('Canvas do gráfico não encontrado');
            return;
        }
        
        // Destruir gráfico anterior se existir
        if (chartVendas) {
            chartVendas.destroy();
            chartVendas = null;
        }
        
        const response = await fetchAPI('/dashboard/vendas-periodo?dias=30');
        const data = await response.json();
        
        console.log('Dados do gráfico:', data);
        
        // Se não houver dados, mostrar mensagem
        if (!data || data.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhuma venda nos últimos 30 dias', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        chartVendas = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(v => {
                    try {
                        return new Date(v.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                        });
                    } catch (e) {
                        return v.data;
                    }
                }),
                datasets: [{
                    label: 'Receita (R$)',
                    data: data.map(v => parseFloat(v.receita) || 0),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750
                },
                plugins: { 
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Receita: R$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'R$ ' + value.toFixed(2)
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico criado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar gráfico:', error);
        // Não fazer nada que possa causar loop
    }
}

// =============================================
// DASHBOARD - RANKING
// =============================================
async function carregarProdutosMaisVendidos() {
    try {
        const response = await fetchAPI('/dashboard/produtos-mais-vendidos?limite=10');
        const produtos = await response.json();
        
        const container = document.getElementById('produtos-ranking');
        container.innerHTML = '';
        
        if (produtos.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma venda registrada</p>';
            return;
        }
        
        produtos.forEach((produto, index) => {
            container.innerHTML += `
                <div class="ranking-item">
                    <span class="ranking-numero">${index + 1}</span>
                    <div class="ranking-info">
                        <div class="ranking-nome">${produto.nome}</div>
                        <div class="ranking-categoria">${produto.categoria || 'Sem categoria'}</div>
                    </div>
                    <div class="ranking-valores">
                        <div class="ranking-quantidade">${produto.totalVendido} un.</div>
                        <div class="ranking-receita">${formatarMoeda(produto.receitaTotal)}</div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

// =============================================
// PRODUTOS
// =============================================
let produtosCache = [];

async function carregarProdutos() {
    try {
        const response = await fetchAPI('/produtos');
        produtosCache = await response.json();
        
        const tbody = document.getElementById('produtos-body');
        tbody.innerHTML = '';
        
        produtosCache.forEach(produto => {
            tbody.innerHTML += `
                <tr>
                    <td>${produto.idProduto}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.categoriaNome || '-'}</td>
                    <td>${formatarMoeda(produto.preco)}</td>
                    <td><span class="badge ${produto.estoque < 10 ? 'badge-warning' : 'badge-success'}">${produto.estoque}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarProduto(${produto.idProduto})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deletarProduto(${produto.idProduto})">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        atualizarSelectProdutos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function atualizarSelectProdutos() {
    const select = document.getElementById('venda-produto');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    produtosCache.forEach(produto => {
        if (produto.estoque > 0) {
            select.innerHTML += `<option value="${produto.idProduto}" data-preco="${produto.preco}" data-estoque="${produto.estoque}">${produto.nome} - ${formatarMoeda(produto.preco)} (Estoque: ${produto.estoque})</option>`;
        }
    });
}

// =============================================
// CLIENTES
// =============================================
let clientesCache = [];

async function carregarClientes() {
    try {
        const response = await fetchAPI('/clientes');
        clientesCache = await response.json();
        
        const tbody = document.getElementById('clientes-body');
        if (tbody) {
            tbody.innerHTML = '';
            
            clientesCache.forEach(cliente => {
                tbody.innerHTML += `
                    <tr>
                        <td>${cliente.idCliente}</td>
                        <td>${cliente.nome}</td>
                        <td>${cliente.cpf || '-'}</td>
                        <td>${cliente.telefone || '-'}</td>
                        <td>${cliente.email || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deletarCliente(${cliente.idCliente})">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        atualizarSelectClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function atualizarSelectClientes() {
    const select = document.getElementById('venda-cliente');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clientesCache.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.idCliente}">${cliente.nome}</option>`;
    });
}

// =============================================
// CATEGORIAS
// =============================================
async function carregarCategorias() {
    try {
        const response = await fetchAPI('/categorias');
        const categorias = await response.json();
        
        const select = document.getElementById('produto-categoria');
        if (select) {
            select.innerHTML = '<option value="">Selecione uma categoria</option>';
            categorias.forEach(cat => {
                select.innerHTML += `<option value="${cat.idCategoria}">${cat.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// =============================================
// HISTÓRICO DE VENDAS
// =============================================
async function carregarHistoricoVendas() {
    try {
        const response = await fetchAPI('/vendas');
        const vendas = await response.json();
        
        const tbody = document.getElementById('historico-vendas-body');
        tbody.innerHTML = '';
        
        vendas.forEach(venda => {
            tbody.innerHTML += `
                <tr>
                    <td>${venda.idVenda}</td>
                    <td>${new Date(venda.dataVenda).toLocaleString('pt-BR')}</td>
                    <td>${venda.clienteNome || 'Não informado'}</td>
                    <td>${venda.vendedorNome}</td>
                    <td>${formatarMoeda(venda.valorFinal)}</td>
                    <td>${venda.formaPagamento.replace('_', ' ')}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="verDetalhesVenda(${venda.idVenda})">Ver</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// Botão Atualizar Histórico
document.getElementById('btn-atualizar-historico')?.addEventListener('click', async () => {
    console.log('🔄 Atualizando histórico de vendas...');
    await carregarHistoricoVendas();
    console.log('✅ Histórico atualizado!');
});

// =============================================
// NOVA VENDA
// =============================================
let itensVenda = [];

// Adicionar produto à venda
if (document.getElementById('btn-adicionar-produto')) {
    document.getElementById('btn-adicionar-produto').addEventListener('click', () => {
        const selectProduto = document.getElementById('venda-produto');
        const quantidade = parseInt(document.getElementById('venda-quantidade').value);
        
        if (!selectProduto.value) {
            alert('Selecione um produto');
            return;
        }
        
        const option = selectProduto.options[selectProduto.selectedIndex];
        const idProduto = parseInt(selectProduto.value);
        const nomeProduto = option.textContent.split(' - ')[0];
        const preco = parseFloat(option.dataset.preco);
        const estoque = parseInt(option.dataset.estoque);
        
        if (quantidade > estoque) {
            alert(`Estoque insuficiente! Disponível: ${estoque}`);
            return;
        }
        
        const itemExistente = itensVenda.find(i => i.idProduto === idProduto);
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
            itemExistente.subtotal = itemExistente.quantidade * preco;
        } else {
            itensVenda.push({
                idProduto,
                nome: nomeProduto,
                quantidade,
                precoUnitario: preco,
                subtotal: quantidade * preco
            });
        }
        
        atualizarTabelaVenda();
        selectProduto.value = '';
        document.getElementById('venda-quantidade').value = 1;
    });
}

function atualizarTabelaVenda() {
    const tbody = document.getElementById('itens-venda-body');
    tbody.innerHTML = '';
    
    if (itensVenda.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum produto adicionado</td></tr>';
        atualizarTotaisVenda();
        return;
    }
    
    itensVenda.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>${formatarMoeda(item.precoUnitario)}</td>
                <td>${formatarMoeda(item.subtotal)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removerItemVenda(${index})">Remover</button>
                </td>
            </tr>
        `;
    });
    
    atualizarTotaisVenda();
}

function removerItemVenda(index) {
    itensVenda.splice(index, 1);
    atualizarTabelaVenda();
}

if (document.getElementById('venda-desconto')) {
    document.getElementById('venda-desconto').addEventListener('input', atualizarTotaisVenda);
}

function atualizarTotaisVenda() {
    const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);
    const desconto = parseFloat(document.getElementById('venda-desconto')?.value) || 0;
    const total = subtotal - desconto;
    
    if (document.getElementById('venda-subtotal')) {
        document.getElementById('venda-subtotal').textContent = formatarMoeda(subtotal);
        document.getElementById('venda-desconto-valor').textContent = formatarMoeda(desconto);
        document.getElementById('venda-total').textContent = formatarMoeda(total);
    }
}

// Finalizar venda
if (document.getElementById('form-nova-venda')) {
    document.getElementById('form-nova-venda').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (itensVenda.length === 0) {
            alert('Adicione pelo menos um produto');
            return;
        }
        
        const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);
        const desconto = parseFloat(document.getElementById('venda-desconto').value) || 0;
        const total = subtotal - desconto;
        
        const venda = {
            idCliente: document.getElementById('venda-cliente').value || null,
            valorTotal: subtotal,
            desconto: desconto,
            valorFinal: total,
            formaPagamento: document.getElementById('venda-pagamento').value,
            itens: itensVenda
        };
        
        try {
            const response = await fetchAPI('/vendas', {
                method: 'POST',
                body: JSON.stringify(venda)
            });
            
            if (response.ok) {
                mostrarBanner('Venda realizada com sucesso!', 'success');
                document.getElementById('form-nova-venda').reset();
                itensVenda = [];
                atualizarTabelaVenda();
                await carregarProdutos();
                await carregarKPIs();
            }
        } catch (error) {
            console.error('Erro ao realizar venda:', error);
            alert('Erro ao realizar venda');
        }
    });
}

// Cancelar venda
if (document.getElementById('btn-cancelar-venda')) {
    document.getElementById('btn-cancelar-venda').addEventListener('click', () => {
        if (confirm('Deseja cancelar esta venda?')) {
            document.getElementById('form-nova-venda').reset();
            itensVenda = [];
            atualizarTabelaVenda();
        }
    });
}

// =============================================
// VER DETALHES DA VENDA
// =============================================
async function verDetalhesVenda(id) {
    try {
        console.log('Carregando detalhes da venda:', id);
        
        const response = await fetchAPI(`/vendas/${id}`);
        const venda = await response.json();
        
        console.log('Detalhes:', venda);
        
        // Montar HTML com os detalhes
        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Venda #${venda.idVenda}</h3>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Data:</strong> ${new Date(venda.dataVenda).toLocaleString('pt-BR')}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Cliente:</strong> ${venda.clienteNome || 'Não informado'}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Vendedor:</strong> ${venda.vendedorNome}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Forma de Pagamento:</strong> ${venda.formaPagamento.replace('_', ' ')}
                </p>
            </div>
            
            <h4 style="margin: 20px 0 10px 0; color: #333;">Produtos</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Produto</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Preço Unit.</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        venda.itens.forEach(item => {
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.produtoNome}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantidade}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatarMoeda(item.precoUnitario)}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatarMoeda(item.subtotal)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Subtotal:</span>
                    <strong>${formatarMoeda(venda.valorTotal)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Desconto:</span>
                    <strong style="color: #e74c3c;">- ${formatarMoeda(venda.desconto)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0 0 0; padding-top: 10px; border-top: 2px solid #ddd; font-size: 1.2em;">
                    <span><strong>TOTAL:</strong></span>
                    <strong style="color: #27ae60;">${formatarMoeda(venda.valorFinal)}</strong>
                </div>
            </div>
        `;
        
        if (venda.observacoes) {
            html += `
                <div style="margin-top: 15px;">
                    <strong>Observações:</strong>
                    <p style="margin: 5px 0; color: #666;">${venda.observacoes}</p>
                </div>
            `;
        }
        
        // Inserir no modal
        document.getElementById('detalhes-venda-content').innerHTML = html;
        
        // Abrir modal
        abrirModal('modal-detalhes-venda');
        
    } catch (error) {
        console.error('Erro ao carregar detalhes da venda:', error);
        alert('Erro ao carregar detalhes da venda. Verifique o console.');
    }
}

// =============================================
// GESTÃO DE PRODUTOS (EDITAR/EXCLUIR/CRIAR)
// =============================================

// Botão "+ Novo Produto"
document.getElementById('btn-novo-produto')?.addEventListener('click', () => {
    // Limpar o formulário
    document.getElementById('modal-produto-titulo').textContent = 'Novo Produto';
    document.getElementById('form-produto').reset();
    document.getElementById('form-produto').removeAttribute('data-id');
    
    // Abrir o modal
    abrirModal('modal-produto');
});

// Submit do formulário de produto (criar ou editar)
document.getElementById('form-produto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar se é edição ou criação
    const idProduto = document.getElementById('form-produto').getAttribute('data-id');
    
    const dados = {
        nome: document.getElementById('produto-nome').value,
        descricao: document.getElementById('produto-descricao').value || '',
        preco: parseFloat(document.getElementById('produto-preco').value),
        estoque: parseInt(document.getElementById('produto-estoque').value),
        idCategoria: document.getElementById('produto-categoria').value || null
    };
    
    try {
        let response;
        
        if (idProduto) {
            // EDITAR produto existente
            response = await fetchAPI(`/produtos/${idProduto}`, {
                method: 'PUT',
                body: JSON.stringify(dados)
            });
        } else {
            // CRIAR novo produto
            response = await fetchAPI('/produtos', {
                method: 'POST',
                body: JSON.stringify(dados)
            });
        }
        
        if (response.ok) {
            fecharModal('modal-produto');
            await carregarProdutos(); // Recarregar lista
            alert(idProduto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        } else {
            alert('Erro ao salvar produto');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Verifique o console.');
    }
});

// Função para editar produto
function editarProduto(id) {
    const produto = produtosCache.find(p => p.idProduto === id);
    
    if (!produto) {
        alert('Produto não encontrado!');
        return;
    }
    
    // Preencher o modal com os dados do produto
    document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
    document.getElementById('produto-nome').value = produto.nome;
    document.getElementById('produto-descricao').value = produto.descricao || '';
    document.getElementById('produto-preco').value = produto.preco;
    document.getElementById('produto-estoque').value = produto.estoque;
    document.getElementById('produto-categoria').value = produto.idCategoria || '';
    
    // Marcar o formulário como "edição"
    document.getElementById('form-produto').setAttribute('data-id', id);
    
    // Abrir o modal
    abrirModal('modal-produto');
}

// Função para excluir produto
async function deletarProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/produtos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Produto excluído com sucesso!');
            await carregarProdutos(); // Recarregar lista
        } else {
            alert('Erro ao excluir produto');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Verifique o console.');
    }
}

// =============================================
// GESTÃO DE CLIENTES (CRIAR/EXCLUIR)
// =============================================

// Botão "+ Novo Cliente"
document.getElementById('btn-novo-cliente')?.addEventListener('click', () => {
    document.getElementById('form-cliente').reset();
    abrirModal('modal-cliente');
});

// Submit do formulário de cliente
document.getElementById('form-cliente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('cliente-nome').value,
        cpf: document.getElementById('cliente-cpf').value || null,
        telefone: document.getElementById('cliente-telefone').value || null,
        email: document.getElementById('cliente-email').value || null,
        endereco: document.getElementById('cliente-endereco').value || null
    };
    
    try {
        const response = await fetchAPI('/clientes', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            fecharModal('modal-cliente');
            await carregarClientes();
            alert('Cliente cadastrado com sucesso!');
        } else {
            alert('Erro ao cadastrar cliente');
        }
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        alert('Erro ao cadastrar cliente. Verifique o console.');
    }
});

// Função para excluir cliente
async function deletarCliente(id) {
    if (!confirm('Deseja realmente excluir este cliente?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/clientes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Cliente excluído com sucesso!');
            await carregarClientes();
        } else {
            alert('Erro ao excluir cliente');
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente. Verifique o console.');
    }
}

// =============================================
// IMPRESSÃO E EXPORTAÇÃO
// =============================================

// Imprimir Dashboard
window.imprimirDashboard = function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const hoje = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Pegar os KPIs da tela
    const receita = document.getElementById('kpi-receita')?.textContent || 'R$ 0,00';
    const vendas = document.getElementById('kpi-vendas')?.textContent || '0';
    const ticket = document.getElementById('kpi-ticket')?.textContent || 'R$ 0,00';
    const estoque = document.getElementById('kpi-estoque')?.textContent || '0';
    
    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dashboard - SalesTrack</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    color: #2563eb;
                    font-size: 32px;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                .kpis {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin: 30px 0;
                }
                .kpi-card {
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                .kpi-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 10px;
                }
                .kpi-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2563eb;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 20px;
                }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛒 SalesTrack</h1>
                <p><strong>Relatório do Dashboard</strong></p>
                <p>${hoje}</p>
                <p>Gerado por: ${user.nome} (${user.tipo === 'admin' ? 'Administrador' : 'Vendedor'})</p>
            </div>
            
            <div class="kpis">
                <div class="kpi-card">
                    <div class="kpi-label">Receita Total (30 dias)</div>
                    <div class="kpi-value">${receita}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total de Vendas</div>
                    <div class="kpi-value">${vendas}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Ticket Médio</div>
                    <div class="kpi-value">${ticket}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Produtos em Baixo Estoque</div>
                    <div class="kpi-value">${estoque}</div>
                </div>
            </div>
            
            <div class="footer">
                <p>SalesTrack - Sistema de Gestão de Vendas</p>
                <p>Impresso em ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    // Fechar automaticamente após imprimir (opcional)
                    // window.onafterprint = function() { window.close(); }
                }
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
};

// Exportar Vendas para CSV
window.exportarVendas = async function() {
    try {
        const response = await fetchAPI('/vendas');
        const vendas = await response.json();
        
        if (vendas.length === 0) {
            alert('Nenhuma venda para exportar!');
            return;
        }
        
        // Criar CSV
        let csv = 'ID,Data,Cliente,Vendedor,Valor Total,Desconto,Valor Final,Forma de Pagamento\n';
        
        vendas.forEach(venda => {
            csv += `${venda.idVenda},`;
            csv += `"${new Date(venda.dataVenda).toLocaleString('pt-BR')}",`;
            csv += `"${venda.clienteNome || 'Não informado'}",`;
            csv += `"${venda.vendedorNome}",`;
            csv += `${venda.valorTotal},`;
            csv += `${venda.desconto},`;
            csv += `${venda.valorFinal},`;
            csv += `"${venda.formaPagamento}"\n`;
        });
        
        // Baixar arquivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Vendas exportadas com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar vendas:', error);
        alert('Erro ao exportar vendas. Verifique o console.');
    }
};

// =============================================
// BANNER DE NOTIFICAÇÃO
// =============================================
function mostrarBanner(mensagem, tipo = 'success') {
    const banner = document.getElementById('banner-notificacao');
    
    // Define ícone baseado no tipo
    const icones = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️'
    };
    
    const icone = icones[tipo] || '✅';
    
    // Remove classes antigas
    banner.className = 'banner-notificacao';
    
    // Adiciona nova classe e conteúdo
    banner.classList.add(tipo);
    banner.innerHTML = `
        <span class="banner-icon">${icone}</span>
        <span>${mensagem}</span>
    `;
    
    // Mostra o banner
    setTimeout(() => {
        banner.classList.add('show');
    }, 100);
    
    // Esconde após 3 segundos
    setTimeout(() => {
        banner.classList.remove('show');
    }, 3500);
}

// =============================================
// UTILITÁRIOS
// =============================================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Exportar funções globais
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;
window.deletarCliente = deletarCliente;
window.verDetalhesVenda = verDetalhesVenda;
window.imprimirDashboard = imprimirDashboard;
window.fecharModal = fecharModal;
window.removerItemVenda = removerItemVenda;

console.log('✅ App.js carregado!');