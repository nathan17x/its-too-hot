import requests
from flask import Flask, Response
import csv
import re

app = Flask(__name__)

def sanitize_metric_name(name):
    return f"hvac_{re.sub(r'[^a-zA-Z0-9_]', '_', name).lower()}"

@app.route("/metrics/<slug>")
def metrics(slug):
    data = requests.get(f'http://{slug}/getvar.csv').text
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
  
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
    
