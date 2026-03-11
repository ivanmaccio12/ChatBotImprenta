import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function fixBuild() {
    try {
        await ssh.connect({ host: '31.97.31.53', username: 'root', password: '02177123Im.root' });
        console.log("Rebuilding frontend on VPS...");
        const result = await ssh.execCommand('cd frontend && npm install && npm run build', { cwd: '/var/www/ChatBotImprenta' });
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);

        console.log("\nRestarting PM2...");
        await ssh.execCommand('pm2 restart ChatBotImprenta', { cwd: '/var/www/ChatBotImprenta' });
    } catch (err) {
        console.error(err);
    } finally { ssh.dispose(); }
}
fixBuild();
