FROM denoland/deno:2.3.7
EXPOSE 9000
WORKDIR /app
USER deno
COPY . .
RUN deno cache main.ts
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
