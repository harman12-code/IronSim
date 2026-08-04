// bike.js - Live Telemetry Engine for Schwinn IC4

let bluetoothDevice = null;
let activeCharacteristic = null;

async function connectBike() {
    const bikeStatusEl = document.getElementById("bikeStatus");

    if (typeof logMsg === "function") logMsg("Initiating Bluetooth scanner...");

    if (!navigator.bluetooth) {
        if (typeof logMsg === "function") logMsg("ERROR: Web Bluetooth not supported in this browser.");
        alert("Web Bluetooth is not supported here. Use Chrome or Edge on PC/Mac/Android.");
        if (bikeStatusEl) bikeStatusEl.innerText = "Not Supported";
        return;
    }

    try {
        if (typeof logMsg === "function") logMsg("Searching for Schwinn IC4 / IC Bike...");

        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [0x1826] },
                { services: [0x1818] },
                { services: [0x1816] },
                { namePrefix: 'IC' },
                { namePrefix: 'Schwinn' }
            ],
            optionalServices: [0x1826, 0x1818, 0x1816, 0x180A]
        });

        if (!bluetoothDevice) return;

        if (typeof logMsg === "function") logMsg("Found device: " + (bluetoothDevice.name || "IC Bike"));
        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        if (typeof logMsg === "function") logMsg("Connecting GATT server...");
        const server = await bluetoothDevice.gatt.connect();

        if (typeof logMsg === "function") logMsg("Connected! Scanning services for telemetry...");

        let subscribed = false;

        // 1. Try Fitness Machine Service (0x1826) -> Indoor Bike Data (0x2AD2)
        try {
            const ftmsService = await server.getPrimaryService(0x1826);
            activeCharacteristic = await ftmsService.getCharacteristic(0x2AD2);
            await activeCharacteristic.startNotifications();
            activeCharacteristic.addEventListener('characteristicvaluechanged', handleFTMSData);
            if (typeof logMsg === "function") logMsg("Subscribed to FTMS Indoor Bike Data (0x2AD2)!");
            subscribed = true;
        } catch (e1) {
            if (typeof logMsg === "function") logMsg("FTMS notification setup skipped, trying Cycling Power (0x1818)...");
        }

        // 2. Fallback to Cycling Power Service (0x1818) -> Power Measurement (0x2A63)
        if (!subscribed) {
            try {
                const powerService = await server.getPrimaryService(0x1818);
                activeCharacteristic = await powerService.getCharacteristic(0x2A63);
                await activeCharacteristic.startNotifications();
                activeCharacteristic.addEventListener('characteristicvaluechanged', handlePowerData);
                if (typeof logMsg === "function") logMsg("Subscribed to Cycling Power Data (0x2A63)!");
                subscribed = true;
            } catch (e2) {
                if (typeof logMsg === "function") logMsg("Cycling Power setup skipped, trying Speed & Cadence (0x1816)...");
            }
        }

        // 3. Fallback to Cycling Speed and Cadence (0x1816) -> CSC Measurement (0x2A5B)
        if (!subscribed) {
            try {
                const cscService = await server.getPrimaryService(0x1816);
                activeCharacteristic = await cscService.getCharacteristic(0x2A5B);
                await activeCharacteristic.startNotifications();
                activeCharacteristic.addEventListener('characteristicvaluechanged', handleCSCData);
                if (typeof logMsg === "function") logMsg("Subscribed to CSC Measurement (0x2A5B)!");
                subscribed = true;
            } catch (e3) {
                if (typeof logMsg === "function") logMsg("ERROR: Could not attach telemetry listener.");
            }
        }

        if (subscribed) {
            if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
            if (typeof ride !== "undefined") ride.isBluetoothConnected = true;
        }

    } catch (error) {
        if (typeof logMsg === "function") logMsg("Connection Error: " + error.message);
        if (bikeStatusEl) bikeStatusEl.innerText = "Connection Failed";
    }
}

// Handler for FTMS Indoor Bike Data (0x2AD2)
function handleFTMSData(event) {
    const data = event.target.value;
    const flags = data.getUint16(0, true);
    let offset = 2;

    let speedVal = 0;
    let cadenceVal = 0;
    let powerVal = 0;

    // Bit 0: More Data (0 = Instantaneous Speed present)
    if (!(flags & 0x0001)) {
        const rawSpeed = data.getUint16(offset, true);
        speedVal = ((rawSpeed * 0.01) * 0.621371).toFixed(1); // Km/h to MPH
        offset += 2;
    }

    // Bit 1: Average Speed Present
    if (flags & 0x0002) offset += 2;

    // Bit 2: Instantaneous Cadence Present
    if (flags & 0x0004) {
        cadenceVal = Math.round(data.getUint16(offset, true) * 0.5);
        offset += 2;
    }

    // Bit 3: Average Cadence Present
    if (flags & 0x0008) offset += 2;

    // Bit 4: Total Distance Present
    if (flags & 0x0010) offset += 3;

    // Bit 5: Resistance Level Present
    if (flags & 0x0020) offset += 2;

    // Bit 6: Instantaneous Power Present
    if (flags & 0x0040) {
        powerVal = data.getInt16(offset, true);
        offset += 2;
    }

    updateUI(powerVal, cadenceVal, speedVal);
}

// Handler for Cycling Power Data (0x2A63)
function handlePowerData(event) {
    const data = event.target.value;
    const powerVal = data.getInt16(2, true);
    updateUI(powerVal, 0, 0);
}

// Handler for Speed & Cadence Data (0x2A5B)
function handleCSCData(event) {
    const data = event.target.value;
    const flags = data.getUint8(0);
    let offset = 1;

    if (flags & 0x02) { // Crank Revolution Data Present
        const cumulativeCrank = data.getUint16(offset + 4, true);
        updateUI(0, cumulativeCrank % 120, 0);
    }
}

// Helper function to update IronSim state and UI elements
function updateUI(power, cadence, speed) {
    if (typeof ride !== "undefined") {
        if (power > 0) ride.power = power;
        if (cadence > 0) ride.cadence = cadence;
        if (speed > 0) ride.speed = speed;
    }

    const powerEl = document.getElementById("power");
    const cadenceEl = document.getElementById("cadence");
    const speedEl = document.getElementById("speed");

    if (powerEl && power > 0) powerEl.innerText = power;
    if (cadenceEl && cadence > 0) cadenceEl.innerText = cadence;
    if (speedEl && speed > 0) speedEl.innerText = speed;

    if (typeof logMsg === "function") {
        logMsg(`Telemetry Rx -> Power: ${power}W | Cadence: ${cadence}RPM | Speed: ${speed}MPH`);
    }
}

function onDisconnected() {
    if (typeof logMsg === "function") logMsg("Bike disconnected from browser.");
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Disconnected";
    if (typeof ride !== "undefined") ride.isBluetoothConnected = false;
}
