FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 9000
CMD ["gunicorn", "--bind", "0.0.0.0:9000", "carel_exporter:app"]