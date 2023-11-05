import json
import logging

from flask import Flask, request, jsonify

from uxcelerator import get_recommendations

app = Flask(__name__)

MAX_RETRIES = 5


@app.route('/recommend', methods=['POST'])
async def recommend():
    html_content = request.get_data(as_text=True)

    if not html_content:
        return jsonify({"error": "No HTML content provided"}), 400

    parsed_recommendations = []
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            recommendations = await get_recommendations(html_content)
            for recommendation in recommendations:
                parsed_recommendations += json.loads(recommendation)
            logging.info("Generation succeeded!")
            break
        except Exception as e:
            logging.info(f"Attempt {attempt} failed with error: {e}")
            if attempt == MAX_RETRIES:
                logging.info("Reached maximum number of retries. Giving up.")

    return jsonify(parsed_recommendations), 200


if __name__ == '__main__':
    app.run(debug=True)
