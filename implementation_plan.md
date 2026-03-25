Fix Android Build Black Screen
The game is not showing up on Android because the 
index.html
 file attempts to load the Phase.js game engine from an external CDN (https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js). WebViews inside Capacitor often restrict or fail to load external scripts due to security features (CORS, unverified external domains) or because the device might not have internet access the moment the app opens. When Phaser fails to load, the game logic throws an error and displays a black screen.

Proposed Changes

1. Download Phaser Locally ✅ DONE (2026-03-25)
Downloaded phaser.min.js (1.2 MB) from CDN into www/js/phaser.min.js

2. Update HTML Reference ✅ DONE (2026-03-25)
Updated www/index.html to use local js/phaser.min.js instead of CDN URL.

3. Sync to Android ✅ DONE (2026-03-25)
Ran `cap copy android` — phaser.min.js now bundled at android/app/src/main/assets/public/js/phaser.min.js

Verification Plan
Automated Tests
Run npx cap copy and check that android/app/src/main/assets/public/js/phaser.min.js exists.

Manual Verification
Open Android Studio and rebuild the APK.
Install the APK on a real Android device or emulator.
Ensure the device has internet disabled (Airplane mode), and launch the app.
Verify the game loads correctly without a black screen, proving the local bundle works flawlessly.
