module.exports = {
  apps: [
    {
      name: 'waybill-dashboard',
      cwd: '/home/teccjm/waybill-tracking/frontend/dashboard',
      script: 'npx',
      args: 'vite --port 3010 --host',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/teccjm/.pm2/logs/dashboard-error.log',
      out_file: '/home/teccjm/.pm2/logs/dashboard-out.log',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true,
    },
  ],
}
