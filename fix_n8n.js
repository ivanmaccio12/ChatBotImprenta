import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function fixN8n() {
    try {
        await ssh.connect({ host: '31.97.31.53', username: 'root', password: '02177123Im.root' });
        console.log("Restarting n8n docker container...");

        // There might be multiple containers, usually it's root-n8n-1 or n8n
        let result = await ssh.execCommand('docker restart root-n8n-1 || docker restart n8n');
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);

        console.log("Waiting 10 seconds for n8n to start...");
        await new Promise(r => setTimeout(r, 10000));

        console.log("Verifying logs...");
        result = await ssh.execCommand('docker logs --tail 20 root-n8n-1', { timeout: 5000 });
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
    } catch (err) {
        console.error(err);
    } finally { ssh.dispose(); }
}
fixN8n();
