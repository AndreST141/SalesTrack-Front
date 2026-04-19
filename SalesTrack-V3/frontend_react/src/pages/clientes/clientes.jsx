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
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
};

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalForm, setModalForm] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [form, setForm] = useState(formInicial);
    const [salvando, setSalvando] = useState(false);

    const [modalFiltros, setModalFiltros] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const { showNotification } = useNotification();

    async function carregarClientes() {
        setLoading(true);
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
        } catch (err) {
            console.error('Erro ao carregar clientes:', err);
            showNotification('Erro ao carregar clientes', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarClientes();
    }, []);

    function abrirModalNovo() {
        setClienteSelecionado(null);
        setForm(formInicial);
        setModalForm(true);
    }

    function abrirModalEditar(cliente) {
        setClienteSelecionado(cliente);
        setForm({
            nome: cliente.nome || '',
            cpf: cliente.cpf || '',
            telefone: cliente.telefone || '',
            email: cliente.email || '',
            endereco: cliente.endereco || '',
        });
        setModalForm(true);
    }

    function abrirModalDeletar(cliente) {
        setClienteSelecionado(cliente);
        setModalDelete(true);
    }

    async function salvarCliente() {
        if (!form.nome) {
            showNotification('Preencha ao menos o nome do cliente', 'warning');
            return;
        }

        setSalvando(true);
        try {
            const dados = {
                nome: form.nome,
                cpf: form.cpf || null,
                telefone: form.telefone || null,
                email: form.email || null,
                endereco: form.endereco || null,
            };

            if (clienteSelecionado) {
                await api.put(`/clientes/${clienteSelecionado.idCliente}`, dados);
                showNotification('Cliente atualizado com sucesso!', 'success');
            } else {
                await api.post('/clientes', dados);
                showNotification('Cliente cadastrado com sucesso!', 'success');
            }

            setModalForm(false);
            await carregarClientes();
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
            showNotification('Erro ao salvar cliente', 'error');
        } finally {
            setSalvando(false);
        }
    }

    async function excluirCliente() {
        if (!clienteSelecionado) return;
        try {
            await api.delete(`/clientes/${clienteSelecionado.idCliente}`);
            showNotification('Cliente excluído com sucesso!', 'success');
            setModalDelete(false);
            setClienteSelecionado(null);
            await carregarClientes();
        } catch (err) {
            console.error('Erro ao excluir cliente:', err);
            showNotification('Erro ao excluir cliente', 'error');
        }
    }

    function handleFormChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const filterDefinitions = [
        { key: 'idCliente', label: 'ID do Cliente', type: 'text', placeholder: 'Ex: 1' },
        { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Nome do cliente...' },
        { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
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
        { key: 'idCliente', label: 'ID' },
        { key: 'nome', label: 'Nome' },
        {
            key: 'cpf',
            label: 'CPF',
            render: (val) => val || '-',
        },
        {
            key: 'telefone',
            label: 'Telefone',
            render: (val) => val || '-',
        },
        {
            key: 'email',
            label: 'Email',
            render: (val) => val || '-',
        },
    ];

    return (
        <div className="body-clientes">
            <Sidebar />
            <div className="content-clientes">
                <div className="title-page">
                    <h1>Clientes</h1>
                </div>
                <div className="clientes-body">
                    <Table
                        columns={columns}
                        data={clientes}
                        loading={loading}
                        searchPlaceholder="Pesquisar por nome, CPF, telefone ou email..."
                        searchKeys={['nome', 'cpf', 'telefone', 'email']}
                        emptyMessage="Nenhum cliente cadastrado"
                        advancedFilters={filterDefinitions}
                        activeFilters={activeFilters}
                        onFilterClick={() => setModalFiltros(true)}
                        headerActions={
                            <button className="btn-primary" onClick={abrirModalNovo}>
                                + Novo Cliente
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
                    title={clienteSelecionado ? 'Editar Cliente' : 'Novo Cliente'}
                    onConfirm={salvarCliente}
                    footer={
                        <>
                            <button className="btn-modal-cancel" onClick={() => setModalForm(false)}>Cancelar</button>
                            <button className="btn-modal-confirm" onClick={salvarCliente} disabled={salvando}>
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
                            placeholder="Nome completo"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>CPF</label>
                            <input
                                type="text"
                                value={form.cpf}
                                onChange={(e) => handleFormChange('cpf', e.target.value)}
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input
                                type="text"
                                value={form.telefone}
                                onChange={(e) => handleFormChange('telefone', e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Endereço</label>
                        <textarea
                            value={form.endereco}
                            onChange={(e) => handleFormChange('endereco', e.target.value)}
                            placeholder="Endereço completo"
                            rows={2}
                        />
                    </div>
                </Modal>
                <Modal
                    isOpen={modalDelete}
                    onClose={() => setModalDelete(false)}
                    title="Excluir Cliente"
                    maxWidth="420px"
                    onConfirm={excluirCliente}
                    footer={
                        <>
                            <button className="btn-modal-cancel" onClick={() => setModalDelete(false)}>Cancelar</button>
                            <button className="btn-modal-danger" onClick={excluirCliente}>Excluir</button>
                        </>
                    }
                >
                    <p className="confirm-message">
                        Deseja realmente excluir o cliente<br />
                        <strong>"{clienteSelecionado?.nome}"</strong>?<br />
                        Esta ação não pode ser desfeita.
                    </p>
                </Modal>
            </div>
        </div>
    );
}

export default Clientes;