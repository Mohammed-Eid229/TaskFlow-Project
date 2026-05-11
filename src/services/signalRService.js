import * as signalR from "@microsoft/signalr"

class SignalRService {
  connection = null

  async startConnection(token) {
    if (this.connection) {
      return this.connection
    }

    const hubUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "/notificationHub") || "http://localhost:5183/notificationHub"

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    try {
      await this.connection.start()
      console.log("SignalR Connected.")
    } catch (err) {
      console.error("SignalR Connection Error: ", err)
      setTimeout(() => this.startConnection(token), 5000)
    }

    return this.connection
  }

  onReceiveNotification(callback) {
    if (this.connection) {
      this.connection.on("ReceiveNotification", callback)
    }
  }

  stopConnection() {
    if (this.connection) {
      this.connection.stop()
      this.connection = null
    }
  }
}

const signalRService = new SignalRService()
export default signalRService
