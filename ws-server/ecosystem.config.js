module.exports = {
  apps: [
    {
      name: "hubview-ws-multiplayer",
      script: "./index.js",
      instances: 1, // WebSockets geralmente não lidam bem com modo cluster (max) sem o adaptador Redis, deixe 1.
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3002
      },
      // Logs configuration (muito útil no Windows)
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
