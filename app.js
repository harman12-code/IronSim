// IronSim Core Engine

const ride = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0,
    seconds: 0,
    running: false,
    course: "Ironman Maryland"
};


function startRide() {

    ride.running = true;

    console.log("Ride Started");

}


function simulateRide() {

    if (!ride.running) {
        return;
    }

    // Temporary simulated bike data
    ride.power = Math.floor(180 + Math.random() * 80);
    ride.cadence = Math.floor(75 + Math.random() * 20);
    ride.speed = (18 + Math.random() * 5).toFixed(1);

    ride.distance += 0.01;
    ride.seconds += 1;

    updateDisplay();
}


function updateDisplay() {

    document.getElementById("power").innerHTML =
        ride.power + " watts";

    document.getElementById("cadence").innerHTML =
        ride.cadence + " RPM";

    document.getElementById("speed").innerHTML =
        ride.speed + " MPH";

    document.getElementById("distance").innerHTML =
        ride.distance.toFixed(2) + " miles";

    let minutes = Math.floor(ride.seconds / 60);
    let seconds = ride.seconds % 60;

    document.getElementById("time").innerHTML =
        minutes + ":" + seconds.toString().padStart(2, "0");
}


setInterval(simulateRide, 1000);
