// IronSim Bike Connection

function connectBike() {

    document.getElementById("bikeStatus").innerHTML =
        "Searching...";

    setTimeout(function(){

        document.getElementById("bikeStatus").innerHTML =
            "Simulator Mode ✅";

        document.getElementById("dataStatus").innerHTML =
            "Running";

        document.getElementById("powerSource").innerHTML =
            "Estimated";

        document.getElementById("resistance").innerHTML =
            "5";

    }, 2000);

}
