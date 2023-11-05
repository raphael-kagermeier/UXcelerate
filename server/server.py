import json
import logging

from flask import Flask, request, jsonify
from uxcelerator import get_recommendations

app = Flask(__name__)

MAX_RETRIES = 5


def remove_prefix(response):
    start_index = response.find("[")
    if start_index == -1:
        raise ValueError("Response does not have the JSON format.")
    return response[start_index:]

@app.route('/recommend', methods=['POST'])
async def recommend():
    data = request.get_json()
    goal = data['goal']
    html_content = data['htmlContent']

    if not html_content:
        return jsonify({"error": "No HTML content provided"}), 400

    parsed_recommendations = []
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            recommendations = await get_recommendations(html_content)
            for recommendation in recommendations:
                parsed_recommendations += json.loads(remove_prefix(recommendation))
            logging.info("Generation succeeded!")
            break
        except Exception as e:
            logging.info(f"Attempt {attempt} failed with error: {e}")
            if attempt == MAX_RETRIES:
                logging.info("Reached maximum number of retries. Giving up.")

    return jsonify(parsed_recommendations), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
    app.run(debug=True)
