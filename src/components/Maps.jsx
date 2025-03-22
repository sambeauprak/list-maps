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

const cities = [
  {
    name: "Nice",
    position: [43.70313, 7.26608],
  },
  {
    name: "Cannes",
    position: [43.55135, 7.01275],
  },
  {
    name: "Monaco",
    position: [43.73141, 7.42082],
  },
  {
    name: "Lyon",
    position: [45.75781, 4.83201],
  },
  {
    name: "Paris",
    position: [48.8566, 2.3522],
  },
];

const restaurants = [
  {
    name: "Le Réfectoire - 13 Solidaires",
    address: "171 Chem. de la Madrague-Ville, 13002 Marseille",
  },
  {
    name: "Le République",
    address: "1 Pl. Sadi-Carnot, 13002 Marseille",
  },
  {
    name: "Le plan de A à Z",
    address: "117 La Canebière, 13001 Marseille",
  },
  {
    name: "Le Restaurant De La Gaité",
    address: "35 Rue du Dr Léon Perrin, 13003 Marseille",
  },
  {
    name: "Restaurant Social Noga",
    address: "74 Cr Julien, 13006 Marseille",
  },
  {
    name: "L'Après M",
    address: "214 Chem. de Sainte-Marthe, 13014 Marseille",
  },
];

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

async function fetchCoordinates(address) {
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}`
  );
  const data = await response.json();
  if (data.features.length > 0) {
    const { geometry } = data.features[0];
    return [geometry.coordinates[1], geometry.coordinates[0]]; // [latitude, longitude]
  } else {
    console.error(`Aucune coordonnée trouvée pour l'adresse : ${address}`);
    return null;
  }
}

async function geocodeRestaurants(restaurants) {
  const geocodedRestaurants = [];
  for (const restaurant of restaurants) {
    const position = await fetchCoordinates(restaurant.address);
    if (position) {
      geocodedRestaurants.push({ ...restaurant, position });
    }
  }
  return geocodedRestaurants;
}

export default function Maps() {
  const [position, setPosition] = useState([43.675819, 7.289429]);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState(null);
  const [visibleRestaurants, setVisibleRestaurants] = useState([]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const fetchAddresses = async (search) => {
    if (search.length < 3) {
      setSuggestions([]);
      return;
    }
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${search}`
    );
    const data = await response.json();
    if (data.features) {
      setSuggestions(
        data.features.map((item) => ({
          label: item.properties.label,
          position: [
            item.geometry.coordinates[1],
            item.geometry.coordinates[0],
          ],
        }))
      );
    }
  };

  // Appliquer le debounce à la recherche
  const debouncedFetch = debounce(fetchAddresses, 300);

  // Gestion du changement de saisie
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    debouncedFetch(e.target.value);
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      const geocodedRestaurants = await geocodeRestaurants([
        {
          name: "Le Réfectoire - 13 Solidaires",
          address: "171 Chem. de la Madrague-Ville, 13002 Marseille",
        },
        {
          name: "Le République",
          address: "1 Pl. Sadi-Carnot, 13002 Marseille",
        },
        {
          name: "Le plan de A à Z",
          address: "117 La Canebière, 13001 Marseille",
        },
        {
          name: "Le Restaurant De La Gaité",
          address: "35 Rue du Dr Léon Perrin, 13003 Marseille",
        },
        {
          name: "Restaurant Social Noga",
          address: "74 Cr Julien, 13006 Marseille",
        },
        {
          name: "L'Après M",
          address: "214 Chem. de Sainte-Marthe, 13014 Marseille",
        },
      ]);
      setRestaurants(geocodedRestaurants);
      setVisibleRestaurants(geocodedRestaurants);
    };

    fetchRestaurants();
  }, []);

  return (
    <>
      <div className="bg-blue-200 p-4 w-2xs">
        <h1>List</h1>
        <ul>
          {cities.map((city) => (
            <li
              key={city.name}
              className="cursor-pointer hover:text-blue-500"
              onClick={() => setPosition(city.position)}
            >
              {city.name}
            </li>
          ))}
        </ul>
        <>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Rechercher une adresse..."
            className="w-full p-2 border border-gray-300 rounded"
          />

          {suggestions.length > 0 && (
            <ul className="absolute bg-white w-full border border-gray-300 rounded mt-1 shadow-md z-10">
              {suggestions.map((item, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => {
                    setPosition(item.position);
                    setQuery(item.label);
                    setSuggestions([]);
                  }}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </>
        <h1 className="text-lg font-bold mb-2">
          Liste des restaurants visibles
        </h1>
        <ul>
          {visibleRestaurants.map((restaurant) => (
            <li
              key={restaurant.name}
              className={`cursor-pointer hover:text-blue-500 ${
                selectedRestaurantName === restaurant.name
                  ? "font-bold text-blue-700"
                  : ""
              }`}
              onClick={() => {
                setPosition(restaurant.position);
                setSelectedRestaurantName(restaurant.name);
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

        <MapEvents
          setVisibleRestaurants={setVisibleRestaurants}
          allRestaurants={restaurants}
        />

        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.name}
            position={restaurant.position}
            eventHandlers={{
              click: () => {
                setSelectedRestaurantName(restaurant.name);
                setPosition(restaurant.position);
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
