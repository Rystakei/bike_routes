const map = L.map("map").setView([42.37, -71.13], 13);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const riddenLayer = L.layerGroup().addTo(map);

// Colors
const commuterRailPurple = "#800080";
const amtrakColor = "navy";
const rustyColor = "#8B0000";

// === Trails ===
const trails = [
  {
    file: "cambridge_watertown_greenway.json",
    label: "Cambridge-Watertown Greenway",
    color: "#0074D9",
  },
  {
    file: "minuteman.json",
    label: "Minuteman Commuter Bikeway",
    color: "#0074D9",
  },
  {
    file: "bruce_freeman_rail_trail.json",
    label: "Bruce Freeman Rail Trail",
    color: "#2ECC40",
  },
  {
    file: "schuylkill_trail_new.json",
    label: "Schuylkill River Trail",
    color: "#2ECC40",
  },
  {
    file: "nashua_river_rail_trail.json",
    label: "Nashua River Rail Trail",
    color: "orange",
  },
  {
    file: "east_bay_bike_path.json",
    label: "East Bay Bike Path",
    color: "red",
  },
  {
    file: "blackstone_river_bikeway.json",
    label: "Blackstone River Bikeway",
    color: "turquoise",
  },
  {
    file: "northern_strand_malden_lynn.json",
    label: "Northern Strand - Malden to Lynn",
    color: "#2ECC45",
  },
  {
    file: "cape_cod_rail_trail.json",
    label: "Cape Cod Rail Trail",
    color: "#23ECD9",
  },
  { file: "pennypack_trail.json", label: "Pennypack Trail", color: "#23E7D9" },

  {
    file: "farmington_canal_heritage_trail.json",
    label: "Farmington Canal Heritage Trail",
    color: "#2ECC40",
  },
  {
    file: "forbidden_drive.json",
    label: "Forbidden Drive",
    color: "orange",
    dashArray: "8, 8",
  },
  {
    file: "ash_rail_trail.json",
    label: "Ashuwillticook Trail",
    color: "turquoise",
  },
  {
    file: "mount_vernon_trail.json",
    label: "Mount Vernon Trail",
    color: "orange",
  },
  {
    file: "delaware_canal_towpath.json",
    label: "Delaware Canal Towpath",
    color: "red",
  },
  // {
  //   file: "easton_to_bristol_pa_canal_trail.json",
  //   label: "Full Delaware Canal Towpath",
  //   color: "purple",
  // },
];

const trainLines = [
  {
    file: "boston_to_new_haven_amtrak.json",
    label: "Boston to New Haven (Amtrak)",
    color: amtrakColor,
    time: "2 hours and 23 minutes",
    opacity: 1,
  },
  {
    file: "boston_to_pittsfield_amtrak_lake_shore_limited.json",
    label: "Boston to Pittsfield (Amtrak)",
    color: amtrakColor,
    time: "3 hours and 52 minutes",
    stops: 5,
    stopNames: [
      "Back Bay",
      "Framingham",
      "Worcester",
      "Springfield",
      "Pittsfield",
    ],
    opacity: 1,
  },
];

function loadTrail(trail) {
  fetch(trail.file)
    .then((res) => res.json())
    .then((data) => {
      const coords = polyline
        .decode(data.routes[0].overview_polyline.points)
        .map(([lat, lng]) => [lat, lng]);

      L.polyline(coords, {
        color: trail.color,
        weight: 4,
        opacity: trail.opacity || 0.5,
        dashArray: trail.dashArray || null,
      })
        .bindTooltip(trail.label, {
          permanent: true,
          direction: "right",
          className: "route-label",
        })
        .addTo(map);

      if (trail.label.includes("Minuteman")) {
        calculateProgressWithCoords(coords);
      }
    })
    .catch((err) => console.error(`Failed loading trail ${trail.file}:`, err));
}

// === Ridden Progress ===
function loadRiddenSegment(file, color) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      const coords = polyline
        .decode(data.routes[0].overview_polyline.points)
        .map(([lat, lng]) => [lat, lng]);

      L.polyline(coords, {
        color,
        weight: 4,
        opacity: 0.5,
      })
        .bindTooltip("Ridden Segment", {
          permanent: false,
          direction: "right",
          className: "route-label",
        })
        .addTo(riddenLayer);
    })
    .catch((err) =>
      console.error(`Failed loading ridden segment ${file}:`, err),
    );
}

// === Transit Lines ===
function loadGeoJSONLine(file, color) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      L.geoJSON(data, {
        style: { color, weight: 3, opacity: 0.9 },
      }).addTo(map);
    })
    .catch((err) => console.error(`Failed loading line ${file}:`, err));
}

function loadFilteredGeoJSONLine(file, color, routeName) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      console.log("Loading line, routeName:", routeName);
      console.log(
        "Sample routes:",
        data.features?.slice(0, 3).map((f) => f.properties?.Route_Name),
      );
      const filtered = {
        type: "FeatureCollection",
        features: (data.features || []).filter(
          (f) => f.properties && f.properties.Route_Name === routeName,
        ),
      };

      if (!filtered.features.length) {
        console.warn(`No features found for route "${routeName}" in ${file}`);
        return;
      }

      L.geoJSON(filtered, {
        style: { color, weight: 3, opacity: 0.9 },
      }).addTo(map);
    })
    .catch((err) =>
      console.error(
        `Failed loading filtered line ${file} (${routeName}):`,
        err,
      ),
    );
}

// === Transit Stations ===
function loadStations(file, color) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      L.geoJSON(data, {
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 5,
            fillColor: "#fff",
            color,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9,
          }),
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(feature.properties.stop_name, {
            direction: "top",
            className: "route-label",
          });
        },
      }).addTo(map);
    })
    .catch((err) => console.error(`Failed loading stations ${file}:`, err));
}

function loadFilteredStations(file, color, lineName) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      console.log("Loading stations, lineName:", lineName);
      console.log(
        "Sample features:",
        data.features?.slice(0, 3).map((f) => f.properties?.Line_Name),
      );
      const filtered = {
        type: "FeatureCollection",
        features: (data.features || []).filter(
          (f) => f.properties && f.properties.Line_Name === lineName,
        ),
      };

      if (!filtered.features.length) {
        console.warn(`No stations found for "${lineName}" in ${file}`);
        return;
      }

      L.geoJSON(filtered, {
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 5,
            fillColor: "#fff",
            color,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9,
          }),
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(feature.properties.Station_Na, {
            direction: "top",
            className: "route-label",
          });
        },
      }).addTo(map);
    })
    .catch((err) =>
      console.error(`Failed loading filtered stations ${file}:`, err),
    );
}

// === Progress Calculation ===
function calculateProgressWithCoords(riddenLatLngs) {
  fetch("minuteman.json")
    .then((res) => res.json())
    .then((data) => {
      const fullCoords = polyline
        .decode(data.routes[0].overview_polyline.points)
        .map(([lat, lng]) => [lng, lat]);

      const fullLine = turf.lineString(fullCoords);
      const riddenLine = turf.lineString(
        riddenLatLngs.map(([lat, lng]) => [lng, lat]),
      );

      const totalMiles = turf.length(fullLine, { units: "miles" });
      const riddenMiles = turf.length(riddenLine, { units: "miles" });
      const percent = (riddenMiles / totalMiles) * 100;

      document.getElementById("completionBox").innerHTML = `
        <strong>Minuteman Trail</strong><br>
        Completed: ${riddenMiles.toFixed(2)} mi<br>
        Remaining: ${(totalMiles - riddenMiles).toFixed(2)} mi<br>
        Total: ${totalMiles.toFixed(2)} mi<br>
        (${percent.toFixed(1)}%)
      `;
    })
    .catch((err) =>
      console.error("Failed calculating Minuteman progress:", err),
    );
}

// === Load All Layers ===
trails.forEach(loadTrail);

// === Shoreline Greenway Trail (GPX)
new L.GPX("shoreline_greenway_trail.gpx", {
  async: true,
  polyline_options: {
    color: "#FF6347",
    weight: 4,
    opacity: 0.7,
  },
  marker_options: {
    startIconUrl: null,
    endIconUrl: null,
    shadowUrl: null,
    wptIcons: false,
  },
})
  .on("loaded", function (e) {
    const center = e.target.getBounds().getCenter();
    L.tooltip({
      permanent: true,
      direction: "right",
      className: "route-label",
    })
      .setContent("Shoreline Greenway Trail")
      .setLatLng(center)
      .addTo(map);
  })
  .addTo(map);

loadRiddenSegment("current_minuteman.json", "#0074D9");

loadGeoJSONLine("fitchburg_line.geojson", commuterRailPurple);
loadStations("fitchburg_stations.geojson", commuterRailPurple);

// === Add Lowell Line
loadGeoJSONLine("lowell_line.geojson", "#FF69B4");
loadStations("lowell_stations.geojson", "#FF69B4");

// === Add Newburyport/Rockport Line
loadGeoJSONLine("newburyport_rockport_line.geojson", commuterRailPurple);
loadStations("newburyport_stations.geojson", commuterRailPurple);

loadGeoJSONLine("providence_line.geojson", commuterRailPurple);

// === Pennypack Trail (GeoJSON)
loadGeoJSONLine("pennypack-trails.geojson", "green");

// === Regional Rail Lines (SEPTA)
loadFilteredGeoJSONLine("Regional_Rail_Lines.geojson", "teal", "West Trenton");
loadFilteredStations(
  "Regional_Rail_Stations.geojson",
  "teal",
  "West Trenton Line",
);
loadFilteredStations("Regional_Rail_Stations.geojson", "teal", "Joint");

// === Lansdale/Doylestown Line
loadFilteredGeoJSONLine(
  "Regional_Rail_Lines.geojson",
  "teal",
  "Lansdale/Doylestown",
);
loadFilteredStations(
  "Regional_Rail_Stations.geojson",
  "teal",
  "Lansdale Doylestown Line",
);
loadFilteredStations("Regional_Rail_Stations.geojson", "teal", "Joint");

// === Manayunk/Norristown Line (for Manayunk station)
loadFilteredGeoJSONLine(
  "Regional_Rail_Lines.geojson",
  "orange",
  "Manayunk/Norristown",
);
loadFilteredStations(
  "Regional_Rail_Stations.geojson",
  "orange",
  "Manayunk/Norristown Line",
);
loadFilteredStations("Regional_Rail_Stations.geojson", "orange", "Joint");

// === Add Amtrak Lines
trainLines.forEach(loadTrail);

const locations = [
  {
    name: "Peace Valley Park",
    town: "Durham, PA",
    coords: [40.326824, -75.189025],
    videoId: "tFVdSSulkuc",
    description:
      "Scenic loop around Lake Galena with paved paths, perfect for families.",
    train: "Warminster Line to Glenside, then 3 mi bike",
    bestAccess: "Best: Glenside",
    startTime: 60,
  },
  {
    name: "Delaware Canal Towpath",
    town: "Yardley, PA",
    coords: [40.2228, -74.8402],
    videoId: "wpiqDDHAK4A",
    description:
      "Flat 60-mile historic canal towpath through charming river towns.",
    train: "West Trenton Line",
    bestAccess: "Best: Yardley",
    startTime: 150,
  },
  {
    name: "Pennypack Creek Trail",
    town: "Philadelphia, PA",
    coords: [40.0345, -75.0093],
    videoId: "Fw00KZ08IVA",
    description: "Paved 13-mile trail following the creek through NE Philly.",
    train: "Fox Chase or Bethayres stations",
    bestAccess: "Best: Bethayres",
    startTime: 57,
  },
  {
    name: "Schuylkill River Trail",
    town: "Philadelphia, PA",
    coords: [39.9815, -75.1899],
    videoId: "xNeGmf3j99E",
    description:
      "60+ mile regional network along the Schuylkill, city to nature.",
    train: "Manayunk, Conshohocken, and other regional stops",
    bestAccess: "Best: Manayunk",
    startTime: 60,
  },
];

function openPanel(location) {
  console.log("openPanel called for:", location.name);
  document.getElementById("location-name").textContent = location.name;
  document.getElementById("location-town").textContent = location.town;
  document.getElementById("location-description").textContent = location.description;
  document.getElementById("location-train").textContent = location.train;
  document.getElementById("best-access-inline").textContent = location.bestAccess ? `★ ${location.bestAccess}` : "";
  const startTime = location.startTime || 60;
  document
    .getElementById("video-iframe")
    .setAttribute(
      "src",
      `https://www.youtube.com/embed/${location.videoId}?autoplay=1&mute=1&start=${startTime}`,
    );
  
  const panel = document.getElementById("side-panel");
  panel.classList.add("open");
  
  // Mobile: default to peek state
  if (window.innerWidth <= 600) {
    panel.classList.add("peek");
  }
  
  document.getElementById("panel-overlay").classList.add("show");
  map.flyTo(location.coords, 13);
}

function closePanel() {
  const panel = document.getElementById("side-panel");
  panel.classList.remove("open", "peek");
  document.getElementById("panel-overlay").classList.remove("show");
  document.getElementById("video-iframe").setAttribute("src", "");
  map.flyTo(map.getCenter(), 9);
}

document.getElementById("side-panel-close")?.addEventListener("click", closePanel);
document.getElementById("mobile-close")?.addEventListener("click", closePanel);
document.getElementById("panel-overlay")?.addEventListener("click", closePanel);

// Mobile bottom sheet handling
const dragHandle = document.getElementById("drag-handle");
const sidePanel = document.getElementById("side-panel");

dragHandle?.addEventListener("click", () => {
  sidePanel.classList.toggle("peek");
});

let touchStartY = 0;
dragHandle?.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});

dragHandle?.addEventListener("touchmove", (e) => {
  const deltaY = e.touches[0].clientY - touchStartY;
  if (deltaY < -30) {
    sidePanel.classList.remove("peek");
  } else if (deltaY > 30) {
    sidePanel.classList.add("peek");
  }
});

const alexandriaCoords = [38.804744285975715, -77.0435299474239];

locations.forEach((loc) => {
  L.circleMarker(loc.coords, {
    radius: 8,
    fillColor: "green",
    color: "white",
    weight: 2,
    fillOpacity: 0.9,
  })
    .bindTooltip(loc.name, {
      permanent: true,
      direction: "top",
      className: "route-label",
    })
    .on("click", () => openPanel(loc))
    .addTo(map);
});

const peaceValleyPark = [40.326824, -75.189025];

// === Buttons ===
function panToBoston() {
  map.flyTo([42.3601, -71.0589], 10);
}

function panToPhilly() {
  map.flyTo([39.9526, -75.1652], 10);
}

function panToAlexandria() {
  map.flyTo(alexandriaCoords, 10);
}
