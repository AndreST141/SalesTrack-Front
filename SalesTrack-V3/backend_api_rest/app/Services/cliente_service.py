from app.Repositories.cliente_repository import ClienteRepository
from app.Constants.geral import Geral

class ClienteService:

    @staticmethod
    def list():
        clientes = ClienteRepository.get_all()
        return {'status': 200, 'clientes': clientes}

    @staticmethod
    def create(dados):
        if not dados.get('nome'):
            return {'status': 400, 'error': 'Nome é obrigatório.'}

        cliente_id = ClienteRepository.create(dados)
        return {'status': 201, 'message': Geral.CLIENTE_CADASTRADO, 'id': cliente_id}

    @staticmethod
    def delete(id):
        ClienteRepository.soft_delete(id)
        return {'status': 200, 'message': Geral.CLIENTE_REMOVIDO}
