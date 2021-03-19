import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";

function App() {
  const {
    position,
    allowedGeolocation,
    requestGeolocation,
    error,
  } = useCurrentPosition();

  return (
    <div>
      <h1>Geolocalized videos</h1>
      {error?.message}

      {!allowedGeolocation ? (
        <>
          <p>You have not allowed access to your geolocation.</p>
          <button onClick={requestGeolocation}>Geolocalize me!</button>
        </>
      ) : !position ? (
        <p>Your position is not available yet.</p>
      ) : (
        <p>
          You are here: {position.coords.latitude}, {position.coords.longitude}
          <br />
          The accuracy is {position.coords.accuracy}
        </p>
      )}
    </div>
  );
}

function useCurrentPosition() {
  const [position, setPosition] = useState<GeolocationPosition>();
  const [allowedGeolocation, setAllowedGeolocation] = useState<boolean>(false);
  const [error, setError] = useState<GeolocationPositionError>();
  const watchRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

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

  return {
    position,
    error,
    allowedGeolocation,
    requestGeolocation,
  };
}

export default App;
