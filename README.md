# Expo Web Server

A native web server module for Expo/React Native applications that allows you to create HTTP servers directly on mobile devices.

## Features

- 🚀 **Native Performance**: Built with native code for optimal performance
- 📱 **Cross-Platform**: Supports both iOS and Android
- 🔧 **Easy Integration**: Simple API for starting and managing web servers
- 🌐 **Full HTTP Support**: Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- 📄 **File Serving**: Serve static files from your app
- 🔒 **Error Handling**: Built-in error handling and timeout protection
- 📍 **IP Detection**: Automatically detects device IP address
- 🎯 **TypeScript Support**: Full TypeScript definitions included

## Installation

### Prerequisites

- Expo SDK 53 or higher
- React Native 0.79.1 or higher
- iOS 13+ / Android API 21+

### Install the package

```bash
npx expo install expo-web-server
```

## Quick Start

```typescript
import { start, stop, getDeviceIP } from 'expo-web-server';

// Start the web server
start(3000, async (request) => {
  console.log('Received request:', request);
  
  return {
    requestId: request.requestId,
    statusCode: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Hello from Expo Web Server!',
      timestamp: new Date().toISOString(),
    }),
  };
});

// Get device IP address
const deviceIP = getDeviceIP();
console.log('Device IP:', deviceIP);

// Stop the server when done
stop();
```

## API Reference

### `start(port: number, callback: (request: Request) => Promise<WebResponse> | WebResponse)`

Starts the web server on the specified port.

**Parameters:**
- `port` (number): The port number to start the server on
- `callback` (function): Request handler function that receives a `Request` object and returns a `WebResponse`

**Example:**
```typescript
start(3000, async (request) => {
  if (request.path === '/api/hello') {
    return {
      requestId: request.requestId,
      statusCode: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Hello World!' }),
    };
  }
  
  return {
    requestId: request.requestId,
    statusCode: 404,
    contentType: 'text/plain',
    body: 'Not Found',
  };
});
```

### `stop()`

Stops the web server.

**Example:**
```typescript
stop();
```

### `getDeviceIP(): string`

Returns the device's IP address as a string.

**Returns:** Device IP address (e.g., "192.168.1.100")

**Example:**
```typescript
const ip = getDeviceIP();
console.log('Device IP:', ip);
```

## Types

### `Request`

```typescript
interface Request {
  requestId: string;
  method: HttpMethod;
  path: string;
  body: string;
  headers: { [key: string]: string };
  params: { [key: string]: string };
}
```

### `WebResponse`

```typescript
interface WebResponse {
  requestId: string;
  statusCode?: number;        // Default: 200
  statusDescription?: string; // Default: "OK"
  contentType?: string;       // Default: "application/json"
  headers?: Record<string, string>;
  body?: string | null;
  file?: string | null;       // Path to file to serve
}
```

### `HttpMethod`

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
```

## Examples

### Basic JSON API

```typescript
import { start, stop } from 'expo-web-server';

start(3000, async (request) => {
  switch (request.path) {
    case '/api/users':
      return {
        requestId: request.requestId,
        statusCode: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]),
      };
      
    case '/api/health':
      return {
        requestId: request.requestId,
        statusCode: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
      };
      
    default:
      return {
        requestId: request.requestId,
        statusCode: 404,
        contentType: 'text/plain',
        body: 'Not Found',
      };
  }
});
```

### File Serving

```typescript
import { start } from 'expo-web-server';
import * as FileSystem from 'expo-file-system';

start(3000, async (request) => {
  if (request.path === '/') {
    return {
      requestId: request.requestId,
      statusCode: 200,
      contentType: 'text/html',
      body: '<h1>Welcome to Expo Web Server!</h1>',
    };
  }
  
  if (request.path.startsWith('/static/')) {
    const filePath = FileSystem.documentDirectory + request.path.substring(8);
    return {
      requestId: request.requestId,
      statusCode: 200,
      contentType: 'application/octet-stream',
      file: filePath,
    };
  }
  
  return {
    requestId: request.requestId,
    statusCode: 404,
    contentType: 'text/plain',
    body: 'File not found',
  };
});
```

### REST API with POST Support

```typescript
import { start } from 'expo-web-server';

start(3000, async (request) => {
  if (request.method === 'POST' && request.path === '/api/data') {
    try {
      const data = JSON.parse(request.body);
      
      // Process the data here
      console.log('Received data:', data);
      
      return {
        requestId: request.requestId,
        statusCode: 201,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          message: 'Data received successfully',
          receivedData: data 
        }),
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        statusCode: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON data' 
        }),
      };
    }
  }
  
  return {
    requestId: request.requestId,
    statusCode: 405,
    contentType: 'text/plain',
    body: 'Method not allowed',
  };
});
```

## React Native Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { start, stop, getDeviceIP } from 'expo-web-server';

export default function WebServerComponent() {
  const [isRunning, setIsRunning] = useState(false);
  const [deviceIP, setDeviceIP] = useState('');

  useEffect(() => {
    setDeviceIP(getDeviceIP());
  }, []);

  const handleStartServer = () => {
    try {
      start(3000, async (request) => {
        return {
          requestId: request.requestId,
          statusCode: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          },
          body: JSON.stringify({
            message: 'Hello from React Native!',
            request: request,
            timestamp: new Date().toISOString(),
          }),
        };
      });
      setIsRunning(true);
      Alert.alert('Success', `Server started on port 3000\nAccess via: http://${deviceIP}:3000`);
    } catch (error) {
      Alert.alert('Error', `Failed to start server: ${error}`);
    }
  };

  const handleStopServer = () => {
    try {
      stop();
      setIsRunning(false);
      Alert.alert('Success', 'Server stopped');
    } catch (error) {
      Alert.alert('Error', `Failed to stop server: ${error}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Server Status: {isRunning ? 'Running' : 'Stopped'}
      </Text>
      <Text style={{ marginBottom: 20 }}>
        Device IP: {deviceIP}
      </Text>
      <Button
        title={isRunning ? 'Stop Server' : 'Start Server'}
        onPress={isRunning ? handleStopServer : handleStartServer}
      />
    </View>
  );
}
```

## Development

### Building from source

```bash
git clone https://github.com/ittat/expo-web-server.git
cd expo-web-server
npm install
npm run build
```

### Running the example

```bash
cd example
npm install
npx expo start
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Make sure the port you're trying to use isn't already occupied by another application.

2. **Permission denied**: On Android, ensure your app has the `INTERNET` permission in `AndroidManifest.xml`.

3. **Server not accessible**: Make sure your device and the client are on the same network.

### Debug Mode

Enable debug logging by checking the console output in your Expo development tools.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/ittat/expo-web-server/issues) page
2. Create a new issue with detailed information about your problem
3. Include your Expo SDK version, React Native version, and device information

## Changelog

### v0.1.0
- Initial release
- Basic HTTP server functionality
- Support for all HTTP methods
- File serving capability
- TypeScript definitions
- iOS and Android support
