# Data Cleaner: Outlier Invaders
## Build Guide — Android APK → Google Play

---

## Project Structure

```
dsgame/
├── www/                        ← Web game (HTML + Phaser.js)
│   ├── index.html
│   └── js/game.js
├── android/                    ← Capacitor Android project (open in Android Studio)
├── capacitor.config.json       ← App ID: com.datascience.datacleaner
├── package.json
└── README_BUILD.md             ← You are here
```

---

## STEP 1 — Test the game in browser (30 seconds)

Open `www/index.html` in Chrome browser.
The game loads from CDN (needs internet first time).

**Controls:**
- TAP / CLICK on NULL or OUTLIER items to destroy them → +50pts × multiplier
- Let VALID / LOG_OK / IMAGE_01 fall to the SCORE ZONE → +points
- Miss 3 bad items = Game Over

---

## STEP 2 — Open Android project in Android Studio

1. Open **Android Studio**
2. Click **"Open"**
3. Navigate to: `C:\Users\momo\dev\dsgame\android`
4. Click **OK** and wait for Gradle sync (~2-3 min first time)

---

## STEP 3 — Fix package name (if needed)

In Android Studio, open `app/build.gradle` and verify:
```gradle
applicationId "com.datascience.datacleaner"
```

In `app/src/main/java/`, make sure there is a class at:
`com/datascience/datacleaner/MainActivity.java`

---

## STEP 4 — Update the game files (after any code changes)

When you edit `www/js/game.js`, run this in the `dsgame` folder:
```bash
npx cap copy
```
This syncs your web files into the Android project.

---

## STEP 5 — Build Debug APK (test on your phone)

In Android Studio:
1. Menu → **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait ~1-2 min
3. APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Copy to phone and install (enable "Install from unknown sources")

---

## STEP 6 — Create Keystore (ONE TIME — keep this file safe!)

In Android Studio terminal or CMD:
```bash
keytool -genkey -v -keystore datacleaner-release.jks -alias datacleaner -keyalg RSA -keysize 2048 -validity 10000
```
- Save `datacleaner-release.jks` somewhere SAFE (not inside the project)
- Remember the password!

---

## STEP 7 — Build RELEASE APK / AAB for Google Play

### Option A: Android Studio GUI
1. Menu → **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** ← Google Play prefers this
3. Select your keystore, enter passwords
4. Choose **release** build variant
5. Click **Finish**
6. AAB is at: `android/app/release/app-release.aab`

### Option B: Command line
```bash
cd android
./gradlew bundleRelease
# Then sign it:
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore datacleaner-release.jks \
  app/build/outputs/bundle/release/app-release.aab datacleaner
```

---

## STEP 8 — Google Play Console Setup

Go to: https://play.google.com/console

### Create new app:
1. Click **"Create app"**
2. App name: `Data Cleaner: Outlier Invaders`
3. Language: English
4. App or Game: **Game**
5. Free or Paid: **Free**

### Required Store Listing assets:
| Asset | Size | Notes |
|-------|------|-------|
| App icon | 512×512 PNG | Use the pixel art robot icon |
| Feature graphic | 1024×500 PNG | Game screenshot with title |
| Screenshots (phone) | Min 2, 16:9 or 9:16 | Take from emulator/phone |
| Short description | Max 80 chars | "Shoot data bugs! Retro arcade data cleaning game" |
| Full description | Max 4000 chars | See below |

### App description (copy-paste):
```
🎮 DATA CLEANER: OUTLIER INVADERS 🎮

A retro arcade game where YOU are the Data Engineer!

Bad data is invading your pipeline — NULL values and OUTLIER anomalies
are falling fast. Tap to destroy them with your CLEANER BLASTER before
they corrupt your database!

But careful — don't shoot the VALID data, LOG entries, or IMAGE files.
Let those fall safely to the SCORE ZONE below.

FEATURES:
• Retro pixel art arcade style
• Progressive difficulty — gets faster each level
• Score multiplier for consecutive correct shots
• 3 lives system — don't miss the bad data!
• High score tracking
• Satisfying explosion effects & chip-tune sounds

Perfect for data science fans, developers, and arcade game lovers!

HOW TO PLAY:
• TAP NULL or OUTLIER items to blast them → earn points
• Don't tap VALID / LOG / IMAGE items → let them score automatically
• Build a combo multiplier for bonus points
• Survive as long as you can!
```

### Content Rating:
- IARC questionnaire: Select "Everyone" (no violence, no mature content)

### Privacy Policy:
You MUST have a privacy policy URL. Create a simple one at:
- https://www.privacypolicygenerator.info/
- Or host a simple text at GitHub Pages

Example minimal policy:
```
This app does not collect any personal data.
High scores are stored locally on your device only.
No internet connection required after first load.
```

---

## STEP 9 — Submit for Review

1. Fill in all required sections in Play Console (green checkmarks)
2. Go to **Release → Production → Create new release**
3. Upload your `.aab` file
4. Write release notes: "Initial release"
5. Click **"Review release"**
6. Click **"Start rollout to Production"**

⏱ Google review takes **2-7 days** for new apps.

---

## Checklist before submitting:

- [ ] Game tested on real Android phone
- [ ] App icon 512×512 ready
- [ ] Feature graphic 1024×500 ready
- [ ] At least 2 phone screenshots ready
- [ ] Privacy policy URL ready
- [ ] Content rating questionnaire filled
- [ ] Release APK/AAB signed with release keystore
- [ ] App description written

---

## Package / App ID

```
App ID:   com.datascience.datacleaner
Version:  1.0 (versionCode: 1)
Min SDK:  Android 5.0 (API 21)
Target:   Android 14 (API 34)
```

---

## Quick Commands Reference

```bash
# After editing www/ files:
npx cap copy

# Open in Android Studio:
npx cap open android

# Full sync (when adding Capacitor plugins):
npx cap sync
```
