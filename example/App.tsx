import { useEvent } from 'expo';
import { start, stop, getDeviceIP } from 'expo-web-server';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, View, Alert } from 'react-native';

export default function App() {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverPort, setServerPort] = useState(3000); // Use different port
  const [deviceIP, setDeviceIP] = useState<string>('');

  useEffect(() => {
    // Get device IP address
    const ip = getDeviceIP();
    setDeviceIP(ip);
    console.log('Device IP:', ip);
  }, []);

  const handleStartServer = () => {
    try {
      start(serverPort, (request) => {
        console.log('Received request:', request);
        return {
          requestId: request.requestId,
          statusCode: 200,
          statusDescription: 'OK',
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            message: 'Hello from Expo Web Server!',
            request: {
              method: request.method,
              path: request.path,
              headers: request.headers,
              params: request.params,
              body: request.body,
            },
            timestamp: new Date().toISOString(),
          }),
        };
      });
      setIsServerRunning(true);
      Alert.alert('Success', `Web server started on port ${serverPort}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      Alert.alert('Error', `Failed to start server: ${error}`);
    }
  };

  const handleStopServer = () => {
    try {
      stop();
      setIsServerRunning(false);
      Alert.alert('Success', 'Web server stopped');
    } catch (error) {
      console.error('Failed to stop server:', error);
      Alert.alert('Error', `Failed to stop server: ${error}`);
    }
  };

  const handleRefreshIP = () => {
    const ip = getDeviceIP();
    setDeviceIP(ip);
    Alert.alert('IP Address Refreshed', `Current device IP: ${ip}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Expo Web Server 示例</Text>
          <Text style={styles.statusText}>
            服务器状态: {isServerRunning ? '运行中' : '已停止'}
          </Text>
        </View>

        <View style={styles.ipContainer}>
          <Text style={styles.ipTitle}>设备IP地址:</Text>
          <Text style={styles.ipAddress}>{deviceIP || '获取中...'}</Text>
          <Button title="刷新IP" onPress={handleRefreshIP} />
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title={isServerRunning ? "停止服务器" : "启动服务器"} 
            onPress={isServerRunning ? handleStopServer : handleStartServer}
            color={isServerRunning ? "#ff4444" : "#44aa44"}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            启动服务器后，您可以通过以下方式访问：
          </Text>
          <Text style={styles.urlText}>
            http://localhost:{serverPort}
          </Text>
          <Text style={styles.urlText}>
            http://{deviceIP}:{serverPort}
          </Text>
          <Text style={styles.noteText}>
            注意：请确保端口 {serverPort} 没有被其他应用占用
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>功能特性：</Text>
          <Text style={styles.featureText}>• 支持所有 HTTP 方法 (GET, POST, PUT, DELETE)</Text>
          <Text style={styles.featureText}>• 自动处理请求头和参数</Text>
          <Text style={styles.featureText}>• 支持 JSON 响应</Text>
          <Text style={styles.featureText}>• 支持文件服务</Text>
          <Text style={styles.featureText}>• 错误处理和超时保护</Text>
          <Text style={styles.featureText}>• 自动获取设备真实IP地址</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    alignItems: 'center' as const,
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  ipContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center' as const,
  },
  ipTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 10,
  },
  ipAddress: {
    fontSize: 18,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    margin: 20,
  },
  infoContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  urlText: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    marginVertical: 2,
  },
  noteText: {
    fontSize: 12,
    color: '#ff6600',
    marginTop: 10,
    fontStyle: 'italic' as const,
  },
  featuresContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
};
