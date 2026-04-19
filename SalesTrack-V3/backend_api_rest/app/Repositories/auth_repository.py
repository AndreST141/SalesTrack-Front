from config.database import get_db_connection

class AuthRepository:

    @staticmethod
    def find_by_credentials(email, senha):
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM Usuario WHERE email = %s AND senha = %s AND ativo = TRUE",
            (email, senha)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
