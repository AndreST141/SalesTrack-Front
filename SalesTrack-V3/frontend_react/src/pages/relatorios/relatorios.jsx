import React from "react";
import Sidebar from "../../components/SideBar/sidebar";
import './style.css';

function Relatorios() {
    return(
        <div className="body-relatorios">
            <Sidebar />
            <div className="content-relatorios">
                <h1>Relatorios</h1>
            </div>
        </div>
    )
}
export default Relatorios;