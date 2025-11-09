module.exports = {
    apps: [{
        name: 'jiecool-frontend',
        script: 'npm',
        args: 'start',
        cwd: './front-web',
        instances: 1,           // 进程实例数量
        autorestart: true,      // 自动重启
        watch: false,           // 不监听文件变化（生产环境推荐）
        max_memory_restart: '1G', // 内存超过 1GB 时重启
        env: {
            NODE_ENV: 'production',
            PORT: 53000
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,             // 日志包含时间戳
        env_development: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 53000
        }
    }]
};