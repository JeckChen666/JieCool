module.exports = {
    apps: [{
        name: 'jiecool-frontend',
        script: 'npm',
        args: 'start',
        cwd: './front-web',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env_file: './front-web/.env.production',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};