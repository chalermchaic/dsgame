# Data Cleaner: Outlier Invaders
## คู่มือ Build → Google Play (Step by Step)

---

## ข้อมูลแอป

| ข้อมูล | ค่า |
|--------|-----|
| App ID | `com.momosoft.game.datacleaner` |
| App Name | Data Cleaner: Outlier Invaders |
| Version | 1.0 (versionCode: 1) |
| Min Android | 5.1 (API 22) |
| Target Android | 15 (API 35) |
| ภาษาหลัก | English |

---

## STEP 1 — ทดสอบเกมใน Browser

เปิดไฟล์ `www/index.html` ด้วย Chrome
- เกมทำงาน **ออฟไลน์ได้ 100%** ไม่ต้องเชื่อมอินเทอร์เน็ต
- ทดสอบ: Tap NULL/OUTLIER = ยิงทำลาย, ปล่อย VALID/LOG/IMAGE ตกลงมา = ได้คะแนน

---

## STEP 2 — Sync ไฟล์ล่าสุดเข้า Android (ทำทุกครั้งที่แก้โค้ด)

เปิด CMD/Terminal ใน folder `C:\Users\momo\dev\dsgame` แล้วรัน:
```bash
node --version   # ตรวจว่ามี Node ก่อน
```
เนื่องจาก `npx cap copy` มีปัญหาสิทธิ์ใน environment นี้ ให้ copy ตรงแทน:
```
Copy:  www\index.html       → android\app\src\main\assets\public\index.html
Copy:  www\privacy.html     → android\app\src\main\assets\public\privacy.html
Copy:  www\js\game.js       → android\app\src\main\assets\public\js\game.js
Copy:  www\js\phaser.min.js → android\app\src\main\assets\public\js\phaser.min.js
```
(phaser.min.js ไม่ต้อง copy ซ้ำถ้าไม่ได้เปลี่ยนเวอร์ชัน)

---

## STEP 3 — เปิด Android Studio

1. เปิด **Android Studio**
2. คลิก **Open**
3. เลือก folder: `C:\Users\momo\dev\dsgame\android`
4. รอ Gradle sync (~2-3 นาทีครั้งแรก)
5. ถ้าขึ้น error "SDK not found" → ไปที่ File → Project Structure → SDK Location → ชี้ไปที่ Android SDK

---

## STEP 4 — ตรวจสอบ build.gradle

เปิดไฟล์ `app/build.gradle` ให้มีค่าเหล่านี้:
```gradle
applicationId "com.momosoft.game.datacleaner"
versionCode 1
versionName "1.0"
```
และใน `variables.gradle`:
```gradle
minSdkVersion = 22
compileSdkVersion = 35
targetSdkVersion = 35
```

---

## STEP 5 — Build Debug APK (ทดสอบบนมือถือ)

ใน Android Studio:
1. เมนู **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. รอ ~1-3 นาที
3. APK อยู่ที่: `android\app\build\outputs\apk\debug\app-debug.apk`
4. ย้ายไฟล์ไปมือถือ → ติดตั้ง (ต้องเปิด "ติดตั้งแอปจากแหล่งที่ไม่รู้จัก" ก่อน)
5. **ทดสอบให้ครบ:** เล่นทั้ง Easy/Normal/Hard, ทดสอบ Pause, ทดสอบ Game Over

---

## STEP 6 — สร้าง Keystore (ทำครั้งเดียวตลอดชีพ)

> ⚠️ ไฟล์ .jks นี้สำคัญมาก ถ้าหายจะ update แอปบน Play Store ไม่ได้อีกเลย

เปิด CMD แล้วรัน:
```bash
keytool -genkey -v -keystore C:\Users\momo\datacleaner-release.jks -alias datacleaner -keyalg RSA -keysize 2048 -validity 10000
```
ระบุข้อมูลที่ถามดังนี้:
- **First and Last Name:** ชื่อคุณหรือชื่อแอป
- **Organizational Unit:** (กด Enter ข้ามได้)
- **Organization:** ชื่อที่ใช้สมัคร Play
- **City:** Bangkok
- **State:** Bangkok
- **Country Code:** TH
- **Password:** จำให้ได้! (ตั้ง 8+ ตัวอักษร)

เก็บไฟล์ `datacleaner-release.jks` ไว้ที่ `C:\Users\momo\` (นอก project folder)

---

## STEP 7 — Build Release AAB สำหรับ Google Play

ใน Android Studio:
1. เมนู **Build → Generate Signed Bundle / APK**
2. เลือก **Android App Bundle** (`.aab`) → Next
3. Key store path → Browse → เลือก `datacleaner-release.jks`
4. ใส่ Key store password และ Key alias password
5. เลือก **release** build variant → Finish
6. รอ ~2-5 นาที
7. ไฟล์อยู่ที่: `android\app\release\app-release.aab`

> ✅ `.aab` ดีกว่า `.apk` สำหรับ Play Store เพราะ Google จะ optimize ขนาดไฟล์ให้เอง

---

## STEP 8 — เตรียม Store Assets (ภาพและข้อความ)

### ภาพที่ต้องเตรียม
| ภาพ | ขนาด | วิธีทำ |
|-----|------|--------|
| App Icon | **512×512 PNG** | Pixel art หุ่นยนต์ของเกม ใช้ Canva หรือ Photoshop |
| Feature Graphic | **1024×500 PNG** | Screenshot เกม + ชื่อ + พื้นหลังสีเข้ม |
| Screenshots (โทรศัพท์) | **อย่างน้อย 2 ภาพ** (9:16) | Capture จาก emulator หรือมือถือ |

### วิธีถ่าย Screenshot จาก Emulator
1. รัน debug APK บน Android Emulator ใน Android Studio
2. กด Camera icon ด้านข้าง emulator
3. บันทึกภาพ (ต้องการอย่างน้อย 2 ภาพ: หน้าเมนู + หน้าเล่นเกม)

### Short Description (80 ตัวอักษร)
```
Shoot NULL & Outliers! Retro arcade data cleaning game 🎮
```

### Full Description (copy ไปวางใน Play Console)
```
🎮 DATA CLEANER: OUTLIER INVADERS 🎮

คุณคือ Data Engineer — ภารกิจคือรักษาความสะอาดของ Data Pipeline!

NULL values และ OUTLIER anomalies กำลังรุกรานระบบ — แตะเพื่อยิงทำลาย
ด้วย CLEANER BLASTER ก่อนที่มันจะทะลุผ่านไป!

แต่ระวัง — อย่ายิง VALID data, LOG entries หรือ IMAGE files
ปล่อยให้มันตกลงสู่ SCORE ZONE ด้านล่าง

━━━ FEATURES ━━━
• Retro Pixel Art arcade style
• 3 ระดับความยาก: EASY (5❤) / NORMAL (3❤) / HARD (3❤)
• ระบบ Pause ได้ทุกเมื่อ
• Score Multiplier สูงสุด x10 จาก combo
• ⚠ Warning เมื่อ bad data ใกล้หลุดออก
• เสียงชิปทูนสไตล์เกมยุค 80s
• บันทึก High Score ไว้ในเครื่อง
• ไม่ต้องใช้อินเทอร์เน็ต เล่นออฟไลน์ได้

━━━ HOW TO PLAY ━━━
💥 แตะ NULL หรือ OUTLIER → ยิงทำลาย → ได้คะแนน × multiplier
✅ ปล่อย VALID / LOG_OK / IMAGE ตกลงมา → ได้คะแนน bonus
❤ พลาด 3 ครั้ง = Game Over
⚡ Speed เพิ่มขึ้นทุก level — อยู่ได้นานแค่ไหน?

เหมาะสำหรับ data scientists, developers และทุกคนที่ชอบ arcade games!
```

---

## STEP 9 — สร้างแอปใน Google Play Console

ไปที่: https://play.google.com/console

1. คลิก **"Create app"**
2. กรอกข้อมูล:
   - App name: `Data Cleaner: Outlier Invaders`
   - Default language: **English (United States)**
   - App or Game: **Game**
   - Free or Paid: **Free**
3. ติ๊ก checkbox ยืนยัน 2 อัน → คลิก **Create app**

---

## STEP 10 — กรอก Store Listing

เมนูซ้าย → **Grow → Store presence → Main store listing**

- **App name:** Data Cleaner: Outlier Invaders
- **Short description:** (วางข้อความจาก STEP 8)
- **Full description:** (วางข้อความจาก STEP 8)
- อัปโหลดภาพทั้งหมด (Icon, Feature Graphic, Screenshots)
- คลิก **Save**

---

## STEP 11 — ตั้งค่า Privacy Policy

เมนูซ้าย → **Policy → App content → Privacy policy**

URL ของ Privacy Policy — ต้องเป็น URL สาธารณะ เช่น:
1. **ง่ายที่สุด:** สร้าง GitHub repository → เอาไฟล์ `www/privacy.html` ขึ้น → เปิด GitHub Pages
   - URL จะได้เป็น: `https://[username].github.io/[repo]/privacy.html`
2. หรือใช้เว็บฟรี เช่น https://sites.google.com แล้ว copy เนื้อหาจาก `privacy.html` ไปวาง

---

## STEP 12 — Content Rating (IARC)

เมนูซ้าย → **Policy → App content → Content ratings**

1. คลิก **Start questionnaire**
2. หมวด: **Games**
3. ตอบคำถาม:
   - Violence: **ไม่มี** (ไม่มีความรุนแรงจริง แค่ pixel explosion)
   - Sexual content: **ไม่มี**
   - Language: **ไม่มี**
   - Controlled substances: **ไม่มี**
   - User interaction (multiplayer, chat): **ไม่มี**
4. ผลลัพธ์จะได้ Rating: **Everyone / PEGI 3**

---

## STEP 13 — Data Safety

เมนูซ้าย → **Policy → App content → Data safety**

กรอกดังนี้:
- **Does your app collect or share any of the required user data types?** → **No**
- **Is all of the user data collected by your app encrypted in transit?** → N/A
- **Do you provide a way for users to request that their data is deleted?** → N/A
- คลิก **Save**

---

## STEP 14 — App Access

เมนูซ้าย → **Policy → App content → App access**

เลือก: **All functionality is available without special access**

---

## STEP 15 — Ads Declaration

เมนูซ้าย → **Policy → App content → Ads**

เลือก: **No, my app does not contain ads**

---

## STEP 16 — อัปโหลด AAB และ Submit

1. เมนูซ้าย → **Release → Production**
2. คลิก **Create new release**
3. อัปโหลดไฟล์ `app-release.aab`
4. **Release name:** 1.0
5. **Release notes (What's new):**
   ```
   Initial release — Data Cleaner: Outlier Invaders v1.0
   Shoot NULL & Outlier data in this retro arcade game!
   3 difficulty levels: Easy, Normal, Hard
   ```
6. คลิก **Save** → **Review release**
7. ถ้าผ่านทุก checkmark สีเขียว → คลิก **Start rollout to Production**

---

## STEP 17 — รอ Review

⏱ Google review ครั้งแรก: **3-7 วัน** (บางครั้ง 24 ชม.)

ระหว่างรอ Google จะส่ง email แจ้งผล:
- **Approved** → แอปขึ้น Store อัตโนมัติ 🎉
- **Rejected** → จะบอกเหตุผล แก้แล้ว submit ใหม่ได้

---

## Checklist ก่อน Submit

- [ ] ทดสอบ debug APK บนมือถือจริงแล้ว ทุก feature ทำงานได้
- [ ] ทดสอบ Easy / Normal / Hard ครบ
- [ ] ทดสอบ Pause ทำงาน
- [ ] App Icon 512×512 PNG พร้อม
- [ ] Feature Graphic 1024×500 PNG พร้อม
- [ ] Screenshots อย่างน้อย 2 ภาพ พร้อม
- [ ] Privacy Policy มี URL สาธารณะแล้ว
- [ ] Content Rating questionnaire กรอกแล้ว
- [ ] Data Safety กรอกแล้ว (No data collected)
- [ ] Ads declaration กรอกแล้ว (No ads)
- [ ] Release AAB signed ด้วย release keystore แล้ว
- [ ] Store Listing กรอกครบ (description + ภาพ)

---

## คำสั่งที่ใช้บ่อย

```bash
# ใน folder C:\Users\momo\dev\dsgame

# หลังแก้โค้ดในไฟล์ www/ แล้วต้องการ sync ไป Android:
npx cap copy

# เปิด Android Studio ตรงๆ:
npx cap open android
```

---

## ถ้า Google Reject ให้เช็คสิ่งเหล่านี้ก่อน

| สาเหตุที่พบบ่อย | วิธีแก้ |
|----------------|---------|
| Privacy Policy URL ใช้ไม่ได้ | ตรวจว่า URL เข้าถึงได้จากภายนอก (ลอง Incognito mode) |
| Target SDK ต่ำเกินไป | `targetSdkVersion` ต้อง 34+ (ตรวจใน `variables.gradle`) |
| App ล่มหรือ crash | ทดสอบบนมือถือจริงก่อน submit |
| Icon ไม่ตรงขนาด | ต้องเป็น PNG 512×512 ไม่มี alpha border ขาว |
| Screenshot ไม่ตรงสัดส่วน | ต้องเป็น 9:16 หรือ 16:9 เท่านั้น |
