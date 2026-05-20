const os = require('os');

function lanIp() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const ip = lanIp();
const port = process.env.EXPO_PORT || '8081';

console.log('\n  Novapilot — open the app\n');
console.log('  Web (easiest):     npm run web');
console.log('  Expo Go (manual):  exp://' + ip + ':' + port);
console.log('  Metro devtools:    http://localhost:' + port);
console.log('\n  In Expo Go: Projects → Enter URL manually → paste the exp:// link above');
console.log('  For a QR code, run "npm run start" in your own terminal (not background).\n');
