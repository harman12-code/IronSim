// bike.js - Universal Web Bluetooth Driver with fallback scanners

let bluetoothDevice = null;
let ftmsCharacteristic = null;

async function connectBike() {
    const bikeStatusEl = document.getElementById("bikeStatus");

    if (typeof logMsg === "function") logMsg("Initiating Bluetooth scanner...");

    if (!navigator.bluetooth) {
        if (typeof logMsg === "function") logMsg("ERROR: Web Bluetooth not supported in this browser.");
        alert("Web Bluetooth is not supported here. Use Chrome on Android/PC or Bluefy on iOS.");
        if (bikeStatusEl) bikeStatusEl.innerText = "Not Supported";
        return;
    }

    try {
        if (typeof logMsg === "function") logMsg("Opening Bluetooth device picker...");
        
        // Scan for all Bluetooth devices and allow optional access to bike GATT services
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [0x1826, 0x1818, 0x1816, 0x180A, 0x180D]
        });

        if (!bluetoothDevice) {
            if (typeof logMsg === "function") logMsg("No device was selected.");
            return;
        }

        const deviceName = bluetoothDevice.name || "Unnamed Device";
        if (typeof logMsg === "function") logMsg("Selected device: " + deviceName);

        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        if (typeof logMsg === "function") logMsg("Connecting to GATT Server...");
        const server = await bluetoothDevice.gatt.connect();

        if (typeof logMsg === "function") logMsg("GATT Connected! Locating services...");

        let service = null;
        try {
            service = await server.getPrimaryService(0x1826); // FTMS Service
            if (typeof logMsg === "function") logMsg("Connected to FTMS Service (0x1826)!");
        } catch (e) {
            if (typeof logMsg === "function") logMsg("0x1826 not found, checking Cycling Power (0x1818)...");
            try {
                service = await server.getPrimaryService(0x1818);
                if (typeof logMsg === "function") logMsg("Connected to Cycling Power Service (0x1818)!");
            } catch (err2) {
                if (typeof logMsg === "function") logMsg("Could not locate FTMS or Power services on this device.");
            }
        }

        if (service) {
            try {
                ftmsCharacteristic = await service.getCharacteristic(0x2AD2);
                await ftmsCharacteristic.startNotifications();
                ftmsCharacteristic.addEventListener('characteristicvaluechanged', handleFTMSData);
                if (typeof logMsg === "function") logMsg("Streaming Live Indoor Bike Data! 🚴");
            } catch (cErr) {
                try {
                    const powerChar = await service.getCharacteristic(0x2A63);
                    await powerChar.startNotifications();
                    powerChar.addEventListener('characteristicvaluechanged', handlePowerData);
                    if (typeof logMsg === "function") logMsg("Streaming Live Power Data! 🚴");
                } catch (pErr) {
                    if (typeof logMsg === "function") logMsg("Failed to subscribe to data characteristics.");
                }
            }

            if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
            if (typeof ride !== "undefined") ride.isBluetoothConnected = true;
        }

    } catch (error) {
        const errorMsg = error && error.message ? error.message : "User cancelled or search timed out";
        if (typeof logMsg === "function") logMsg("Bluetooth Status: " + errorMsg);
        if (bikeStatusEl) bikeStatusEl.innerText = "Connection Failed";
    }
}

function handleFTMSData(event) {
    const value = event.target.value;
    const flags = value.getUint16(0, true);
    let offset = 2;

    // Speed (0.01 km/h -> converted to MPH)
    if (!(flags & 0x0001)) {
        const rawSpeed = value.getUint16(offset, true);
        ride.speed = ((rawSpeed * 0.01) * 0.621371).toFixed(1);
        offset += 2;
    }

    // Cadence
    if (flags & 0x0002) {
        ride.cadence = Math.round(value.getUint16(offset, true) * 0.5);
        offset += 2;
    }

    // Power (Watts)
    if (flags & 0x0004) {
        ride.power = value.getInt16(offset, true);
        offset += 2;
    }
}

function handlePowerData(event) {
    const value = event.target.value;
    const power = value.getInt16(2, true);
    ride.power = Math.max(0, power);
}

function onDisconnected() {
    if (typeof logMsg === "function") logMsg("Bike disconnected from browser.");
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Disconnected";
    if (typeof ride !== "undefined") ride.isBluetoothConnected = false;
}
