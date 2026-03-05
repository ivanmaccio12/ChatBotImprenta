---
description: Deploy Code to VPS via SSH using Node
---

This workflow describes how to connect via SSH to the user's Hostinger VPS from a Windows environment, since native PowerShell SSH doesn't easily support piping passwords for automated executions.

Whenever you need to deploy or run commands on the VPS without asking the user to do it manually:

1. Create a temporary `deploy_vps.js` script in the current project directory.
2. Install `node-ssh` if it doesn't exist (`npm install node-ssh --no-save`).
3. Run the script using `node deploy_vps.js`.
4. Delete the script after execution for security.

### Template Script (`deploy_vps.js`)
```javascript
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

    // ADD YOUR COMMANDS HERE. Example:
    // const result = await ssh.execCommand('git pull && pm2 restart APP_NAME', { cwd: '/var/www/PROJECT_NAME' });
    // console.log('STDOUT:', result.stdout);
    // if (result.stderr) console.error('STDERR:', result.stderr);

  } catch (error) {
    console.error('Deployment failed:', error);
  } finally {
    ssh.dispose();
  }
}

deploy();
```
