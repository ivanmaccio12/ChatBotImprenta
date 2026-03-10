import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '31.97.31.53',
            username: 'root',
            password: '02177123Im.root'
        });
        console.log('Connected!');

        console.log('Executing deployment commands on VPS...');
        // Drop local changes inside the VPS before pulling to avoid merge conflicts
        const commands = `
          git fetch origin main &&
          git reset --hard origin/main &&
          npm install &&
          pm2 restart ChatBotImprenta
        `;
        const result = await ssh.execCommand(commands, { cwd: '/var/www/ChatBotImprenta' });
        console.log('STDOUT:', result.stdout);
        if (result.stderr) console.error('STDERR:', result.stderr);

        console.log('Successfully deployed to VPS.');
    } catch (error) {
        console.error('Deployment failed:', error);
    } finally {
        ssh.dispose();
    }
}

deploy();
