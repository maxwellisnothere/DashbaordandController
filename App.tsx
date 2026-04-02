import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Paho from 'paho-mqtt';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🎨 กำหนดธีมสี เขียว-ดำ (Dark Neon Theme)
const COLORS = {
  primary: '#00FF66',     // เขียวนีออน
  accent: '#00CC55',      // เขียวเข้มขึ้นมานิดนึง
  background: '#090C10',  // ดำลึก (Deep Black)
  white: '#FFFFFF',
  text: '#E6EDF3',        // ขาวอมเทานิดๆ ให้สบายตา
  textSecondary: '#8B949E',
  online: '#00FF66',
  offline: '#FF4444',
  cardBackground: '#161B22', // ดำสว่างขึ้นมาสำหรับตัวการ์ด
  cardBorder: '#30363D',     // สีกรอบขอบการ์ด
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Controls'>('Dashboard');
  const [temp, setTemp] = useState<number | string>('--');
  const [hum, setHum] = useState<number | string>('--');
  const [gas, setGas] = useState<number | string>('--');
  const [isConnected, setIsConnected] = useState(false);

  // ค่าสำหรับ Controls
  const [ledState, setLedState] = useState(false); // false = OFF, true = ON
  
  const clientRef = useRef<Paho.Client | null>(null);

  // Topics (แก้ topic LED ให้เป็นแบบควบคุม ON/OFF)
  const topicSubscribe = "project/sensor/data";
  const topicPublishLED = "project/led/control"; 

  useEffect(() => {
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

  // ฟังก์ชันสลับสถานะไฟ LED (ON/OFF)
  const toggleLED = () => {
    if (!isConnected) return; // ถ้าไม่เชื่อมต่อเน็ต ห้ามกด
    
    const newState = !ledState;
    setLedState(newState);
    
    if (clientRef.current && clientRef.current.isConnected()) {
      const payload = newState ? "ON" : "OFF";
      const message = new Paho.Message(payload);
      message.destinationName = topicPublishLED;
      clientRef.current.send(message);
      console.log(`Sent command: ${payload}`);
    }
  };

  // --- คอมโพเนนต์การ์ดข้อมูล (สำหรับ Dashboard) ---
  const DataCard = ({ icon, title, value, unit, color }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20', borderColor: color, borderWidth: 1 }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardUnit}>{unit}</Text>
      </View>
    </View>
  );

  // --- ส่วนหน้าจอ Dashboard ---
  const DashboardView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.viewHeader}>SYSTEM<Text style={{color: COLORS.primary}}>_MONITOR</Text></Text>
      
      {/* สถานะการเชื่อมต่อ (แก้บั๊กตัวหนังสือ ActivityIndicator แล้ว) */}
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          <MaterialCommunityIcons name={isConnected ? "lan-connect" : "lan-disconnect"} size={16} color={isConnected ? COLORS.online : COLORS.offline} />
          <Text style={[styles.statusText, { color: isConnected ? COLORS.online : COLORS.offline }]}>
            {isConnected ? " HIVE_MQ CONNECTED" : " DISCONNECTED"}
          </Text>
          {!isConnected && <ActivityIndicator size="small" color={COLORS.offline} style={{marginLeft: 8}} />}
        </View>
      </View>

      {/* Grid ของข้อมูล Sensor */}
      <View style={styles.dataGrid}>
        <DataCard icon="thermometer" title="TEMPERATURE" value={temp} unit="°C" color="#FF5722" />
        <DataCard icon="water-percent" title="HUMIDITY" value={hum} unit="%" color="#00E5FF" />
        <DataCard icon="smoke-detector-variant" title="GAS_LEVEL" value={gas} unit="RAW" color="#B388FF" />
        <DataCard icon="shield-check-outline" title="STATUS" value="Active" unit="" color={COLORS.primary} />
      </View>
    </ScrollView>
  );

  // --- ส่วนหน้าจอ Controls (ปุ่มเปิดปิด) ---
  const ControlsView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.viewHeader}>MAIN<Text style={{color: COLORS.primary}}>_CONTROLS</Text></Text>
      
      <View style={styles.controlCenter}>
        <Text style={styles.controlTitle}>LED SYSTEM</Text>
        
        {/* ปุ่มกดเปิด-ปิดล้ำๆ */}
        <TouchableOpacity 
          style={[
            styles.powerButton, 
            ledState ? styles.powerButtonON : styles.powerButtonOFF,
            !isConnected && { opacity: 0.5 } // ถ้าไม่เชื่อมต่อให้ปุ่มจางลง
          ]} 
          onPress={toggleLED}
          disabled={!isConnected}
        >
          <MaterialCommunityIcons 
            name="power" 
            size={60} 
            color={ledState ? COLORS.background : COLORS.textSecondary} 
          />
        </TouchableOpacity>

        <Text style={[styles.ledStatusText, { color: ledState ? COLORS.primary : COLORS.textSecondary }]}>
          {ledState ? 'SYSTEM_ONLINE' : 'SYSTEM_OFFLINE'}
        </Text>
      </View>

    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainView}>
        {activeTab === 'Dashboard' ? <DashboardView /> : <ControlsView />}
      </View>

      {/* Tab Navigation สไตล์ Dark Mode */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Dashboard')}>
          <MaterialCommunityIcons name="monitor-dashboard" size={26} color={activeTab === 'Dashboard' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && { color: COLORS.primary, fontWeight: 'bold' }]}>DASHBOARD</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Controls')}>
          <MaterialCommunityIcons name="gamepad-circle" size={26} color={activeTab === 'Controls' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'Controls' && { color: COLORS.primary, fontWeight: 'bold' }]}>CONTROLS</Text>
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
    paddingBottom: 100, 
  },
  viewHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  // Dashboard Styles
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    width: (width - 60) / 2,
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardContent: {
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cardUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Controls Styles
  controlCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: COLORS.cardBackground,
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  controlTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 30,
  },
  powerButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 20,
  },
  powerButtonON: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  powerButtonOFF: {
    backgroundColor: 'transparent',
    borderColor: COLORS.textSecondary,
  },
  ledStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  // TabBar Styles
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: COLORS.cardBackground,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 5,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});