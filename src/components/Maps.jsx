import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvent,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { restaurantsData } from "../data/addresses";

function MapEvents({ setVisibleRestaurants, allRestaurants }) {
  const map = useMapEvent("moveend", () => {
    updateVisibleRestaurants();
  });

  // Debounced filter inside the scope that has access to map
  const updateVisibleRestaurants = debounce(() => {
    if (!map) return;

    const bounds = map.getBounds();

    const visible = allRestaurants.filter((restaurant) => {
      const [lat, lng] = restaurant.position;
      return bounds.contains([lat, lng]);
    });

    setVisibleRestaurants(visible);
  }, 300);

  return null;
}

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

function ChangeView({ center }) {
  if (!center) return null;
  const map = useMap();
  map.setView(center, 15);
  return null;
}

export default function Maps() {
  const [position, setPosition] = useState(null);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState(null);
  const [visibleRestaurants, setVisibleRestaurants] = useState([]);
  const [hoveredRestaurantName, setHoveredRestaurantName] = useState(null);
  const canDeselect = useRef(true); // autorise/désautorise la déselection

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [restaurants, setRestaurants] = useState(restaurantsData);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
      },
      (error) => {
        console.error("Erreur de géolocalisation :", error);
      }
    );
  }, []);

  const markerRefs = useRef({});

  function MapInteractionDeselector({
    setSelectedRestaurantName,
    markerRefs,
    canDeselect,
  }) {
    useMapEvent("movestart", () => {
      if (!canDeselect.current) return;

      // Fermer les popups
      Object.values(markerRefs.current).forEach((marker) => {
        if (marker && marker.getPopup()) {
          marker.closePopup();
        }
      });

      setSelectedRestaurantName(null);
    });

    return null;
  }

  function MapClickDeselector({ setSelectedRestaurantName, markerRefs }) {
    useMapEvent("click", (e) => {
      // Ferme tous les popups
      Object.values(markerRefs.current).forEach((marker) => {
        if (marker && marker.getPopup()) {
          marker.closePopup();
        }
      });

      // Déselectionne le restaurant
      setSelectedRestaurantName(null);
      setPosition(null);
    });

    return null;
  }

  return (
    <>
      <div className="bg-blue-200 p-4 w-2xs">
        <ul>
          {visibleRestaurants.map((restaurant) => (
            <li
              key={restaurant.name}
              className={`cursor-pointer hover:text-blue-500 ${
                selectedRestaurantName === restaurant.name
                  ? "font-bold text-blue-700"
                  : ""
              } ${
                hoveredRestaurantName === restaurant.name
                  ? " text-blue-700"
                  : ""
              }`}
              onClick={() => {
                canDeselect.current = false;
                setPosition(restaurant.position);
                setSelectedRestaurantName(restaurant.name);

                const marker = markerRefs.current[restaurant.name];
                if (marker) {
                  marker.openPopup();
                }

                // Autoriser la déselection après 500ms
                setTimeout(() => {
                  canDeselect.current = true;
                }, 500);
              }}
              onMouseEnter={() => {
                const marker = markerRefs.current[restaurant.name];
                if (marker) {
                  marker.openPopup();
                }
              }}
              onMouseLeave={() => {
                const marker = markerRefs.current[restaurant.name];
                // ⚠️ Ne ferme la popup que si ce n’est pas le restaurant sélectionné
                if (marker && selectedRestaurantName !== restaurant.name) {
                  marker.closePopup();
                }
              }}
            >
              {restaurant.name}
            </li>
          ))}
        </ul>
      </div>
      <MapContainer
        center={{ lng: 7.289429, lat: 43.675819 }}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickDeselector
          setSelectedRestaurantName={setSelectedRestaurantName}
          markerRefs={markerRefs}
        />

        <MapInteractionDeselector
          setSelectedRestaurantName={setSelectedRestaurantName}
          markerRefs={markerRefs}
          canDeselect={canDeselect}
        />

        <MapEvents
          setVisibleRestaurants={setVisibleRestaurants}
          allRestaurants={restaurants}
        />

        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.name}
            position={restaurant.position}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[restaurant.name] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                setSelectedRestaurantName(restaurant.name);
                setPosition(restaurant.position);
              },
              popupclose: () => {
                setPosition(null);
                setSelectedRestaurantName((current) => {
                  // Sélectionne uniquement si c’était ce restaurant qui était actif
                  if (current === restaurant.name) {
                    return null;
                  }
                  return current;
                });
              },
              mouseover: () => {
                setHoveredRestaurantName(restaurant.name);
              },
              mouseout: () => {
                setHoveredRestaurantName((current) =>
                  current === restaurant.name ? null : current
                );
              },
            }}
          >
            <Popup>{restaurant.name}</Popup>
          </Marker>
        ))}
        <ChangeView center={position} />
      </MapContainer>
    </>
  );
}
