import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

# 1. DEFINIÇÃO DE PASTAS E ARQUIVOS (CAMINHOS ABSOLUTOS)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
DB_PATH = os.environ.get('DB_PATH', os.path.join(BASE_DIR, 'database.db'))

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')

# 2. INICIALIZAÇÃO DO BANCO DE DADOS SQLITE
def init_db():
    """Inicializa o banco de dados local com caminhos absolutos."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS estudos (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            duration INTEGER NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# 3. ROTAS DE ARQUIVOS ESTÁTICOS
@app.route('/')
def serve_index():
    """Servidor local serve o index.html da pasta estática."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Servidor serve outros arquivos estáticos (CSS, JS)."""
    return send_from_directory(app.static_folder, path)

# 4. API ENDPOINTS (CONTRATO SCHEMA.MD)

@app.route('/api/registrar_tempo', methods=['POST'])
def registrar_tempo():
    """
    POST /api/registrar_tempo
    Recebe os dados de tempo e persiste no SQLite.
    """
    print("[API] Recebendo tempo de estudo...")
    
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Payload JSON invalido"}), 400
    
    session_id = data.get('id')
    subject = data.get('subject')
    duration = data.get('duration')
    date_str = data.get('date')
    timestamp = data.get('timestamp')

    # Validações rígidas de entrada (RS01 e Ana Backend Guide)
    if not session_id or not subject or not date_str or not timestamp:
        return jsonify({"status": "error", "message": "Campos obrigatorios ausentes"}), 400

    if not isinstance(subject, str) or not subject.strip():
        return jsonify({"status": "error", "message": "Materia deve ser um texto nao vazio"}), 400

    # Garante que a duração é um inteiro positivo (RS01)
    try:
        duration = int(duration)
        if duration <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "A duracao deve ser um numero inteiro positivo"}), 400

    # Gravação no SQLite
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Insere ou substitui se o ID já existir
        cursor.execute('''
            INSERT OR REPLACE INTO estudos (id, subject, duration, date, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (session_id, subject.strip(), duration, date_str, timestamp))
        
        conn.commit()
        conn.close()
        
        print(f"[SQLite] Minutos computados e salvos no database.db (ID: {session_id}, {duration} min em {subject})")
        
        return jsonify({
            "status": "success",
            "message": "Minutos computados e salvos no database.db",
            "data": {
                "id": session_id,
                "subject": subject.strip(),
                "duration": duration
            }
        }), 201

    except Exception as e:
        print(f"[SQLite Erro] Erro ao salvar dados no banco: {str(e)}")
        return jsonify({"status": "error", "message": "Erro interno do servidor ao salvar dados"}), 500


@app.route('/api/resumo_diario', methods=['GET'])
def resumo_diario():
    """
    GET /api/resumo_diario?date=YYYY-MM-DD
    Retorna os logs salvos para a data informada.
    """
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"status": "error", "message": "Parametro de data obrigatorio"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        # Permite retornar resultados como dicionários em vez de tuplas
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM estudos WHERE date = ?', (date_str,))
        rows = cursor.fetchall()
        
        sessions_list = []
        for row in rows:
            sessions_list.append({
                "id": row["id"],
                "subject": row["subject"],
                "duration": row["duration"],
                "date": row["date"],
                "timestamp": row["timestamp"]
            })
            
        conn.close()
        return jsonify({
            "status": "success",
            "date": date_str,
            "sessions": sessions_list
        }), 200

    except Exception as e:
        print(f"[SQLite Erro] Erro ao ler dados do banco: {str(e)}")
        return jsonify({"status": "error", "message": "Erro interno do servidor ao ler dados"}), 500


@app.route('/api/excluir_tempo', methods=['POST'])
def excluir_tempo():
    """
    POST /api/excluir_tempo
    Exclui um registro específico de tempo de estudo do banco de dados.
    """
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"status": "error", "message": "ID para exclusao nao informado"}), 400

    session_id = data.get('id')

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM estudos WHERE id = ?', (session_id,))
        rows_affected = conn.total_changes
        
        conn.commit()
        conn.close()
        
        if rows_affected > 0:
            print(f"[SQLite] Registro {session_id} excluido do database.db")
            return jsonify({
                "status": "success",
                "message": "Registro removido com sucesso."
            }), 200
        else:
            return jsonify({"status": "error", "message": "Registro nao encontrado"}), 404

    except Exception as e:
        print(f"[SQLite Erro] Erro ao deletar dados do banco: {str(e)}")
        return jsonify({"status": "error", "message": "Erro interno do servidor ao excluir dados"}), 500

if __name__ == '__main__':
    print("Iniciando servidor de desenvolvimento local Zeca...")
    print(f"Servindo arquivos estaticos de: {STATIC_DIR}")
    print(f"Banco de dados SQLite em: {DB_PATH}")
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Acesse: http://127.0.0.1:{port}")
    
    app.run(debug=True, host='0.0.0.0', port=port)
