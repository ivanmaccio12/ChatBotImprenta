import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function deploy() {
    try {
        await ssh.connect({ host: '31.97.31.53', username: 'root', password: '02177123Im.root' });
        const result = await ssh.execCommand('git pull origin main && npm install && pm2 restart ChatBotImprenta', { cwd: '/var/www/ChatBotImprenta' });
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
    } finally { ssh.dispose(); }
}
deploy();
