const { exec } = require('child_process');

const ports = [3000, 4200, 4202, 8080, 8081];
let completed = 0;

ports.forEach(port => {
  // Try fuser first (more portable)
  exec(`fuser -k ${port}/tcp 2>/dev/null || pkill -f "port.*${port}" || true`, (err) => {
    completed++;
    if (completed === ports.length) {
      console.log('All ports cleared.');
    }
  });
});
