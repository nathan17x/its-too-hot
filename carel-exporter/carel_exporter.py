import requests
from flask import Flask, Response
import csv
import re

app = Flask(__name__)

def sanitize_metric_name(name):
    return f"hvac_{re.sub(r'[^a-zA-Z0-9_]', '_', name).lower()}"

@app.route("/metrics/<slug>")
def metrics(slug):
    try:
        response = requests.get(f'http://{slug}/getvar.csv', timeout=5)
        response.raise_for_status() 
        
        data = response.text
        lines = data.strip().splitlines()
        reader = csv.reader(lines)
        metrics = []
        
        for row in reader:
            if len(row) < 6:
                continue
            metric_name = sanitize_metric_name(row[0])
            value = row[5].strip('"')
            try:
                float(value)
            except ValueError:
                continue
            metrics.append(f'{metric_name} {value}')
            
        return Response('\n'.join(metrics) + '\n', mimetype="text/plain")
        
    except requests.exceptions.RequestException as e:
        error_type = type(e).__name__
        return Response(f'request failed: {error_type} - {str(e)}\n', status=502, mimetype="text/plain")
    except Exception as e:
        error_type = type(e).__name__
        return Response(f'internal error: {error_type}\n', status=500, mimetype="text/plain")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)