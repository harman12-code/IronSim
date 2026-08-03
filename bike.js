// bike.js - Schwinn IC4 Web Bluetooth Engine

let bluetoothDevice = null;

async function connectBike() {
    const bikeStatusEl = document.getElementById("bikeStatus");

    if (typeof logMsg === "function") logMsg("Starting connectBike()...");

    if (!navigator.bluetooth) {
        if (typeof logMsg === "function") logMsg("ERROR: Web Bluetooth not supported on this browser!");
        alert("Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Bluefy on iOS.");
        if (bikeStatusEl) bikeStatusEl.innerText = "Not Supported";
        return;
    }

    try {
        if (typeof logMsg === "function") logMsg("Requesting Bluetooth device popup...");
        
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [0x1826, 0x1818, 0x1816, 0x180A]
        });

        if (typeof logMsg === "function") logMsg("Device selected: " + bluetoothDevice.name);
        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        if (typeof logMsg === "function") logMsg("Connecting to GATT server...");
        const server = await bluetoothDevice.gatt.connect();

        if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
        if (typeof logMsg === "function") logMsg("Successfully connected to bike!");
        if (typeof ride !== "undefined") ride.isBluetoothConnected = true;

    } catch (error) {
        if (typeof logMsg === "function") logMsg("Bluetooth Error: " + error.message);
        if (bikeStatusEl) bikeStatusEl.innerText = "Connection Failed";
    }
}

function onDisconnected() {
    if (typeof logMsg === "function") logMsg("Bike disconnected.");
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Disconnected";
    if (typeof ride !== "undefined") ride.isBluetoothConnected = false;
}
