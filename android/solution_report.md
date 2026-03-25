# รายงานการแก้ไขปัญหา (Solution Report)

## 1. ปัญหา: แอปค้าง/เด้งตอนเริ่มต้น (IllegalStateException)

### **ปัญหาที่พบ (Problem)**
เมื่อเปิดแอปพลิเคชันจะเกิดข้อผิดพลาด:
`java.lang.IllegalStateException: You need to use a Theme.AppCompat theme (or descendant) with this activity.`

### **สาเหตุ (Cause)**
เนื่องจาก `MainActivity` สืบทอดมาจาก `AppCompatActivity` ซึ่งจำเป็นต้องใช้ธีมที่เป็นตระกูล `AppCompat` แต่ในไฟล์ `AndroidManifest.xml` มีการกำหนดธีมเป็น `Theme.SplashScreen` โดยที่ยังไม่ได้ตั้งค่าการสลับธีมหลังจากแสดงหน้า Splash Screen เสร็จสิ้น

### **วิธีแก้ไข (Solution)**
1.  **ใน `styles.xml`**: ปรับแต่งธีม `AppTheme.NoActionBarLaunch` โดยเพิ่ม `postSplashScreenTheme` เพื่อระบุธีมหลักที่จะใช้หลังจากจบหน้าโหลด
2.  **ใน `MainActivity.java`**: เรียกใช้งาน `SplashScreen.installSplashScreen(this)` ก่อนคำสั่ง `super.onCreate()` เพื่อเปิดใช้งานระบบ Splash Screen ของ Android 12+

---

## 2. ปัญหา: เกมไม่แสดงผล (หน้าจอขาว)

### **ปัญหาที่พบ (Problem)**
หลังจากแอปเปิดได้แล้ว หน้าจอไม่แสดงผลตัวเกม (Phaser Game) แต่แสดงเป็นหน้าจอว่างเปล่าหรือมีแถบเมนูสีม่วงด้านบน

### **สาเหตุ (Cause)**
1.  **WebView Configuration**: ตัว WebView ยังไม่ได้ถูกตั้งค่าให้รองรับการทำงานของเกม เช่น ไม่ได้เปิด JavaScript หรือ DOM Storage
2.  **Asset Path**: ไม่ได้ระบุตำแหน่งของไฟล์เกม (`index.html`) ที่ถูกต้อง
3.  **UI Overlay**: มี Action Bar (แถบสีม่วง) ของธีมพื้นฐานบดบังหน้าจอ

### **วิธีแก้ไข (Solution)**
1.  **ปรับปรุง WebView**: ใน `MainActivity.java` ได้เพิ่มการตั้งค่า:
    *   `setJavaScriptEnabled(true)`: เพื่อให้ Engine ของเกมทำงานได้
    *   `setDomStorageEnabled(true)`: เพื่อให้เกมบันทึกข้อมูล (เช่น Hi-Score) ได้
    *   `loadUrl("file:///android_asset/www/index.html")`: เปลี่ยนไปโหลดไฟล์จากหน่วยความจำภายในเครื่อง
2.  **ปรับปรุงธีม (Full Screen)**: แก้ไข `styles.xml` ให้ `AppTheme` ใช้ Parent เป็น `Theme.AppCompat.DayNight.NoActionBar` และตั้งค่า `android:windowFullscreen` เป็น `true` เพื่อให้เกมแสดงผลเต็มหน้าจอ

---

## สรุปไฟล์ที่ถูกแก้ไข
*   `android/app/src/main/java/com/datascience/datacleaner/MainActivity.java` (Logic & WebView)
*   `android/app/src/main/res/values/styles.xml` (UI & Theme)
*   `android/app/src/main/res/layout/activity_main.xml` (ID Webview)
