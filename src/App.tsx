import "./App.css";
import { useEffect, useRef, useState } from "react";



function App() {
  const { position, allowedGeolocation } = useCurrentPosition();

  return (
    <div>
      <h1>Geolocalized videos</h1>

      {!allowedGeolocation || !position ? (
        <p>Could not get your position</p>
      ) : (
        <p>Nice, here is your position {position.coords.latitude}, {position.coords.longitude}
        <br/>
        The accuracy is {position.coords.accuracy}
        </p>
      )}
    </div>
  );
}


function useCurrentPosition() {
  const [position, setPosition] = useState<GeolocationPosition>();
  const [allowedGeolocation, setAllowedGeolocation] = useState<boolean>(false);
  const watchRef = useRef<number>();

  useEffect(() => {
    if (!allowedGeolocation) {
      // Request geolocation
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition(pos);
          setAllowedGeolocation(true);
        }, 
        (_error) => {
          setAllowedGeolocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 0,
          maximumAge: 0
        }
      );
    }
  }, [allowedGeolocation]);


  return {
    position, allowedGeolocation
  }
}

export default App;
