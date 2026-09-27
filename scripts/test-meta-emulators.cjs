const { spawnSync } = require('node:child_process');
const env = { ...process.env, GCLOUD_PROJECT: 'demo-dleon', GOOGLE_CLOUD_PROJECT: 'demo-dleon', META_ENABLED: 'false', META_CONSENT_READY: 'false' };
if (!env.FIRESTORE_EMULATOR_HOST || !env.FIRESTORE_EMULATOR_HOST.startsWith('127.0.0.1:')) throw Error('Local emulator required');
for (const files of [
  ['functions/test/inventory.emulator.test.js', 'functions/meta/integration.emulator.test.js'],
  ['test/firestore.rules.test.mjs'],
]) {
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], { env, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status || 1);
}
