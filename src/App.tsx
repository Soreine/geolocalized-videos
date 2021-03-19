import "./App.css";
import Airtable from "airtable";
import { useCallback, useEffect, useRef, useState } from "react";
import * as geolib from "geolib";

const airtable = new Airtable({
  endpointUrl: "https://api.airtable.com",
  apiKey: "keyltQcyRHEagy0dx",
});

const AIRTABLE_BASE_ID = "appdsqXVnVAuna4Gv";

const base = airtable.base(AIRTABLE_BASE_ID);

type VideoRecord = {
  name: string;
  url: string;
  coordinates: { latitude: number; longitude: number };
};

function App() {
  const {
    position,
    allowedGeolocation,
    requestGeolocation,
    error,
  } = useCurrentPosition();

  const { records } = useVideoBase();

  const nearestVideo = position
    ? getNearestVideoRecord(position, records)
    : undefined;

  return (
    <div>
      <h1>Geolocalized videos</h1>
      {error?.message}

      <p>
        This is a prototype for discovering videos based on your geolocation.
        Listed videos can be managed in an Airtable database (here is a{" "}
        <a target="blank" href="https://airtable.com/shrgqURG16hG1pjoJ">
          read-only
        </a>{" "}
        view of the one used here).
      </p>

      <h2>Your Position</h2>
      {!allowedGeolocation ? (
        <>
          <p>You have not allowed access to your geolocation.</p>
          <button onClick={requestGeolocation}>Geolocalize me!</button>
        </>
      ) : !position ? (
        <p>Your position is not available yet.</p>
      ) : (
        <>
          {nearestVideo && (
            <p>
              The nearest video is{" "}
              <VideoItem position={position} record={nearestVideo} />
            </p>
          )}

          <table>
            <tr>
              <td>Latitude</td>
              <td>{position.coords.latitude}</td>
            </tr>
            <tr>
              <td>Longitude</td>
              <td>{position.coords.longitude}</td>
            </tr>
            <tr>
              <td>Accuracy (m)</td>
              <td>{position.coords.accuracy}</td>
            </tr>
          </table>
          <p>
            You may get better accuracy on mobile by disconnecting your WiFi
            (which could force the switch to using GPS).
          </p>
        </>
      )}

      <h2>Video library</h2>
      <ul>
        {records.map((rec) => {
          return (
            <li key={rec.name}>
              <VideoItem position={position} record={rec} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VideoItem({
  record,
  position,
}: {
  record: VideoRecord;
  position?: GeolocationPosition;
}) {
  return (
    <span>
      <a href={record.url} target="blank">
        <b>{record.name}</b>
      </a>{" "}
      {position && (
        <span>
          at {getDistance(position, record.coordinates)}m (open in{" "}
          <a href={getGoogleMapUrl(record.coordinates)} target="blank">
            Maps
          </a>
          )
        </span>
      )}
    </span>
  );
}

function getDistance(
  position: GeolocationPosition,
  from: { latitude: number; longitude: number },
): number {
  return geolib.getDistance(
    {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
    from,
  );
}

function getGoogleMapUrl(coords: { latitude: number; longitude: number }) {
  return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
}

function getNearestVideoRecord(
  position: GeolocationPosition,
  records: VideoRecord[],
): VideoRecord | undefined {
  const closestPos = geolib.findNearest(
    position.coords,
    records.map((rec) => rec.coordinates),
  );

  return records.find((rec) => rec.coordinates === closestPos);
}

function useCurrentPosition() {
  const [position, setPosition] = useState<GeolocationPosition>(({
    coords: {
      accuracy: 65,
      altitude: 163.81744384765625,
      altitudeAccuracy: 10,
      heading: null,
      latitude: 43.60116811420791,
      longitude: 1.4602456098077312,
    },
  } as unknown) as GeolocationPosition);
  const [allowedGeolocation, setAllowedGeolocation] = useState<boolean>(false);
  const [error, setError] = useState<GeolocationPositionError>();
  const watchRef = useRef<number>();

  // To be used when clicking a button
  const requestGeolocation = useCallback(() => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    // Request geolocation
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setAllowedGeolocation(true);
      },
      (_error) => {
        if (_error.code === GeolocationPositionError.PERMISSION_DENIED) {
          setAllowedGeolocation(false);
        } else {
          setError(_error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 30000,
      },
    );
  }, []);

  useEffect(() => {
    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    allowedGeolocation,
    requestGeolocation,
  };
}

function useVideoBase() {
  const [records, setRecords] = useState<Array<VideoRecord>>([]);

  useEffect(() => {
    base("Videos")
      .select()
      .eachPage(
        (records, _fetchNextPage) => {
          const parsedRecords = records.map((record) => {
            const [latitude, longitude] = (
              (record.get("Position") as string) ?? ""
            )
              .split(",")
              .map((s) => Number(s));

            return {
              name: (record.get("Name") as string) ?? "",
              url: (record.get("Link") as string) ?? "",
              coordinates: { latitude, longitude },
            };
          });

          const filteredRecords = parsedRecords.filter(
            (rec) =>
              rec.name &&
              rec.url &&
              !isNaN(rec.coordinates.latitude) &&
              !isNaN(rec.coordinates.longitude),
          );

          setRecords(filteredRecords);
        },
        (error) => {
          setRecords([]);
        },
      );
  }, []);

  return { records };
}

export default App;
