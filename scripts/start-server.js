const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [
  path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next'),
  'start',
  '-p', '3000'
], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  env: { ...process.env }
});

server.stdout.on('data', d => process.stdout.write(d));
server.stderr.on('data', d => process.stderr.write(d));

server.on('exit', code => {
  console.log(`server exited with code ${code}`);
});

// Keep-alive
setInterval(() => {}, 60000);

console.log(`Server PID: ${server.pid}`);
