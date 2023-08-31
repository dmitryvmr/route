import React, { useEffect, useState } from "react";

// CSS
import "../css/map.css";

// Recharts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Leaflet Map App
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Polyline,
  MapConsumer,
  LayersControl
} from "react-leaflet";

// Progress bar
import ProgressBar from "./progress-bar";

// Main functions
const mainFunctions = require("../functions/main-functions");

// Icons leaflet
const icon = L.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png"
});

// Map's params
var oldMarker = []; // define the old marker to display dynamicallly the marker on map
//const position = [48.51818203676423, 0.5484580993652345];
const position = [42.83468845508063, -7.896423339843751];
const zoom = 8;
const style = { height: "400px", marginBottom: "20px" };
const mapViewFormatObj = {
  OpenTopoMap: {
    formatName: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  OpenStreetMapMapnik: {
    formatName: "OpenStreetMapMapnik",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  },
  CycloOSM: {
    formatName: "CycloOSM",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution:
      '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  EsriWorldTopoMap: {
    formatName: "EsriWorldTopoMap",
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
  }
};

// MAP DISPLAY COMPONENT
const MapDisplay = () => {
  // Add marker function
  const addPoint = (map) => {
    map.target.on("click", function (e) {
      const { lat, lng } = e.latlng;
      console.log(`${lat} ${lng}`);
      L.marker([lat, lng], { icon }).addTo(map.target);
    });
  };

  // States
  const [value, updateValue] = useState(0);
  const [gpxData, setGpxData] = useState([]);
  const [mergedElevations, setMergedElevations] = useState([]);
  const [elevationsData, setElevationsData] = useState([]);
  const [trackColor, setTrackColor] = useState([]);
  const [tracksNamesArray, setTracksNamesArray] = useState([]);
  const [newMarker, setNewMarker] = useState([]);
  const [distance, setDistance] = useState([]);

  // Side effects
  useEffect(() => {
    // Progess bar
    const interval = setInterval(() => {
      // Run this every second
      updateValue((oldValue) => {
        // Update the value by 10
        const newValue = oldValue + 10;

        if (newValue === 100) {
          // If the value hits 100, clear the interval
          clearInterval(interval);
        }

        return newValue;
      });
    });

    // Set GPX
    const setGpx = async () => {
      // Params
      let namesResultArray = [];
      let elevationsResultArray = [];
      let positionsResResultArray = [];

      // Get all gpx filenames
      const gpxFilenamesArray = await mainFunctions.getAllGpxFilenamesDirectory();

      // Get informations foreach gpx file
      gpxFilenamesArray.sort().forEach(async (gpxName, i) => {
        // Parse gpx (use this code when you are out the codesandbox)
        /*const parseGpxData = await mainFunctions.parseGpxFile(
          process.env.PUBLIC_URL +
            "/gpx/" +
            encodeURIComponent(gpxName) +
            ".gpx"
        );*/

        const parseGpxData = await mainFunctions.parseGpxFile(
          window.location.href + "/gpx/" + encodeURIComponent(gpxName) + ".gpx"
        );

        // Get the min & the max elevation from all tracks contained into a single gpx file
        const minMaxElevations = await mainFunctions.getMinMaxElevation(
          parseGpxData
        );
        setElevationsData((oldArray) => [...oldArray, minMaxElevations]);

        // Random track's color
        var trackColorRandom = await mainFunctions.randomColorPalette();
        setTrackColor((oldArray) => [...oldArray, trackColorRandom]);

        // Tracks positions
        const trackPositions = await mainFunctions.getTracksPositions(
          parseGpxData
        );
        positionsResResultArray.push(trackPositions);
        setGpxData((oldArray) => [...oldArray, trackPositions]);

        // Distance in meter
        let totalDistance = await mainFunctions.trackDistanceCalculation(
          trackPositions
        );
        setDistance((oldArray) => [
          ...oldArray,
          (totalDistance / 1000).toFixed(2)
        ]);

        // Record elevations
        elevationsResultArray.push({ id: i, data: parseGpxData });

        // Get tracks names
        const tracksNames = await mainFunctions.getTracksNamesArray(
          parseGpxData,
          i
        );
        tracksNames.forEach((element) => {
          namesResultArray.push(element);
        });

        // End loop
        if (gpxFilenamesArray.length === i + 1) {
          // Get array of elevations data objects to Recharts NPM
          let elevationsObj = await mainFunctions.elevationsObject(
            elevationsResultArray
          );
          setMergedElevations(elevationsObj);

          // Sort names array of objects by id properties
          namesResultArray = namesResultArray.sort((a, b) =>
            a.id > b.id ? 1 : -1
          );

          // Names record
          namesResultArray.forEach((element) => {
            setTracksNamesArray((oldArray) => [...oldArray, element.name]);
          });
        }
      });
    };

    setGpx();
  }, []);

  return (
    <>
      {value === 100 ? (
        <MapContainer
          center={position}
          zoom={zoom}
          style={style}
          whenReady={async (map) => {
            addPoint(map);
          }}
        >
          {/* Multiple tracks */}
          {gpxData.map((dataTrack, i) => {
            return (
              <Polyline
                key={i}
                pathOptions={{ fillColor: "red", color: trackColor[i] }}
                positions={dataTrack}
              />
            );
          })}

          <MapConsumer>
            {(map) => {
              // Display dynamically a marker on map whane mouse on over the elevations charts
              if (newMarker.length !== 0) {
                // Compare two arrays
                let result =
                  newMarker.length === oldMarker.length &&
                  newMarker.every(function (element, index) {
                    return element === oldMarker[index]; // compare if the element matches in the same index
                  });

                if (!result) {
                  // Remove the old marker
                  map.removeLayer(oldMarker);

                  // Redefine the new "old" marker
                  oldMarker = L.marker(newMarker, { icon }).addTo(map);
                }
              } else {
                // Remove old marker when mouse leave charts
                map.removeLayer(oldMarker);
              }

              return null;
            }}
          </MapConsumer>

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenTopoMap">
              <TileLayer
                attribution={mapViewFormatObj.OpenTopoMap.attribution}
                url={mapViewFormatObj.OpenTopoMap.url}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="EsriWorldTopoMap">
              <TileLayer
                attribution={mapViewFormatObj.EsriWorldTopoMap.attribution}
                url={mapViewFormatObj.EsriWorldTopoMap.url}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="CyclOSM">
              <TileLayer
                attribution={mapViewFormatObj.CycloOSM.attribution}
                url={mapViewFormatObj.CycloOSM.url}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution={mapViewFormatObj.OpenStreetMapMapnik.attribution}
                url={mapViewFormatObj.OpenStreetMapMapnik.url}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
        </MapContainer>
      ) : (
        <ProgressBar value={value} />
      )}

      {/*ELEVATIONS CHARTS*/}
      <div className="recharts">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={800}
            height={200}
            data={mergedElevations}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0
            }}
            onMouseLeave={(map) => {
              setNewMarker([]);
            }}
            onMouseMove={(e) => {
              // Response obj
              let arr = e.activePayload;

              if (typeof arr !== "undefined") {
                // Params
                let lat = arr[0].payload.position.lat;
                let lon = arr[0].payload.position.lon;

                // Record
                setNewMarker([lat, lon]);
              }
            }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="elevation"
              dot={false}
              activeDot={true}
              stroke="#1D8A00"
              fill="#CBFFBD"
              legendType="star"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/*TRACKS NAMES*/}
      <h1>Tracks name</h1>
      {tracksNamesArray.map((element, t) => {
        return (
          <p className="stages" key={t}>
            <span>
              <strong>
                #{t + 1} {element}
              </strong>
            </span>
            <br />
            <span>Distance: </span>
            <span>{distance[t]} km</span>
            <br />
            <span>Elevations: </span>
            <span>min: {elevationsData[t].min} m</span>
            <span> - </span>
            <span>max: {elevationsData[t].max} m</span>
          </p>
        );
      })}
    </>
  );
};

export default MapDisplay;
