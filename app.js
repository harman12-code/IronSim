// IronSim Core App

const rider = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0
};

function updateDisplay() {
    console.log("Power:", rider.power);
    console.log("Cadence:", rider.cadence);
    console.log("Speed:", rider.speed);
}

function startRide() {
    console.log("Ride Started");
    
    // Temporary simulated data
    rider.power = 200;
    rider.cadence = 85;
    rider.speed = 21.5;

    updateDisplay();
}

startRide();
