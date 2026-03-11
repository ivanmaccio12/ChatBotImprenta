import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function fixEnv() {
    try {
        await ssh.connect({ host: '31.97.31.53', username: 'root', password: '02177123Im.root' });
        console.log("Updating webhook URL in VPS .env to crm-send-final...");
        const cmd = `sed -i 's|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=https://n8n.srv969979.hstgr.cloud/webhook/crm-send-final|' .env && pm2 restart ChatBotImprenta`;
        const result = await ssh.execCommand(cmd, { cwd: '/var/www/ChatBotImprenta' });
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
fixEnv();
