import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
FRONTEND_ORIGIN = os.environ.get('FRONTEND_ORIGIN', '*')
FRONTEND_REFERER = os.environ.get('FRONTEND_REFERER', 'http://localhost:8000/')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": FRONTEND_ORIGIN}})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/api/chat', methods=['POST'])
def chat():
    if not OPENROUTER_API_KEY:
        return jsonify({
            "error": "OPENROUTER_API_KEY not set",
            "message": "Set the environment variable OPENROUTER_API_KEY before running the server"
        }), 500

    data = request.get_json(force=True) or {}
    prompt = data.get('prompt', '').strip()
    model = (data.get('model') or '').strip() or os.environ.get('OPENROUTER_DEFAULT_MODEL', 'meta-llama/llama-4-maverick')
    if not prompt:
        return jsonify({"error": "missing_prompt"}), 400

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Eres un asistente médico especializado en electrocardiografía, anestesiología y medicina familiar. "
                    "Responde en español de manera clara, empática y profesional. No des diagnósticos definitivos ni indicaciones médicas, solo información orientativa."
                )
            },
            {"role": "user", "content": prompt}
        ]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        # Estos headers son opcionales, útiles para OpenRouter analytics
        "HTTP-Referer": FRONTEND_REFERER,
        "X-Title": "MedTechRider Chatbot"
    }

    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload),
            timeout=30
        )
        r.raise_for_status()
        resp = r.json()
        reply = (
            resp.get('choices', [{}])[0]
                .get('message', {})
                .get('content')
            or "Lo siento, no pude generar una respuesta. Inténtalo nuevamente."
        )
        return jsonify({"reply": reply})
    except requests.RequestException as e:
        return jsonify({"error": "upstream_error", "detail": str(e)}), 502

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)