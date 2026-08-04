// bike.js - Bluefy iOS & Schwinn IC4 Web Bluetooth Engine

let bluetoothDevice = null;
let ftmsCharacteristic = null;

async function connectBike() {
    const bikeStatusEl = document.getElementById("bikeStatus");

    if (typeof logMsg === "function") logMsg("Opening Bluefy Bluetooth scanner...");

    if (!navigator.bluetooth) {
        if (typeof logMsg === "function") logMsg("ERROR: Web Bluetooth not supported in this browser.");
        alert("Web Bluetooth is not supported here. Make sure you are using Bluefy on iOS.");
        if (bikeStatusEl) bikeStatusEl.innerText = "Not Supported";
        return;
    }

    try {
        if (typeof logMsg === "function") logMsg("Searching for IC Bike / Schwinn...");

        // Standard FTMS (0x1826) and Cycling Power (0x1818) service UUIDs
        const ftmsUUID = "00001826-0000-1000-8000-00805f9b34fb";
        const powerUUID = "00001818-0000-1000-8000-00805f9b34fb";

        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [ftmsUUID] },
                { services: [powerUUID] },
                { services: [0x1826] },
                { services: [0x1818] },
                { namePrefix: "IC" },
                { namePrefix: "Schwinn" }
            ],
            optionalServices: [ftmsUUID, powerUUID, 0x1826, 0x1818, 0x1816, 0x180a]
        });

        if (!bluetoothDevice) {
            if (typeof logMsg === "function") logMsg("Device selection was cancelled.");
            return;
        }

        const deviceName = bluetoothDevice.name || "Schwinn IC4";
        if (typeof logMsg === "function") logMsg("Connected to: " + deviceName);

        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        if (typeof logMsg === "function") logMsg("Connecting GATT server...");
        const server = await bluetoothDevice.gatt.connect();

        if (typeof logMsg === "function") logMsg("GATT Connected! Discovering services...");

        let service = null;

        // Attempt FTMS 0x1826 primary service
        try {
            service = await server.getPrimaryService(0x1826);
            if (typeof logMsg === "function") logMsg("Found FTMS Service (0x1826)!");
        } catch (e1) {
            try {
                service = await server.getPrimaryService(ftmsUUID);
                if (typeof logMsg === "function") logMsg("Found FTMS Full UUID!");
            } catch (e2) {
                if (typeof logMsg === "function") logMsg("FTMS failed, checking Cycling Power 0x1818...");
                try {
                    service = await server.getPrimaryService(0x1818);
                } catch (e3) {
                    service = await server.getPrimaryService(powerUUID);
                }
            }
        }

        if (service) {
            try {
                ftmsCharacteristic = await service.getCharacteristic(0x2ad2);
                await ftmsCharacteristic.startNotifications();
                ftmsCharacteristic.addEventListener("characteristicvaluechanged", handleFTMSData);
                if (typeof logMsg === "function") logMsg("Streaming Live Bike Telemetry! 🚴");
            } catch (cErr) {
                try {
                    const powerChar = await service.getCharacteristic(0x2a63);
                    await powerChar.startNotifications();
                    powerChar.addEventListener("characteristicvaluechanged", handlePowerData);
                    if (typeof logMsg === "function") logMsg("Streaming Live Power Data! 🚴");
                } catch (pErr) {
                    if (typeof logMsg === "function") logMsg("Could not subscribe to bike characteristics.");
                }
            }

            if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
            if (typeof ride !== "undefined") ride.isBluetoothConnected = true;
        }

    } catch (error) {
        const msg = error && error.message ? error.message : "Picker cancelled or iOS error";
        if (typeof logMsg === "function") logMsg("iOS Bluetooth Error: " + msg);
        if (bikeStatusEl) bikeStatusEl.innerText = "Connection Failed";
    }
}

function handleFTMSData(event) {
    const value = event.target.value;
    const flags = value.getUint16(0, true);
    let offset = 2;

    // Speed (0.01 km/h -> MPH)
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
    if (typeof logMsg === "function") logMsg("Bike disconnected.");
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Disconnected";
    if (typeof ride !== "undefined") ride.isBluetoothConnected = false;
}
