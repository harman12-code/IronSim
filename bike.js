// bike.js - Universal Schwinn IC4 / FTMS Bluetooth Driver

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
        if (typeof logMsg === "function") logMsg("Searching for IC4 / FTMS Trainer...");
        
        // Broader search filter for Schwinn IC4 & standard smart trainers
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                { services: ['fitness_machine'] },
                { services: ['cycling_power'] },
                { services: [0x1826] },
                { services: [0x1818] },
                { namePrefix: 'IC Bike' },
                { namePrefix: 'Schwinn' }
            ],
            optionalServices: ['fitness_machine', 'cycling_power', 'cycling_speed_and_cadence', 0x1826, 0x1818, 0x1816, 0x180A]
        });

        if (typeof logMsg === "function") logMsg("Found device: " + (bluetoothDevice.name || "Smart Trainer"));
        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        if (typeof logMsg === "function") logMsg("Connecting GATT server...");
        const server = await bluetoothDevice.gatt.connect();

        if (typeof logMsg === "function") logMsg("GATT Connected! Locating telemetry service...");

        // Try Fitness Machine Service (FTMS - 0x1826)
        let service = null;
        try {
            service = await server.getPrimaryService('fitness_machine');
            if (typeof logMsg === "function") logMsg("Connected to FTMS Service!");
        } catch (e) {
            if (typeof logMsg === "function") logMsg("FTMS not found, falling back to Cycling Power...");
            service = await server.getPrimaryService('cycling_power');
        }

        if (service) {
            // Check for Indoor Bike Data (0x2AD2) or Power Measurement (0x2A63)
            try {
                ftmsCharacteristic = await service.getCharacteristic(0x2AD2);
                await ftmsCharacteristic.startNotifications();
                ftmsCharacteristic.addEventListener('characteristicvaluechanged', handleFTMSData);
                if (typeof logMsg === "function") logMsg("Streaming Live Indoor Bike Data! 🚴");
            } catch (cErr) {
                const powerChar = await service.getCharacteristic(0x2A63);
                await powerChar.startNotifications();
                powerChar.addEventListener('characteristicvaluechanged', handlePowerData);
                if (typeof logMsg === "function") logMsg("Streaming Live Power Data! 🚴");
            }

            if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
            if (typeof ride !== "undefined") ride.isBluetoothConnected = true;
        }

    } catch (error) {
        if (typeof logMsg === "function") logMsg("Bluetooth Handshake Error: " + error.message);
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
