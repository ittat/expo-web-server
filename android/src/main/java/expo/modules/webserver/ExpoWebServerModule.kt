package expo.modules.webserver

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import io.ktor.http.*
import io.ktor.server.engine.*
import io.ktor.server.cio.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap
import com.google.gson.Gson
import io.ktor.server.request.httpMethod
import io.ktor.server.request.receiveText
import io.ktor.server.request.uri
import io.ktor.util.toMap
import java.net.ServerSocket
import java.net.NetworkInterface
import java.net.InetAddress

class ExpoWebServerModule : Module() {
    private var server: EmbeddedServer<CIOApplicationEngine, CIOApplicationEngine.Configuration>? = null
    private val pendingResponses = ConcurrentHashMap<String, CompletableDeferred<ResponseData>>()
    private val coroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun definition() = ModuleDefinition {
        Name("ExpoWebServer")

        Events("onRequest")

        Function("start") { port: Int ->
            try {
                if (!isPortAvailable(port)) {
                    throw Exception("端口 $port 已被占用，请选择其他端口")
                }
                startServer(port)
            } catch (e: Exception) {
                println("Error starting server: ${e.message}")
                throw e
            }
        }

        Function("respond") { requestId: String, statusCode: Int, statusDescription: String, contentType: String, headers: Map<String, String>, body: String?, file: String? ->
            try {
                respondToRequest(requestId, statusCode, statusDescription, contentType, headers, body, file)
            } catch (e: Exception) {
                println("Error responding to request: ${e.message}")
                throw e
            }
        }

        Function("stop") {
            try {
                stopServer()
            } catch (e: Exception) {
                println("Error stopping server: ${e.message}")
                throw e
            }
        }

        Function("getDeviceIP") {
            getDeviceIPAddress()
        }
    }

    private fun getDeviceIPAddress(): String {
        try {
            val networkInterfaces = NetworkInterface.getNetworkInterfaces()
            while (networkInterfaces.hasMoreElements()) {
                val networkInterface = networkInterfaces.nextElement()
                val inetAddresses = networkInterface.inetAddresses
                
                while (inetAddresses.hasMoreElements()) {
                    val inetAddress = inetAddresses.nextElement()
                    
                    // 跳过回环地址和IPv6地址
                    if (!inetAddress.isLoopbackAddress && inetAddress.hostAddress.indexOf(':') < 0) {
                        val hostAddress = inetAddress.hostAddress
                        
                        // 优先返回WiFi地址（通常以192.168或10.开头）
                        if (hostAddress.startsWith("192.168.") || hostAddress.startsWith("10.")) {
                            return hostAddress
                        }
                    }
                }
            }
            
            // 如果没有找到WiFi地址，返回第一个非回环的IPv4地址
            val networkInterfaces2 = NetworkInterface.getNetworkInterfaces()
            while (networkInterfaces2.hasMoreElements()) {
                val networkInterface = networkInterfaces2.nextElement()
                val inetAddresses = networkInterface.inetAddresses
                
                while (inetAddresses.hasMoreElements()) {
                    val inetAddress = inetAddresses.nextElement()
                    
                    if (!inetAddress.isLoopbackAddress && inetAddress.hostAddress.indexOf(':') < 0) {
                        return inetAddress.hostAddress
                    }
                }
            }
        } catch (e: Exception) {
            println("Error getting device IP: ${e.message}")
        }
        
        return "127.0.0.1" // 默认返回本地地址
    }

    private fun isPortAvailable(port: Int): Boolean {
        return try {
            ServerSocket(port).use { true }
        } catch (e: Exception) {
            false
        }
    }

    private fun startServer(port: Int) {
        if (server != null) {
            println("Server is already running")
            return
        }

        server = embeddedServer(CIO, host = "0.0.0.0", port = port) {
            routing {
                route("{...}") {
                    handle {
                        val requestId = generateRequestId()
                        val deferredResponse = CompletableDeferred<ResponseData>()
                        pendingResponses[requestId] = deferredResponse

                        try {
                            val method = call.request.httpMethod.value
                            val path = call.request.uri
                            val headers = call.request.headers.toMap()
                            val params = call.request.queryParameters.toMap()
                            val body = if (method in listOf("POST", "PUT", "PATCH")) {
                                try {
                                    call.receiveText()
                                } catch (e: Exception) {
                                    null
                                }
                            } else {
                                null
                            }

                            val requestEvent = mapOf(
                                "requestId" to requestId,
                                "method" to method,
                                "path" to path,
                                "body" to body,
                                "headersJson" to Gson().toJson(headers),
                                "paramsJson" to Gson().toJson(params)
                            )

                            sendEvent("onRequest", requestEvent)

                            // 使用协程作用域等待响应
                            val responseData = withTimeoutOrNull(30000L) { // 30秒超时
                                deferredResponse.await()
                            } ?: ResponseData(
                                statusCode = 408,
                                statusDescription = "Request Timeout",
                                contentType = "application/json",
                                headers = mapOf(),
                                body = "{\"error\": \"Request timeout\"}",
                                file = null
                            )

                            // 发送响应
                            val status = HttpStatusCode.fromValue(responseData.statusCode)
                            call.response.status(status)
                            responseData.headers.forEach { (key, value) ->
                                call.response.headers.append(key, value)
                            }

                            if (responseData.file != null) {
                                val filePath = responseData.file.replace("file://", "")
                                val fileToSend = java.io.File(filePath)
                                if (fileToSend.exists()) {
                                    call.respondFile(fileToSend)
                                } else {
                                    call.respond(HttpStatusCode.NotFound)
                                }
                            } else if (responseData.body != null) {
                                call.respondText(responseData.body, ContentType.parse(responseData.contentType))
                            } else {
                                call.respondText("", ContentType.parse(responseData.contentType))
                            }
                        } catch (e: Exception) {
                            println("Error handling request: ${e.message}")
                            // 发送错误响应
                            call.respond(HttpStatusCode.InternalServerError, "Internal Server Error")
                        } finally {
                            // 清理待处理的响应
                            pendingResponses.remove(requestId)
                        }
                    }
                }
            }
        }

        try {
            server?.start(wait = false)
            println("Web server started on port $port")
        } catch (e: Exception) {
            println("Failed to start server: ${e.message}")
            server = null
            throw e
        }
    }

    private fun respondToRequest(
        requestId: String,
        statusCode: Int,
        statusDescription: String,
        contentType: String,
        headers: Map<String, String>,
        body: String?,
        file: String?
    ) {
        val deferredResponse = pendingResponses.remove(requestId)
        if (deferredResponse != null) {
            if (!deferredResponse.isCompleted) {
                deferredResponse.complete(
                    ResponseData(
                        statusCode = statusCode,
                        statusDescription = statusDescription,
                        contentType = contentType,
                        headers = headers,
                        body = body,
                        file = file
                    )
                )
            }
        } else {
            println("No pending request found for requestId: $requestId")
        }
    }

    private fun stopServer() {
        server?.let { srv ->
            coroutineScope.launch {
                try {
                    srv.stop(gracePeriodMillis = 5000L, timeoutMillis = 60000L)
                    println("Web server stopped successfully")
                } catch (e: Exception) {
                    println("Error stopping server: ${e.message}")
                }
            }
        }
        server = null
        pendingResponses.clear()
    }

    private fun generateRequestId(): String {
        val milliseconds = System.currentTimeMillis()
        val randomValue = (0..1_000_000).random()
        return "$milliseconds:$randomValue"
    }

    data class ResponseData(
        val statusCode: Int,
        val statusDescription: String,
        val contentType: String,
        val headers: Map<String, String>,
        val body: String?,
        val file: String?
    )
}