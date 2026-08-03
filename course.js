// course.js - IronSim Course Manager & Elevation Engine

const marylandCourse = {
    name: "Ironman Maryland",
    distanceMiles: 112,
    segments: [
        { start: 0, end: 15, name: "Cambridge Start", elevation: "Flat", baseGrade: 0.1, wind: "Variable" },
        { start: 15, end: 35, name: "Blackwater Wildlife Loop", elevation: "Rolling", baseGrade: 1.5, wind: "Coastal Gusts" },
        { start: 35, end: 65, name: "Decatur & Golden Hill", elevation: "Light Incline", baseGrade: 2.2, wind: "Crosswind" },
        { start: 65, end: 95, name: "Eastern Shore Out & Back", elevation: "Flat / Fast", baseGrade: 0.0, wind: "Tailwind" },
        { start: 95, end: 112, name: "Return to Cambridge", elevation: "Rolling Finish", baseGrade: 1.2, wind: "Headwind" }
    ]
};

function getCurrentGrade(distance) {
    const seg = marylandCourse.segments.find(s => distance >= s.start && distance < s.end);
    if (!seg) return 0.0;
    
    // Adds subtle natural variation (+/- 0.5%) to the grade
    const microVar = Math.sin(distance * 3) * 0.5;
    return Number((seg.baseGrade + microVar).toFixed(1));
}

function updateCourseSection() {
    if (typeof ride === "undefined") return;

    const d = ride.distance;
    let section = "Starting Line";
    let terrain = "Flat";
    let wind = "Variable";

    const currentSegment = marylandCourse.segments.find(seg => d >= seg.start && d < seg.end);
    if (currentSegment) {
        section = currentSegment.name;
        terrain = `${currentSegment.elevation} (${getCurrentGrade(d)}%)`;
        wind = currentSegment.wind;
    } else if (d >= marylandCourse.distanceMiles) {
        section = "Finish Line! 🏁";
        terrain = "Flat (0.0%)";
        wind = "Calm";
    }

    const sectionEl = document.getElementById("section");
    const terrainEl = document.getElementById("terrain");
    const windEl = document.getElementById("wind");

    if (sectionEl) sectionEl.innerText = section;
    if (terrainEl) terrainEl.innerText = terrain;
    if (windEl) windEl.innerText = wind;
}
