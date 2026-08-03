// bike.js - Schwinn IC4 & FTMS Web Bluetooth Engine

let bluetoothDevice = null;

async function connectBike() {
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Connecting...";

    if (!navigator.bluetooth) {
        alert("Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Bluefy on iOS.");
        if (bikeStatusEl) bikeStatusEl.innerText = "Browser Not Supported";
        return;
    }

    try {
        console.log("Requesting Bluetooth Devices...");
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [0x1826] }, // Fitness Machine Service (FTMS)
                { services: [0x1818] }, // Cycling Power Service
                { namePrefix: "IC Bike" },
                { namePrefix: "Schwinn" }
            ],
            optionalServices: [0x1816, 0x1818, 0x1826, 0x180A]
        });

        bluetoothDevice.addEventListener("gattsdisconnected", onDisconnected);

        const server = await bluetoothDevice.gatt.connect();
        console.log("GATT Connected:", server);

        if (bikeStatusEl) bikeStatusEl.innerText = "Connected! 🚴";
        if (typeof ride !== "undefined") ride.isBluetoothConnected = true;

        // Attempt FTMS indoor bike data primary stream
        try {
            const ftmsService = await server.getPrimaryService(0x1826);
            const ftmsChar = await ftmsService.getCharacteristic(0x2AD2); // Indoor Bike Data
            await ftmsChar.startNotifications();
            ftmsChar.addEventListener("characteristicvaluechanged", handleFTMSData);
            console.log("Listening to FTMS Stream...");
        } catch (ftmsErr) {
            console.warn("FTMS primary not found, attempting Cycling Power service...", ftmsErr);
            const powerService = await server.getPrimaryService(0x1818);
            const powerChar = await powerService.getCharacteristic(0x2A63); // Cycling Power Measurement
            await powerChar.startNotifications();
            powerChar.addEventListener("characteristicvaluechanged", handlePowerData);
        }

    } catch (error) {
        console.error("Bluetooth connection error:", error);
        if (bikeStatusEl) bikeStatusEl.innerText = "Connection Failed";
    }
}

function handleFTMSData(event) {
    const value = event.target.value;
    const flags = value.getUint16(0, true);

    let offset = 2;

    // Speed
    if (!(flags & 0x0001)) {
        const rawSpeed = value.getUint16(offset, true); // 0.01 km/h
        ride.speed = ((rawSpeed * 0.01) * 0.621371).toFixed(1); // convert to MPH
        offset += 2;
    }

    // Cadence
    if (flags & 0x0002) {
        ride.cadence = Math.round(value.getUint16(offset, true) * 0.5);
        offset += 2;
    }

    // Power
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
    console.warn("Bluetooth Device Disconnected.");
    const bikeStatusEl = document.getElementById("bikeStatus");
    if (bikeStatusEl) bikeStatusEl.innerText = "Disconnected";
    if (typeof ride !== "undefined") ride.isBluetoothConnected = false;
}
