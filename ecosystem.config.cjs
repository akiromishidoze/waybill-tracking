module.exports = {
  apps: [
    {
      name: 'waybill-mock-api',
      script: 'scripts/mock-api.js',
      cwd: '/home/teccjm/Desktop/waybill-tracking',
      interpreter: 'node',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'waybill-dashboard',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0',
      cwd: '/home/teccjm/Desktop/waybill-tracking/frontend/dashboard',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
