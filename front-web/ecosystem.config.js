module.exports = {
    apps: [{
        name: 'jiecool-frontend',
        script: 'npm',
        args: 'run start:prod',  // 使用明确指定环境的脚本
        cwd: './front-web',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};