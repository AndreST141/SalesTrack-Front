import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../../assets/sidebar/dashboard.svg";
import Vendas from "../../assets/sidebar/vendas.svg";
import Historico from "../../assets/sidebar/historico.svg";
import Produtos from "../../assets/sidebar/produtos.svg";
import Clientes from "../../assets/sidebar/clientes.svg";
import Relatorios from "../../assets/sidebar/relatorios.svg";
import ConfigIcon from "../../assets/sidebar/configuracoes.svg";
import SalesTrack from "../../assets/salesTrack.svg";
import './style.css';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [itemActive, setItemActive] = useState(location.pathname);

    const handleItemClick = (path) => {
        setItemActive(path);
        navigate(path);
    };

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    const tipoLabel = user?.tipo === 'admin' ? 'Administrador' : 'Vendedor';

    return (
        <div className="body-sidebar">
            <div className="box-vertical">
                <div className="header-dashboard">
                    <div className="logo">
                        <img src={SalesTrack} alt="" className="salesTrack-img" />
                        <h1>SalesTrack</h1>
                    </div>
                    <hr />
                </div>
                <div className="sidebar-menu">
                    <div className={`menu-select ${itemActive === '/dashboard' ? 'ativo' : ''}`} onClick={() => handleItemClick('/dashboard')}>
                        <img src={Dashboard} alt="" />
                        <span>Dashboard</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/vendas' ? 'ativo' : ''}`} onClick={() => handleItemClick('/vendas')}>
                        <img src={Vendas} alt="" />
                        <span>Nova Venda</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/historico' ? 'ativo' : ''}`} onClick={() => handleItemClick('/historico')}>
                        <img src={Historico} alt="" />
                        <span>Histórico</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/produtos' ? 'ativo' : ''}`} onClick={() => handleItemClick('/produtos')}>
                        <img src={Produtos} alt="" />
                        <span>Produtos</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/clientes' ? 'ativo' : ''}`} onClick={() => handleItemClick('/clientes')}>
                        <img src={Clientes} alt="" />
                        <span>Clientes</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/relatorios' ? 'ativo' : ''}`} onClick={() => handleItemClick('/relatorios')}>
                        <img src={Relatorios} alt="" />
                        <span>Relatórios</span>
                    </div>
                    <div className={`menu-select ${itemActive === '/configuracoes' ? 'ativo' : ''}`} onClick={() => handleItemClick('/configuracoes')}>
                        <img src={ConfigIcon} alt="" />
                        <span>Configurações</span>
                    </div>
                </div>
                <hr className="hr-footer" />
                <div className="footer-sidebar">
                    <div className="usuario">
                        <h1>{user?.nome || 'Usuário'}</h1>
                        <h2>{tipoLabel}</h2>
                    </div>
                    <div className="logout" onClick={handleLogout}>
                        <span>Sair</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;