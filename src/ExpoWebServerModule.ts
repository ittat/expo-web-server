import { NativeModule, requireNativeModule } from 'expo';

import { ExpoWebServerModuleEvents } from './ExpoWebServer.types';

declare class ExpoWebServerModule extends NativeModule<ExpoWebServerModuleEvents> {
  start: (port: number) => void;
  stop: () => void;
  respond: (requestId: string, statusCode: number, statusDescription: string, contentType: string, headers: Record<string, string>, body: string | null, file: string | null) => void;
  getDeviceIP: () => string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoWebServerModule>('ExpoWebServer');
