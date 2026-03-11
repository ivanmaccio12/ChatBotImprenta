import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function checkEnv() {
    try {
        await ssh.connect({ host: '31.97.31.53', username: 'root', password: '02177123Im.root' });
        const result = await ssh.execCommand('cat .env | grep N8N', { cwd: '/var/www/ChatBotImprenta' });
        console.log(result.stdout);
    } finally { ssh.dispose(); }
}
checkEnv();
