ส่วนที่ 1: สร้างไฟล์ README.md

ในโฟลเดอร์โปรเจกต์ Expo ของคุณ ให้สร้างไฟล์ชื่อ README.md (ถ้ามีอยู่แล้วให้ลบของเดิมทิ้ง) แล้วก๊อปปี้ข้อความด้านล่างนี้ไปวางได้เลยค่ะ จัดรูปแบบมาให้ดูเป็นมืออาชีพเรียบร้อยแล้ว:

Markdown
# 📱 Smart IoT Dashboard (React Native + Expo)

A modern, real-time IoT Dashboard application built with React Native (Expo) and TypeScript. This application connects to an ESP32 microcontroller via MQTT (HiveMQ Cloud) to monitor environmental sensors and control smart devices in real-time.

## ✨ Features

- **Real-time Monitoring:** Displays live data from DHT22 (Temperature, Humidity) and MQ2 (Gas/Smoke) sensors.
- **Smart Controls:** Features a dedicated "Controls Menu" using sliders for precise device management (e.g., LED Brightness, Fan Speed, Gas Alarm Threshold).
- **Modern UI/UX:** Clean, responsive, and user-friendly interface with tab navigation and visual status indicators.
- **Secure Connection:** Uses MQTT over WebSockets (WSS) with SSL/TLS encryption for secure data transmission.

## 🛠️ Technology Stack

- **Frontend:** React Native, Expo, TypeScript
- **MQTT Client:** `paho-mqtt`
- **UI Components:** `@react-native-community/slider`, `@expo/vector-icons`
- **Cloud Broker:** HiveMQ Cloud
- **Hardware (Simulation):** ESP32 via Wokwi

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine
- Expo CLI (`npm install -g expo-cli`)
- A HiveMQ Cloud account (or any MQTT broker supporting WebSockets)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   cd your-repo-name
Install dependencies:

Bash
npm install
Environment Setup:
Create a .env file in the root directory and add your MQTT credentials:

ข้อมูลโค้ด
EXPO_PUBLIC_MQTT_SERVER=your-hivemq-cluster-url.hivemq.cloud
EXPO_PUBLIC_MQTT_PORT=8884
EXPO_PUBLIC_MQTT_USER=your_username
EXPO_PUBLIC_MQTT_PASS=your_password
(Note: HiveMQ requires port 8884 for WebSocket connections)

Run the application:

Bash
npm start
Press a to run on an Android emulator, i for iOS simulator, or scan the QR code with the Expo Go app on your physical device.

📡 MQTT Topics
Subscribe (Data Input): project/sensor/data (Expects JSON format: {"temp": 24.5, "hum": 60, "gas": 400})

Publish (Controls): - project/led/dimmer (Value: 0-255)

project/fan/speed (Value: 0-100)

project/gas/threshold (Value: 0-4095)

🔒 Security Note
The .env file containing sensitive MQTT credentials is included in .gitignore and will not be uploaded to the repository. Please ensure you create your own .env file locally.


---

### **ส่วนที่ 2: ขั้นตอนการอัปโหลดขึ้น GitHub**

**สำคัญมาก:** ก่อนอัปโหลด ให้เช็กไฟล์ `.gitignore` ในโปรเจกต์ดูก่อนนะคะว่ามีบรรทัดที่เขียนว่า `.env` อยู่ไหม (ปกติ Expo จะใส่มาให้แล้ว) เพื่อป้องกันไม่ให้รหัสผ่าน MQTT ของเราหลุดไปโชว์บนเน็ตค่ะ

ถ้าพร้อมแล้ว เปิด Terminal ใน VS Code (ตรวจสอบให้แน่ใจว่าอยู่ในโฟลเดอร์โปรเจกต์ `iot-dashboard`) แล้วทำตามทีละคำสั่งเลยค่ะ:

**1. เริ่มต้นระบบ Git (ถ้ายังไม่ได้ทำ):**
```bash
git init
2. บันทึกไฟล์ทั้งหมดลงในระบบ (ยกเว้นไฟล์ที่อยู่ใน .gitignore):

Bash
git add .
3. ยืนยันการบันทึกพร้อมเขียนคำอธิบาย:

Bash
git commit -m "Initial commit: Add IoT Dashboard UI, Slider Controls, and MQTT connection"
4. เปลี่ยนชื่อ Branch หลักเป็น main (มาตรฐานใหม่ของ GitHub):

Bash
git branch -M main
5. เชื่อมต่อกับคลังข้อมูล (Repository) บน GitHub:
(ขั้นตอนนี้คุณต้องไปสร้าง Repository เปล่าๆ ในเว็บ GitHub ของคุณก่อนนะคะ แล้วเอารหัส URL มาใส่แทนที่คำว่า https://github.com/YourUsername/YourRepoName.git)

Bash
git remote add origin https://github.com/YourUsername/YourRepoName.git
6. ดันไฟล์ขึ้น GitHub เลย!

Bash
git push -u origin main
