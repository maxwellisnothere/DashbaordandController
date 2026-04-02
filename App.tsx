import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Paho from 'paho-mqtt';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// กำหนดธีมสี
const COLORS = {
  primary: '#1A237E', // น้ำเงินเข้มทันสมัย
  accent: '#FF4081',  // ชมพูสดสำหรับเน้น
  background: '#F0F2F5', // เทาอ่อนพื้นหลัง
  white: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  online: '#4CAF50',
  offline: '#F44336',
  cardBackground: '#FFFFFF',
};

// กดยืนยันการวางโค้ดทั้งหมดทับ App.tsx เดิมได้เลยค่ะ
export default function App() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Controls'>('Dashboard');
  const [temp, setTemp] = useState<number | string>('--');
  const [hum, setHum] = useState<number | string>('--');
  const [gas, setGas] = useState<number | string>('--');
  const [isConnected, setIsConnected] = useState(false);

  // ค่าสำหรับ Controls (Sliders)
  const [ledBrightness, setLedBrightness] = useState(255); // 0-255
  const [fanSpeed, setFanSpeed] = useState(0); // 0-100 (สมมติว่ามีพัดลม)
  const [gasThreshold, setGasThreshold] = useState(1500); // 0-4095
  
  const clientRef = useRef<Paho.Client | null>(null);

  // Topics
  const topicSubscribe = "project/sensor/data";
  const topicPublishLED = "project/led/dimmer"; // ** topic ใหม่สำหรับสไลด์บาร์ **
  const topicPublishFan = "project/fan/speed";  // ** topic ใหม่สมมติ **
  const topicPublishGasLimit = "project/gas/threshold"; // ** topic ใหม่สมมติ **

  useEffect(() => {
    // --- MQTT Setup เหมือนเดิม ---
    const server = process.env.EXPO_PUBLIC_MQTT_SERVER || '';
    const port = Number(process.env.EXPO_PUBLIC_MQTT_PORT) || 8884;
    const user = process.env.EXPO_PUBLIC_MQTT_USER || '';
    const pass = process.env.EXPO_PUBLIC_MQTT_PASS || '';
    const clientId = `ExpoApp_${Math.random().toString(16).slice(2)}`;
    
    const client = new Paho.Client(server, port, "/mqtt", clientId);
    clientRef.current = client;

    client.onConnectionLost = (responseObject: any) => {
      setIsConnected(false);
      console.log("Connection Lost: ", responseObject.errorMessage);
    };

    client.onMessageArrived = (message: any) => {
      if (message.destinationName === topicSubscribe) {
        try {
          const data = JSON.parse(message.payloadString);
          setTemp(data.temp);
          setHum(data.hum);
          setGas(data.gas);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    };

    client.connect({
      userName: user,
      password: pass,
      useSSL: true,
      onSuccess: () => {
        console.log("MQTT Connected! ✅");
        setIsConnected(true);
        client.subscribe(topicSubscribe);
      },
      onFailure: (err: any) => {
        console.log("Connection Failed: ", err.errorMessage);
      }
    });

    return () => {
      if (clientRef.current?.isConnected()) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // ฟังก์ชันส่งค่า MQTT (เมื่อเลื่อนสไลด์บาร์)
  const publishMqtt = (topic: string, value: string | number) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      const message = new Paho.Message(String(value));
      message.destinationName = topic;
      clientRef.current.send(message);
      console.log(`Sent to ${topic}: ${value}`);
    }
  };

  // --- คอมโพเนนต์การ์ดข้อมูล (สำหรับ Dashboard) ---
  const DataCard = ({ icon, title, value, unit, color }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={30} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardUnit}>{unit}</Text>
      </View>
    </View>
  );

  // --- คอมโพเนนต์สไลด์บาร์ (สำหรับ Controls) ---
  const ControlSlider = ({ icon, title, value, unit, min, max, step, onValueChange, onSlidingComplete }: any) => (
    <View style={styles.controlCard}>
      <View style={styles.controlHeader}>
        <MaterialCommunityIcons name={icon} size={26} color={COLORS.primary} />
        <Text style={styles.controlCardTitle}>{title}</Text>
        <Text style={styles.controlCardValue}>{value} {unit}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.textSecondary}
        thumbTintColor={COLORS.accent}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
      />
    </View>
  );

  // --- ส่วนหน้าจอ Dashboard ---
  const DashboardView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.viewHeader}>Dashboard</Text>
      
      {/* สถานะการเชื่อมต่อ */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusOnline, !isConnected && styles.statusOffline]}>
          <MaterialCommunityIcons name={isConnected ? "signal" : "signal-off"} size={16} color={isConnected ? COLORS.online : COLORS.offline} />
          {isConnected ? "🟢 Connected to HiveMQ" : "🔴 Disconnected <ActivityIndicator />"}
        </Text>
      </View>

      {/* Grid ของข้อมูล Sensor */}
      <View style={styles.dataGrid}>
        <DataCard icon="thermometer" title="Temperature" value={temp} unit="°C" color="#FF5722" />
        <DataCard icon="water-percent" title="Humidity" value={hum} unit="%" color="#2196F3" />
        <DataCard icon="smoke-detector" title="Gas Level" value={gas} unit="(0-4095)" color="#673AB7" />
        {/* เพิ่มการ์ดสมมติเพื่อแสดง Grid สวยงาม */}
        <DataCard icon="weather-windy" title="Air Quality" value="Good" unit="" color="#4CAF50" />
      </View>
    </ScrollView>
  );

  // --- ส่วนหน้าจอ Controls (Menu เฉพาะควบคุม) ---
  const ControlsView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.viewHeader}>Controls Menu</Text>
      
      {/* สไลด์บาร์ควบคุม LED (ปรับความสว่าง) */}
      <ControlSlider 
        icon="lightbulb-outline" title="LED Brightness" 
        value={ledBrightness} unit="" min={0} max={255} step={1} 
        onValueChange={setLedBrightness}
        onSlidingComplete={(val: number) => publishMqtt(topicPublishLED, Math.round(val))} // ส่ง MQTT เมื่อปล่อยมือ
      />

      {/* สไลด์บาร์ควบคุมพัดลม (สมมติ) */}
      <ControlSlider 
        icon="fan" title="Fan Speed" 
        value={fanSpeed} unit="%" min={0} max={100} step={10} 
        onValueChange={setFanSpeed}
        onSlidingComplete={(val: number) => publishMqtt(topicPublishFan, Math.round(val))}
      />

      {/* สไลด์บาร์ควบคุม Gas Threshold (สมมติค่าแจ้งเตือน) */}
      <ControlSlider 
        icon="smoke-detector" title="Gas Alarm Limit" 
        value={gasThreshold} unit="" min={0} max={4095} step={50} 
        onValueChange={setGasThreshold}
        onSlidingComplete={(val: number) => publishMqtt(topicPublishGasLimit, Math.round(val))}
      />

    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ส่วนแสดงหน้าหลัก */}
      <View style={styles.mainView}>
        {activeTab === 'Dashboard' ? <DashboardView /> : <ControlsView />}
      </View>

      {/* ส่วนเมนูด้านล่าง (Tab Navigation สมมติ) */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Dashboard')}>
          <MaterialCommunityIcons name="view-dashboard" size={26} color={activeTab === 'Dashboard' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && { color: COLORS.primary }]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Controls')}>
          <MaterialCommunityIcons name="controller-classic-outline" size={26} color={activeTab === 'Controls' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'Controls' && { color: COLORS.primary }]}>Controls</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // เว้นที่สำหรับ TabBar
  },
  viewHeader: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusOnline: {
    fontSize: 14,
    color: COLORS.online,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusOffline: {
    color: COLORS.offline,
  },
  // Dashboard Styles
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    width: (width - 60) / 2, // 2 การ์ดต่อแถว
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  // Controls Styles
  controlCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 15,
    flex: 1,
  },
  controlCardValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // TabBar Styles
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
    color: COLORS.textSecondary,
  },
});