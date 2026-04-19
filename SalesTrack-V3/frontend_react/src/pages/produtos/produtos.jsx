import { useState, useEffect } from 'react';
import Sidebar from '../../components/SideBar/sidebar';
import Table from '../../components/Table/Table';
import Modal from '../../components/Modal/Modal';
import FilterModal from '../../components/FilterModal/FilterModal';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import './style.css';

const formInicial = {
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    idCategoria: '',
    codigoBarras: '',
};

function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalForm, setModalForm] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [form, setForm] = useState(formInicial);
    const [salvando, setSalvando] = useState(false);

    const [modalFiltros, setModalFiltros] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const { showNotification } = useNotification();

    const fmt = (val) =>
        Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    async function carregarDados() {
        setLoading(true);
        try {
            const [resProdutos, resCategorias] = await Promise.all([
                api.get('/produtos'),
                api.get('/categorias'),
            ]);
            setProdutos(resProdutos.data);
            setCategorias(resCategorias.data);
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
            showNotification('Erro ao carregar produtos', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    function abrirModalNovo() {
        setProdutoSelecionado(null);
        setForm(formInicial);
        setModalForm(true);
    }

    function abrirModalEditar(produto) {
        setProdutoSelecionado(produto);
        setForm({
            nome: produto.nome || '',
            descricao: produto.descricao || '',
            preco: produto.preco || '',
            estoque: produto.estoque || '',
            idCategoria: produto.idCategoria || '',
            codigoBarras: produto.codigoBarras || '',
        });
        setModalForm(true);
    }

    function abrirModalDeletar(produto) {
        setProdutoSelecionado(produto);
        setModalDelete(true);
    }

    async function salvarProduto() {
        if (!form.nome || !form.preco) {
            showNotification('Preencha ao menos o nome e o preço', 'warning');
            return;
        }

        setSalvando(true);
        try {
            const dados = {
                nome: form.nome,
                descricao: form.descricao || '',
                preco: parseFloat(form.preco),
                estoque: parseInt(form.estoque) || 0,
                idCategoria: form.idCategoria || null,
                codigoBarras: form.codigoBarras || null,
            };

            if (produtoSelecionado) {
                await api.put(`/produtos/${produtoSelecionado.idProduto}`, dados);
                showNotification('Produto atualizado com sucesso!', 'success');
            } else {
                await api.post('/produtos', dados);
                showNotification('Produto cadastrado com sucesso!', 'success');
            }

            setModalForm(false);
            await carregarDados();
        } catch (err) {
            console.error('Erro ao salvar produto:', err);
            showNotification('Erro ao salvar produto', 'error');
        } finally {
            setSalvando(false);
        }
    }

    async function excluirProduto() {
        if (!produtoSelecionado) return;
        try {
            await api.delete(`/produtos/${produtoSelecionado.idProduto}`);
            showNotification('Produto excluído com sucesso!', 'success');
            setModalDelete(false);
            setProdutoSelecionado(null);
            await carregarDados();
        } catch (err) {
            console.error('Erro ao excluir produto:', err);
            showNotification('Erro ao excluir produto', 'error');
        }
    }

    function handleFormChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const filterDefinitions = [
        { key: 'idProduto', label: 'ID do Produto', type: 'text', placeholder: 'Ex: 1' },
        { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Nome do produto...' },
        {
            key: 'categoriaNome',
            label: 'Categoria',
            type: 'select',
            options: categorias.map((c) => ({ value: c.nome, label: c.nome })),
        },
        {
            key: '_estoqueStatus',
            label: 'Estoque',
            type: 'select',
            options: [
                { value: 'positivo', label: 'Estoque Positivo' },
                { value: 'zero', label: 'Estoque Zerado' },
                { value: 'negativo', label: 'Estoque Negativo' },
            ],
        },
        {
            key: '_status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
            ],
        },
    ];

    const columns = [
        { key: 'idProduto', label: 'ID' },
        { key: 'nome', label: 'Nome' },
        {
            key: 'categoriaNome',
            label: 'Categoria',
            render: (val) => val || '-',
        },
        {
            key: 'preco',
            label: 'Preço',
            render: (val) => fmt(val),
        },
        {
            key: 'estoque',
            label: 'Estoque',
            render: (val) => (
                <span className={`badge ${val < 0 ? 'badge-danger' : val < 10 ? 'badge-warning' : 'badge-success'}`}>
                    {val}
                </span>
            ),
        },
        {
            key: 'ativo',
            label: 'Status',
            render: (val) => (
                <span className={`badge ${val === false || val === 0 ? 'badge-danger' : 'badge-success'}`}>
                    {val === false || val === 0 ? 'Inativo' : 'Ativo'}
                </span>
            ),
        },
    ];

    return (
        <div className="body-produtos">
            <Sidebar />
            <div className="content-produtos">
                <div className="title-page">
                    <h1>Produtos</h1>
                </div>
                <div className="produtos-body">
                    <Table
                        columns={columns}
                        data={produtos}
                        loading={loading}
                        searchPlaceholder="Pesquisar por nome, categoria ou código de barras..."
                        searchKeys={['nome', 'categoriaNome', 'codigoBarras']}
                        emptyMessage="Nenhum produto cadastrado"
                        advancedFilters={filterDefinitions}
                        activeFilters={activeFilters}
                        onFilterClick={() => setModalFiltros(true)}
                        headerActions={
                            <button className="btn-primary" onClick={abrirModalNovo}>
                                + Novo Produto
                            </button>
                        }
                        actions={(item) => (
                            <>
                                <button className="btn-action" onClick={() => abrirModalEditar(item)}>
                                    Editar
                                </button>
                                <button className="btn-action btn-danger" onClick={() => abrirModalDeletar(item)}>
                                    Excluir
                                </button>
                            </>
                        )}
                    />
                </div>
                <FilterModal
                    isOpen={modalFiltros}
                    onClose={() => setModalFiltros(false)}
                    filters={filterDefinitions}
                    activeFilters={activeFilters}
                    onApply={setActiveFilters}
                />

                <Modal
                    isOpen={modalForm}
                    onClose={() => setModalForm(false)}
                    title={produtoSelecionado ? 'Editar Produto' : 'Novo Produto'}
                    onConfirm={salvarProduto}
                    footer={
                        <>
                            <button className="btn-modal-cancel" onClick={() => setModalForm(false)}>Cancelar</button>
                            <button className="btn-modal-confirm" onClick={salvarProduto} disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label>Nome *</label>
                        <input
                            type="text"
                            value={form.nome}
                            onChange={(e) => handleFormChange('nome', e.target.value)}
                            placeholder="Nome do produto"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            value={form.descricao}
                            onChange={(e) => handleFormChange('descricao', e.target.value)}
                            placeholder="Descrição do produto"
                            rows={3}
                        />
                    </div>
                    <div className="form-row-3">
                        <div className="form-group">
                            <label>Preço *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.preco}
                                onChange={(e) => handleFormChange('preco', e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Estoque</label>
                            <input
                                type="number"
                                value={form.estoque}
                                onChange={(e) => handleFormChange('estoque', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                value={form.idCategoria}
                                onChange={(e) => handleFormChange('idCategoria', e.target.value)}
                            >
                                <option value="">Selecione</option>
                                {categorias.map((cat) => (
                                    <option key={cat.idCategoria} value={cat.idCategoria}>
                                        {cat.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Código de Barras</label>
                        <input
                            type="text"
                            value={form.codigoBarras}
                            onChange={(e) => handleFormChange('codigoBarras', e.target.value)}
                            placeholder="Ex: 7891234567890"
                        />
                    </div>
                </Modal>
                <Modal
                    isOpen={modalDelete}
                    onClose={() => setModalDelete(false)}
                    title="Excluir Produto"
                    maxWidth="420px"
                    onConfirm={excluirProduto}
                    footer={
                        <>
                            <button className="btn-modal-cancel" onClick={() => setModalDelete(false)}>Cancelar</button>
                            <button className="btn-modal-danger" onClick={excluirProduto}>Excluir</button>
                        </>
                    }
                >
                    <p className="confirm-message">
                        Deseja realmente excluir o produto<br />
                        <strong>"{produtoSelecionado?.nome}"</strong>?<br />
                        Esta ação não pode ser desfeita.
                    </p>
                </Modal>
            </div>
        </div>
    );
}

export default Produtos;