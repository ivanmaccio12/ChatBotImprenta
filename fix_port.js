import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function fixSotoPadilla() {
    try {
        await ssh.connect({
            host: '31.97.31.53',
            username: 'root',
            password: '02177123Im.root'
        });
        console.log("Updating SotoPadillaBot .env to PORT=3005...");
        // Update .env file in SotoPadillaBot directory
        await ssh.execCommand("sed -i 's/^PORT=.*/PORT=3005/' .env || echo 'PORT=3005' >> .env", { cwd: '/var/www/EstudioJuridicoSotoPadilla' });

        console.log("Restarting SotoPadillaBot...");
        await ssh.execCommand('pm2 restart SotoPadillaBot');

        // Wait for 3 seconds
        await new Promise(r => setTimeout(r, 3000));

        console.log("\nChecking PM2 processes again...");
        const pm2List = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(pm2List.stdout);
        apps.forEach(app => console.log(`- ${app.name} PID: ${app.pid} | Status: ${app.pm2_env.status}`));

        // Run lsof -i -P -n | grep LISTEN to see what is mapped exactly
        console.log("\nCurrent Port Mapping:");
        const ports = await ssh.execCommand('lsof -i -P -n | grep LISTEN');
        console.log(ports.stdout);

    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
fixSotoPadilla();
