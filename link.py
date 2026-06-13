from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client

app = Flask(__name__)
CORS(app)

url = "https://xexwzlgvcdmvdfuzvnut.supabase.co"
key = "sb_publishable_O25wK5Fs-xZMUpIa283oAQ_nnhQrQaf"

supabase = create_client(url, key)

@app.route("/")
def home():
    return "Conectado!"

@app.route("/teste")
def teste():
    try:
        resposta = supabase.table("produto").select("*").execute()
        return jsonify(resposta.data)
    except Exception as erro:
        return jsonify({"erro": str(erro)}), 500

@app.route("/produtos")
def produtos():
    try:
        resposta = supabase.table("produto").select("*").execute()
        return jsonify(resposta.data)
    except Exception as erro:
        return jsonify({"erro": str(erro)}), 500

if __name__ == "__main__":
    app.run(debug=True)