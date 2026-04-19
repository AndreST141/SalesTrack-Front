from config.database import get_db_connection

class ClienteRepository:

    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Cliente WHERE ativo = TRUE ORDER BY nome")
        clientes = cursor.fetchall()
        cursor.close()
        conn.close()
        return clientes

    @staticmethod
    def create(dados):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Cliente (nome, cpf, telefone, email, endereco)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            dados['nome'],
            dados.get('cpf'),
            dados.get('telefone'),
            dados.get('email'),
            dados.get('endereco')
        ))
        conn.commit()
        cliente_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return cliente_id

    @staticmethod
    def soft_delete(id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Cliente SET ativo = FALSE WHERE idCliente = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
