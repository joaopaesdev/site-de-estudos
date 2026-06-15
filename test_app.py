import unittest
import os
import tempfile
import sqlite3
import json
import app as my_app

class TestZecaApp(unittest.TestCase):
    def setUp(self):
        """Arrange: Configura um banco de dados temporário de testes."""
        self.db_fd, self.temp_db_path = tempfile.mkstemp()
        my_app.DB_PATH = self.temp_db_path
        my_app.init_db()
        
        self.app = my_app.app.test_client()
        self.app.testing = True

    def tearDown(self):
        """Cleanup: Remove o banco de dados temporário após os testes."""
        os.close(self.db_fd)
        try:
            os.unlink(self.temp_db_path)
        except OSError:
            pass

    def test_home_status_code(self):
        """Testa se a página inicial retorna status code 200."""
        # Act
        response = self.app.get('/')
        # Assert
        self.assertEqual(response.status_code, 200)

    def test_static_css_exists(self):
        """Testa se o arquivo CSS estático está acessível."""
        # Act
        response = self.app.get('/style.css')
        # Assert
        self.assertEqual(response.status_code, 200)

    def test_static_js_exists(self):
        """Testa se o arquivo JS estático está acessível."""
        # Act
        response = self.app.get('/app.js')
        # Assert
        self.assertEqual(response.status_code, 200)

    def test_registrar_tempo_sucesso(self):
        """Testa o registro bem-sucedido de tempo de estudo (RF01, RS01)."""
        # Arrange
        payload = {
            "id": "test-session-123",
            "subject": "Programacao",
            "duration": 45,
            "date": "2026-06-10",
            "timestamp": "2026-06-10T14:43:00.000Z"
        }
        
        # Act
        response = self.app.post('/api/registrar_tempo', 
                                 data=json.dumps(payload),
                                 content_type='application/json')
        
        # Assert
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["message"], "Minutos computados e salvos no database.db")
        self.assertEqual(data["data"]["duration"], 45)
        
        # Verifica persistência no SQLite
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM estudos WHERE id = ?", ("test-session-123",))
        row = cursor.fetchone()
        conn.close()
        
        self.assertIsNotNone(row)
        self.assertEqual(row[1], "Programacao")
        self.assertEqual(row[2], 45)

    def test_registrar_tempo_duracao_invalida(self):
        """Testa validação de duração inválida (RS01)."""
        # Arrange
        payload_negativo = {
            "id": "test-session-negativa",
            "subject": "Fisica",
            "duration": -15,
            "date": "2026-06-10",
            "timestamp": "2026-06-10T14:43:00.000Z"
        }
        payload_texto = {
            "id": "test-session-texto",
            "subject": "Fisica",
            "duration": "quarenta-e-cinco",
            "date": "2026-06-10",
            "timestamp": "2026-06-10T14:43:00.000Z"
        }
        
        # Act & Assert (Negativo)
        res_neg = self.app.post('/api/registrar_tempo', 
                                data=json.dumps(payload_negativo),
                                content_type='application/json')
        self.assertEqual(res_neg.status_code, 400)
        
        # Act & Assert (Texto)
        res_txt = self.app.post('/api/registrar_tempo', 
                                data=json.dumps(payload_texto),
                                content_type='application/json')
        self.assertEqual(res_txt.status_code, 400)

    def test_resumo_diario(self):
        """Testa o retorno do resumo diário agrupado pela data correta (RF02)."""
        # Arrange: Insere duas matérias para a mesma data
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO estudos VALUES ('s1', 'Programacao', 45, '2026-06-10', '2026-06-10T10:00:00Z')")
        cursor.execute("INSERT INTO estudos VALUES ('s2', 'Matematica', 60, '2026-06-10', '2026-06-10T11:00:00Z')")
        cursor.execute("INSERT INTO estudos VALUES ('s3', 'Fisica', 30, '2026-06-11', '2026-06-11T12:00:00Z')") # data diferente
        conn.commit()
        conn.close()
        
        # Act
        response = self.app.get('/api/resumo_diario?date=2026-06-10')
        
        # Assert
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data["sessions"]), 2)
        subjects = [s["subject"] for s in data["sessions"]]
        self.assertIn("Programacao", subjects)
        self.assertIn("Matematica", subjects)
        self.assertNotIn("Fisica", subjects)

    def test_excluir_tempo(self):
        """Testa a exclusão de um registro no banco SQLite (RF06)."""
        # Arrange: Insere item para deletar
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO estudos VALUES ('del-1', 'Quimica', 50, '2026-06-10', '2026-06-10T12:00:00Z')")
        conn.commit()
        conn.close()
        
        # Act
        response = self.app.post('/api/excluir_tempo', 
                                 data=json.dumps({"id": "del-1"}),
                                 content_type='application/json')
        
        # Assert
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "success")
        
        # Confirma que foi excluído do SQLite
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM estudos WHERE id = ?", ("del-1",))
        row = cursor.fetchone()
        conn.close()
        self.assertIsNone(row)

if __name__ == '__main__':
    unittest.main()
