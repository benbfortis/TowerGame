// cap-android-deploy.mjs — full build + install + launch on a connected device.
// Usage: npm run cap:android:deploy
import { execSync } from 'child_process';

const APP_ID = 'com.towergame.app';

function run(cmd, opts = {}) {
  console.log(`\n[deploy] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

run('npm run cap:sync');
run('cd android && gradlew.bat assembleDebug');
run('adb install -r android\\app\\build\\outputs\\apk\\debug\\app-debug.apk');
run(`adb shell am start -n ${APP_ID}/${APP_ID}.MainActivity`);
console.log('\n[deploy] Done — app launched on device.');
