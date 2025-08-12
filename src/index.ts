

import { Request, RequestEvent, WebResponse } from "./ExpoWebServer.types";
import ExpoWebServerModule from "./ExpoWebServerModule";

export  { Request, RequestEvent, WebResponse } from "./ExpoWebServer.types";

export function addRequestListener(listener: (event: RequestEvent) => void) {
  return ExpoWebServerModule.addListener('onRequest', listener);
}

export const start = (port: number, callback: (request: Request) => Promise<WebResponse> | WebResponse) => {
  // Add event listener first
  const subscription = addRequestListener(async (event) => {
    try {
      const request: Request = {
        requestId: event.requestId,
        method: event.method,
        path: event.path,
        body: event.body,
        headers: JSON.parse(event.headersJson ?? "{}"),
        params: JSON.parse(event.paramsJson ?? "{}"),
      };
      
      const response: WebResponse = await callback(request);
      
      // Ensure response data is complete
      ExpoWebServerModule.respond(
        response.requestId,
        response.statusCode || 200,
        response.statusDescription || "OK",
        response.contentType || "application/json",
        response.headers || {},
        response.body || null,
        response.file || null
      );
    } catch (error) {
      console.error('Error handling request:', error);
      // Send error response
      ExpoWebServerModule.respond(
        event.requestId,
        500,
        "Internal Server Error",
        "application/json",
        {},
        JSON.stringify({ error: "Internal server error" }),
        null
      );
    }
  });

  // Then start the server
  try {
    ExpoWebServerModule.start(port);
    console.log(`Web server started on port ${port}`);
  } catch (error) {
    console.error('Error starting web server:', error);
    subscription?.remove();
    throw error;
  }
};

export const stop = () => {
  try {
    ExpoWebServerModule.stop();
    console.log('Web server stopped');
  } catch (error) {
    console.error('Error stopping web server:', error);
  }
};

export const getDeviceIP = (): string => {
  try {
    return ExpoWebServerModule.getDeviceIP();
  } catch (error) {
    console.error('Error getting device IP:', error);
    return "127.0.0.1";
  }
};