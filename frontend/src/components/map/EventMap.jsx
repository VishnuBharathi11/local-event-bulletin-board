import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  MapPin,
  Compass,
  ChevronDown,
  LayoutGrid,
  Activity,
  Music,
  Utensils,
  GraduationCap,
  Users,
  BookOpen,
  ShoppingBag,
  HeartHandshake,
  Tag,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext.jsx';
import { EVENT_CATEGORIES } from '../../state/discoveryState.js';
import { isPincode } from '../../utils/eventDiscovery.js';
import '../../styles/eventMap.css';

const DEFAULT_CENTER = {
  lat: 11.0168, // Coimbatore default coords
  lng: 76.9558
};

const LIBRARIES = ['places'];

// Established Category Metadata matching Event Board & Design System
const CATEGORY_META = {
  'All': {
    label: 'All Categories',
    icon: LayoutGrid,
    color: '#5E2EA8',
    bgColor: '#F3ECFA',
  },
  'Sports': {
    label: 'Sports',
    icon: Activity,
    color: '#16A34A',
    bgColor: '#DCFCE7',
  },
  'Music': {
    label: 'Music',
    icon: Music,
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  'Food': {
    label: 'Food',
    icon: Utensils,
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  'Workshops': {
    label: 'Workshops',
    icon: GraduationCap,
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  'Meetups': {
    label: 'Meetups',
    icon: Users,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
  'Student Events': {
    label: 'Student Events',
    icon: BookOpen,
    color: '#0D9488',
    bgColor: '#CCFBF1',
  },
  'Garage Sale': {
    label: 'Garage Sale',
    icon: ShoppingBag,
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  'Community': {
    label: 'Community',
    icon: HeartHandshake,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
};

function getCategoryConfig(categoryKey) {
  if (CATEGORY_META[categoryKey]) {
    return { id: categoryKey, ...CATEGORY_META[categoryKey] };
  }
  return {
    id: categoryKey,
    label: categoryKey,
    icon: Tag,
    color: '#5E2EA8',
    bgColor: '#F3ECFA',
  };
}

function extractDistrictFromResults(results) {
  if (!Array.isArray(results) || results.length === 0) return null;
  // 1. Scan all address components across all results for administrative_area_level_2 (District in India, County globally)
  for (const res of results) {
    if (Array.isArray(res?.address_components)) {
      const admin2 = res.address_components.find(
        (c) => c.types && c.types.includes('administrative_area_level_2')
      );
      if (admin2 && admin2.long_name) return admin2.long_name;
    }
  }
  // 2. Scan for postal_town, administrative_area_level_3, or sublocality
  for (const res of results) {
    if (Array.isArray(res?.address_components)) {
      const postalTown = res.address_components.find(
        (c) => c.types && c.types.includes('postal_town')
      );
      if (postalTown && postalTown.long_name) return postalTown.long_name;

      const admin3 = res.address_components.find(
        (c) => c.types && c.types.includes('administrative_area_level_3')
      );
      if (admin3 && admin3.long_name) return admin3.long_name;
    }
  }
  return null;
}

function formatPlaceAndDistrict(resultsOrComponents, selectedName) {
  if (!resultsOrComponents) {
    return selectedName ? selectedName.split(',')[0].trim() : null;
  }

  // Normalize: if passed array of results or single components array
  const isResultsArray =
    Array.isArray(resultsOrComponents) &&
    resultsOrComponents.length > 0 &&
    Boolean(resultsOrComponents[0]?.address_components);

  const results = isResultsArray
    ? resultsOrComponents
    : [{ address_components: Array.isArray(resultsOrComponents) ? resultsOrComponents : [] }];

  const primaryComponents = results[0]?.address_components || [];

  // 1. Extract District from results
  const district = extractDistrictFromResults(results);

  // 2. Extract Locality / Sublocality / Neighborhood / Admin 3
  const sublocality = primaryComponents.find(
    (c) =>
      c.types &&
      (c.types.includes('sublocality_level_1') ||
        c.types.includes('sublocality') ||
        c.types.includes('neighborhood') ||
        c.types.includes('point_of_interest'))
  );
  const locality = primaryComponents.find((c) => c.types && c.types.includes('locality'));
  const admin3 = primaryComponents.find((c) => c.types && c.types.includes('administrative_area_level_3'));
  const postalTown = primaryComponents.find((c) => c.types && c.types.includes('postal_town'));
  const admin1 = primaryComponents.find((c) => c.types && c.types.includes('administrative_area_level_1'));

  // Determine specific place name: Prefer selectedName, then sublocality, locality, admin3
  let place = null;
  if (selectedName && typeof selectedName === 'string' && selectedName.trim()) {
    place = selectedName.split(',')[0].trim();
  } else {
    place = sublocality?.long_name || locality?.long_name || admin3?.long_name || null;
  }

  // If we have a district
  if (district) {
    if (place && place.toLowerCase() !== district.toLowerCase()) {
      return `${place}, ${district}`;
    }
    return district;
  }

  // Fallback if no administrative_area_level_2:
  const fallbackArea = postalTown?.long_name || locality?.long_name || admin1?.long_name;
  if (fallbackArea) {
    if (place && place.toLowerCase() !== fallbackArea.toLowerCase()) {
      return `${place}, ${fallbackArea}`;
    }
    return fallbackArea;
  }

  return place || null;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function matchesViewFilter(startTime, viewFilter) {
  if (viewFilter === 'All Events') return true;
  const date = new Date(Number(startTime));
  if (Number.isNaN(date.getTime())) return true;
  const now = new Date();

  if (viewFilter === 'Today') {
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (viewFilter === 'This Week') {
    const oneWeek = now.getTime() + 7 * 24 * 60 * 60 * 1000;
    return date.getTime() >= now.getTime() && date.getTime() <= oneWeek;
  }

  if (viewFilter === 'This Weekend') {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  return true;
}

// Custom Event Marker with Event Image thumbnail + category color accent
const EventImageMarker = ({ event, categoryConfig, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const position = { lat: Number(event.latitude), lng: Number(event.longitude) };
  const IconComp = categoryConfig.icon;

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div
        className="map-image-marker"
        onClick={() => onClick(event)}
        title={event.title}
        style={{
          '--marker-accent': categoryConfig.color,
        }}
      >
        <div className="map-image-marker__pin">
          <div className="map-image-marker__img-container">
            {event.imageUrl && !imgError ? (
              <img
                src={event.imageUrl}
                alt=""
                className="map-image-marker__img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="map-image-marker__fallback"
                style={{
                  backgroundColor: categoryConfig.bgColor,
                  color: categoryConfig.color,
                }}
              >
                <IconComp size={22} strokeWidth={2.4} />
              </div>
            )}
          </div>
          <div className="map-image-marker__tip" />
        </div>
      </div>
    </OverlayView>
  );
};

// User location marker
const UserLocationPulseMarker = ({ position }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -(height / 2),
      })}
    >
      <div className="user-location-pulse" title="Your Location">
        <div className="user-location-pulse__ring" />
        <div className="user-location-pulse__dot">
          <Crosshair size={13} color="#ffffff" strokeWidth={2.5} />
        </div>
      </div>
    </OverlayView>
  );
};

// Searched Location Pin Marker
const SearchedLocationMarker = ({ position, name }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div className="map-searched-marker" title={name}>
        <div className="map-searched-marker__pin">
          <div className="map-searched-marker__badge">
            <MapPin size={18} color="#ffffff" strokeWidth={2.6} />
          </div>
          <div className="map-searched-marker__tip" />
        </div>
        {name && (
          <div className="map-searched-marker__label-bubble">
            <span>{name}</span>
          </div>
        )}
      </div>
    </OverlayView>
  );
};

export default function EventMap({
  events = [],
  onBackToList,
}) {
  const navigate = useNavigate();
  const { district } = useLocation();
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [currentUserDistrict, setCurrentUserDistrict] = useState(null);
  const [searchedLocationDistrict, setSearchedLocationDistrict] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Categories from application configuration
  const distinctCategories = useMemo(() => {
    return EVENT_CATEGORIES.filter((c) => c !== 'All');
  }, []);

  // Category filter state: initially all individual categories selected
  const [selectedCategories, setSelectedCategories] = useState(() => distinctCategories);

  // Synchronize if dynamic categories change
  useEffect(() => {
    setSelectedCategories((prev) => {
      const valid = prev.filter((c) => distinctCategories.includes(c));
      return valid.length > 0 ? valid : distinctCategories;
    });
  }, [distinctCategories]);

  const isAllCategoriesSelected =
    distinctCategories.length > 0 && selectedCategories.length === distinctCategories.length;

  const [viewFilter, setViewFilter] = useState('All Events');
  const [radiusFilter, setRadiusFilter] = useState('25 km');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);

  // Location Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(12);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  // Robust district & place resolver from coordinates
  const resolveLocationDistrict = useCallback((coords, placeName, onResolved) => {
    if (!coords) {
      if (placeName) onResolved(placeName);
      return;
    }

    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat: coords.lat, lng: coords.lng } }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const formatted = formatPlaceAndDistrict(results, placeName);
          if (formatted) {
            onResolved(formatted);
            return;
          }
        }
        // Fallback to open reverse geocoder
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.address) {
              const place =
                (placeName ? placeName.split(',')[0].trim() : null) ||
                data.address.village ||
                data.address.suburb ||
                data.address.neighbourhood ||
                data.address.town ||
                data.address.city;
              const dist =
                data.address.state_district ||
                data.address.district ||
                data.address.county ||
                data.address.state;
              if (place && dist && place.toLowerCase() !== dist.toLowerCase()) {
                onResolved(`${place}, ${dist}`);
              } else {
                onResolved(dist || place || placeName);
              }
            } else if (placeName) {
              onResolved(placeName);
            }
          })
          .catch(() => {
            if (placeName) onResolved(placeName);
          });
      });
    } else {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.address) {
            const place =
              (placeName ? placeName.split(',')[0].trim() : null) ||
              data.address.village ||
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.town ||
              data.address.city;
            const dist =
              data.address.state_district ||
              data.address.district ||
              data.address.county ||
              data.address.state;
            if (place && dist && place.toLowerCase() !== dist.toLowerCase()) {
              onResolved(`${place}, ${dist}`);
            } else {
              onResolved(dist || place || placeName);
            }
          } else if (placeName) {
            onResolved(placeName);
          }
        })
        .catch(() => {
          if (placeName) onResolved(placeName);
        });
    }
  }, []);

  // Reverse geocode user location coordinates to extract current place/district
  const reverseGeocodeUserLocation = useCallback((coords) => {
    if (!coords) return;
    resolveLocationDistrict(coords, null, (formatted) => {
      if (formatted) setCurrentUserDistrict(formatted);
    });
  }, [resolveLocationDistrict]);

  // Initialize Google Places & Geocoder services when script is loaded
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      if (window.google.maps.places && window.google.maps.places.AutocompleteService) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      geocoderRef.current = new window.google.maps.Geocoder();
      if (userLocation) {
        reverseGeocodeUserLocation(userLocation);
      }
    }
  }, [isLoaded, userLocation, reverseGeocodeUserLocation]);

  // Load User Location
  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setCenter(loc);
          reverseGeocodeUserLocation(loc);
          if (mapRef.current) {
            mapRef.current.panTo(loc);
            mapRef.current.setZoom(13);
          }
        },
        (err) => {
          console.warn('Geolocation permission error:', err);
        }
      );
    }
  }, [reverseGeocodeUserLocation]);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  // Adjust center if district coordinates or events exist
  useEffect(() => {
    if (!userLocation && events.length > 0) {
      const validEvent = events.find((e) => e.latitude && e.longitude);
      if (validEvent) {
        setCenter({ lat: Number(validEvent.latitude), lng: Number(validEvent.longitude) });
      }
    }
  }, [events, userLocation]);

  // Category toggle logic with strict synchronization
  const handleToggleCategory = (catId) => {
    if (catId === 'All') {
      if (isAllCategoriesSelected) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories([...distinctCategories]);
      }
      return;
    }

    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Filter events based on selected categories, view filter, and radius
  const filteredEvents = useMemo(() => {
    const radiusNumber = radiusFilter === 'All' ? Infinity : parseInt(radiusFilter, 10) || 25;
    const refPoint = userLocation || center;

    return events.filter((event) => {
      if (!event.latitude || !event.longitude) return false;
      const lat = Number(event.latitude);
      const lng = Number(event.longitude);
      if (isNaN(lat) || isNaN(lng)) return false;

      // 1. Category check
      const eventCategory = event.category || 'Community';
      if (!selectedCategories.includes(eventCategory)) return false;

      // 2. View / Date filter
      if (!matchesViewFilter(event.startTime, viewFilter)) return false;

      // 3. Radius filter
      if (radiusNumber !== Infinity && refPoint) {
        const dist = calculateDistanceKm(refPoint.lat, refPoint.lng, lat, lng);
        if (dist > radiusNumber) return false;
      }

      return true;
    });
  }, [events, selectedCategories, viewFilter, radiusFilter, userLocation, center]);

  // Map callbacks
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    map.setOptions({
      gestureHandling: 'greedy',
      disableDefaultUI: true,
    });
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Map Zoom & Fullscreen Controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // --------------------------------------------------------------------------
  // Global Worldwide Location Search & Autocomplete Implementation
  // --------------------------------------------------------------------------
  const fetchSuggestions = useCallback((text) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    const query = text.trim();

    // 1. Try Google Places AutocompleteService
    if (window.google?.maps?.places?.AutocompleteService) {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
          },
          (predictions, status) => {
            if (
              (status === window.google.maps.places.PlacesServiceStatus.OK || status === 'OK') &&
              predictions &&
              predictions.length > 0
            ) {
              const formatted = predictions.slice(0, 6).map((p) => ({
                placeId: p.place_id,
                mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
                secondaryText:
                  p.structured_formatting?.secondary_text ||
                  p.description.split(',').slice(1).join(', ').trim(),
                description: p.description,
              }));
              setSuggestions(formatted);
              setShowSuggestions(true);
              setIsSearching(false);
              return;
            }

            // If Places Autocomplete returned zero results or non-OK status, fallback to Geocoder
            fallbackGeocodeSuggestions(query);
          }
        );
        return;
      } catch (err) {
        console.warn('Google Places Autocomplete error:', err);
        fallbackGeocodeSuggestions(query);
        return;
      }
    }

    // 2. Fallback to Google Geocoder
    fallbackGeocodeSuggestions(query);
  }, []);

  const fallbackGeocodeSuggestions = useCallback((query) => {
    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const formatted = results.slice(0, 5).map((r) => ({
            placeId: r.place_id,
            mainText: r.address_components?.[0]?.long_name || r.formatted_address.split(',')[0],
            secondaryText: r.formatted_address.split(',').slice(1).join(', ').trim(),
            description: r.formatted_address,
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
          }));
          setSuggestions(formatted);
          setShowSuggestions(true);
          setIsSearching(false);
          return;
        }

        // Global fallback to Nominatim open geocoding service for 100% global coverage
        fetchGlobalNominatimSuggestions(query);
      });
    } else {
      fetchGlobalNominatimSuggestions(query);
    }
  }, []);

  const fetchGlobalNominatimSuggestions = useCallback((query) => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSearching(false);
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item) => ({
            placeId: String(item.place_id),
            mainText: item.name || item.display_name.split(',')[0],
            secondaryText: item.display_name.split(',').slice(1).join(', ').trim(),
            description: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setSuggestions(formatted);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      })
      .catch((err) => {
        console.warn('Global geocoding fallback error:', err);
        setIsSearching(false);
        setSuggestions([]);
        setShowSuggestions(false);
      });
  }, []);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.description || item.mainText);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    setSearchError('');

    const targetPlaceName = item.mainText || (item.description ? item.description.split(',')[0].trim() : '');

    // If pre-resolved lat/lng exists on the suggestion
    if (item.lat && item.lng) {
      const newCoords = {
        lat: Number(item.lat),
        lng: Number(item.lng),
        name: item.mainText || item.description,
        address: item.description,
      };
      setSearchedLocation(newCoords);
      setCenter({ lat: newCoords.lat, lng: newCoords.lng });
      resolveLocationDistrict(newCoords, targetPlaceName, (formattedLoc) => {
        setSearchedLocationDistrict(formattedLoc || targetPlaceName);
      });
      if (mapRef.current) {
        mapRef.current.panTo({ lat: newCoords.lat, lng: newCoords.lng });
        mapRef.current.setZoom(14);
      }
      setIsSearching(false);
      return;
    }

    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      const queryParam = item.placeId ? { placeId: item.placeId } : { address: item.description };
      geocoderRef.current.geocode(queryParam, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const newCoords = {
            lat: loc.lat(),
            lng: loc.lng(),
            name: item.mainText || results[0].formatted_address,
            address: results[0].formatted_address,
          };
          setSearchedLocation(newCoords);
          setCenter({ lat: newCoords.lat, lng: newCoords.lng });
          resolveLocationDistrict(newCoords, targetPlaceName, (formattedLoc) => {
            setSearchedLocationDistrict(formattedLoc || targetPlaceName);
          });

          if (mapRef.current) {
            mapRef.current.panTo({ lat: newCoords.lat, lng: newCoords.lng });
            mapRef.current.setZoom(14);
          }
          setIsSearching(false);
        } else {
          // Geocoder fallback query with address string directly
          geocoderRef.current.geocode({ address: item.description }, (res2, stat2) => {
            if (stat2 === 'OK' && res2 && res2[0]) {
              const loc2 = res2[0].geometry.location;
              const newCoords2 = {
                lat: loc2.lat(),
                lng: loc2.lng(),
                name: item.mainText || res2[0].formatted_address,
                address: res2[0].formatted_address,
              };
              setSearchedLocation(newCoords2);
              setCenter({ lat: newCoords2.lat, lng: newCoords2.lng });
              resolveLocationDistrict(newCoords2, targetPlaceName, (formattedLoc2) => {
                setSearchedLocationDistrict(formattedLoc2 || targetPlaceName);
              });

              if (mapRef.current) {
                mapRef.current.panTo({ lat: newCoords2.lat, lng: newCoords2.lng });
                mapRef.current.setZoom(14);
              }
              setIsSearching(false);
            } else {
              // Final fallback to Nominatim
              fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.description)}&limit=1&addressdetails=1`)
                .then((r) => r.json())
                .then((d) => {
                  setIsSearching(false);
                  if (d && d[0]) {
                    const lat = parseFloat(d[0].lat);
                    const lng = parseFloat(d[0].lon);
                    const newCoords = {
                      lat,
                      lng,
                      name: item.mainText || d[0].display_name,
                      address: d[0].display_name,
                    };
                    setSearchedLocation(newCoords);
                    setCenter({ lat, lng });
                    const place =
                      targetPlaceName ||
                      d[0].address?.suburb ||
                      d[0].address?.neighbourhood ||
                      d[0].address?.village ||
                      d[0].address?.town ||
                      d[0].address?.city;
                    const dist =
                      d[0].address?.state_district ||
                      d[0].address?.district ||
                      d[0].address?.county;
                    if (place && dist && place.toLowerCase() !== dist.toLowerCase()) {
                      setSearchedLocationDistrict(`${place}, ${dist}`);
                    } else {
                      setSearchedLocationDistrict(dist || place || targetPlaceName);
                    }

                    if (mapRef.current) {
                      mapRef.current.panTo({ lat, lng });
                      mapRef.current.setZoom(14);
                    }
                  } else {
                    setSearchError('Location not found');
                    setTimeout(() => setSearchError(''), 4000);
                  }
                })
                .catch(() => {
                  setIsSearching(false);
                  setSearchError('Location not found');
                  setTimeout(() => setSearchError(''), 4000);
                });
            }
          });
        }
      });
    } else {
      setIsSearching(false);
      setSearchError('Unable to search location');
      setTimeout(() => setSearchError(''), 4000);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    setSearchError('');

    const targetPlaceName = query.split(',')[0].trim();

    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const newCoords = {
            lat: loc.lat(),
            lng: loc.lng(),
            name: query,
            address: results[0].formatted_address,
          };
          setSearchedLocation(newCoords);
          setCenter({ lat: newCoords.lat, lng: newCoords.lng });
          setSearchQuery(results[0].formatted_address);
          resolveLocationDistrict(newCoords, targetPlaceName, (formattedLoc) => {
            setSearchedLocationDistrict(formattedLoc || targetPlaceName);
          });

          if (mapRef.current) {
            mapRef.current.panTo({ lat: newCoords.lat, lng: newCoords.lng });
            mapRef.current.setZoom(14);
          }
          setIsSearching(false);
        } else {
          // Fallback to global Nominatim lookup
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`)
            .then((r) => r.json())
            .then((d) => {
              setIsSearching(false);
              if (d && d[0]) {
                const lat = parseFloat(d[0].lat);
                const lng = parseFloat(d[0].lon);
                const newCoords = {
                  lat,
                  lng,
                  name: query,
                  address: d[0].display_name,
                };
                setSearchedLocation(newCoords);
                setCenter({ lat, lng });
                setSearchQuery(d[0].display_name);
                const place =
                  targetPlaceName ||
                  d[0].address?.suburb ||
                  d[0].address?.neighbourhood ||
                  d[0].address?.village ||
                  d[0].address?.town ||
                  d[0].address?.city;
                const dist =
                  d[0].address?.state_district ||
                  d[0].address?.district ||
                  d[0].address?.county;
                if (place && dist && place.toLowerCase() !== dist.toLowerCase()) {
                  setSearchedLocationDistrict(`${place}, ${dist}`);
                } else {
                  setSearchedLocationDistrict(dist || place || targetPlaceName);
                }

                if (mapRef.current) {
                  mapRef.current.panTo({ lat, lng });
                  mapRef.current.setZoom(14);
                }
              } else {
                setSearchError('Location not found');
                setTimeout(() => setSearchError(''), 4000);
              }
            })
            .catch(() => {
              setIsSearching(false);
              setSearchError('Location not found');
              setTimeout(() => setSearchError(''), 4000);
            });
        }
      });
    } else {
      setIsSearching(false);
      setSearchError('Unable to search location');
      setTimeout(() => setSearchError(''), 4000);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchedLocation(null);
    setSearchedLocationDistrict(null);
    setSearchError('');
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const displayedDistrict = searchedLocationDistrict || currentUserDistrict || district || 'Nearby';

  return (
    <div className="eventhive-map-view-page" ref={containerRef}>
      {/* Top Page Header */}
      <div className="map-view-header">
        <div className="map-view-header__left">
          <button
            type="button"
            className="map-view-back-btn"
            onClick={onBackToList}
            aria-label="Back to List"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="map-view-titles">
            <h1 className="map-view-title">Map View</h1>
            <p className="map-view-subtitle">Explore events happening around you</p>
          </div>
        </div>

        <div className="map-view-header__right">
          {/* View Filter Card */}
          <div className="map-filter-card-wrapper">
            <div
              className={`map-filter-card ${viewDropdownOpen ? 'map-filter-card--open' : ''}`}
              onClick={() => {
                setViewDropdownOpen(!viewDropdownOpen);
                setRadiusDropdownOpen(false);
              }}
            >
              <span className="map-filter-card__label">View</span>
              <div className="map-filter-card__value-row">
                <div className="map-filter-card__icon-dot">
                  <MapPin size={13} />
                </div>
                <span className="map-filter-card__value">{viewFilter}</span>
                <ChevronDown size={14} className="map-filter-card__chevron" />
              </div>
            </div>

            {viewDropdownOpen && (
              <div className="map-filter-dropdown">
                {['All Events', 'Today', 'This Week', 'This Weekend'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`map-filter-option ${viewFilter === opt ? 'map-filter-option--active' : ''}`}
                    onClick={() => {
                      setViewFilter(opt);
                      setViewDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Radius Filter Card */}
          <div className="map-filter-card-wrapper">
            <div
              className={`map-filter-card ${radiusDropdownOpen ? 'map-filter-card--open' : ''}`}
              onClick={() => {
                setRadiusDropdownOpen(!radiusDropdownOpen);
                setViewDropdownOpen(false);
              }}
            >
              <span className="map-filter-card__label">Radius</span>
              <div className="map-filter-card__value-row">
                <div className="map-filter-card__icon-dot">
                  <Crosshair size={13} />
                </div>
                <span className="map-filter-card__value">{radiusFilter}</span>
                <ChevronDown size={14} className="map-filter-card__chevron" />
              </div>
            </div>

            {radiusDropdownOpen && (
              <div className="map-filter-dropdown">
                {['5 km', '10 km', '25 km', '50 km', 'All'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`map-filter-option ${radiusFilter === opt ? 'map-filter-option--active' : ''}`}
                    onClick={() => {
                      setRadiusFilter(opt);
                      setRadiusDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Unified Card Container */}
      <div className="map-main-card">
        {/* Left Sidebar */}
        <aside className="map-sidebar">
          <div className="map-sidebar__header">
            <span className="map-sidebar__title-bar" />
            <h2 className="map-sidebar__title">Event Categories</h2>
          </div>

          <div className="map-categories-list">
            {/* All Categories Option */}
            <div
              className={`map-category-item ${isAllCategoriesSelected ? 'map-category-item--checked' : ''}`}
              onClick={() => handleToggleCategory('All')}
            >
              <div
                className="map-category-item__icon-wrap"
                style={{ backgroundColor: CATEGORY_META.All.bgColor, color: CATEGORY_META.All.color }}
              >
                <LayoutGrid size={16} strokeWidth={2.4} />
              </div>
              <span className="map-category-item__label">All Categories</span>
              <div className={`map-category-checkbox ${isAllCategoriesSelected ? 'map-category-checkbox--checked' : ''}`}>
                {isAllCategoriesSelected && <Check size={12} strokeWidth={3.5} color="#ffffff" />}
              </div>
            </div>

            {/* Individual Dynamic Categories */}
            {distinctCategories.map((catKey) => {
              const cat = getCategoryConfig(catKey);
              const IconComp = cat.icon;
              const isChecked = selectedCategories.includes(catKey);

              return (
                <div
                  key={catKey}
                  className={`map-category-item ${isChecked ? 'map-category-item--checked' : ''}`}
                  onClick={() => handleToggleCategory(catKey)}
                >
                  <div
                    className="map-category-item__icon-wrap"
                    style={{ backgroundColor: cat.bgColor, color: cat.color }}
                  >
                    <IconComp size={16} strokeWidth={2.4} />
                  </div>
                  <span className="map-category-item__label">{cat.label}</span>
                  <div className={`map-category-checkbox ${isChecked ? 'map-category-checkbox--checked' : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3.5} color="#ffffff" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Location Information Card */}
          <div className="map-location-card">
            <div className="map-location-card__content">
              <div className="map-location-card__icon-wrap">
                <Compass size={20} className="map-location-card__icon" />
              </div>
              <div className="map-location-card__text">
                <span className="map-location-card__label">Showing events in</span>
                <span className="map-location-card__city">{displayedDistrict}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Map Canvas Area with Padding and Rounded Corners */}
        <div className="map-canvas-container">
          <div className="map-inner-container">
            {!isLoaded ? (
              <div className="map-loading-state">
                <div className="map-loading-spinner" />
                <span>Loading map...</span>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                  disableDefaultUI: true,
                  gestureHandling: 'greedy',
                  zoomControl: false,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  styles: [
                    {
                      featureType: 'poi',
                      elementType: 'labels',
                      stylers: [{ visibility: 'on' }],
                    },
                  ],
                }}
              >
                {/* User Location Pulse Marker */}
                {userLocation && <UserLocationPulseMarker position={userLocation} />}

                {/* Searched Location Pin Marker */}
                {searchedLocation && (
                  <SearchedLocationMarker
                    position={{ lat: searchedLocation.lat, lng: searchedLocation.lng }}
                    name={searchedLocation.name}
                  />
                )}

                {/* Event Markers with Event Images */}
                <MarkerClusterer
                  options={{
                    imagePath:
                      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                  }}
                >
                  {() =>
                    filteredEvents.map((event) => {
                      const config = getCategoryConfig(event.category || 'Community');
                      return (
                        <EventImageMarker
                          key={event.eventId}
                          event={event}
                          categoryConfig={config}
                          onClick={(evt) => setSelectedEvent(evt)}
                        />
                      );
                    })
                  }
                </MarkerClusterer>

                {/* InfoWindow Popup on Click */}
                {selectedEvent && (
                  <InfoWindow
                    position={{
                      lat: Number(selectedEvent.latitude),
                      lng: Number(selectedEvent.longitude),
                    }}
                    onCloseClick={() => setSelectedEvent(null)}
                  >
                    <div className="event-map-popup">
                      {selectedEvent.imageUrl && (
                        <div className="event-map-popup__img-wrap">
                          <img src={selectedEvent.imageUrl} alt="" />
                        </div>
                      )}
                      <h3 className="event-map-popup__title">{selectedEvent.title}</h3>
                      <div className="event-map-popup__badge-row">
                        <span
                          className="event-badge"
                          style={{
                            backgroundColor:
                              getCategoryConfig(selectedEvent.category || 'Community').bgColor,
                            color:
                              getCategoryConfig(selectedEvent.category || 'Community').color,
                          }}
                        >
                          {selectedEvent.category}
                        </span>
                      </div>
                      <p className="event-map-popup__info">
                        📅{' '}
                        {new Date(Number(selectedEvent.startTime)).toLocaleDateString(
                          undefined,
                          { weekday: 'short', month: 'short', day: 'numeric' }
                        )}
                      </p>
                      <p className="event-map-popup__info">
                        📍 {selectedEvent.location}
                        {selectedEvent.city &&
                          !isPincode(selectedEvent.city) &&
                          `, ${selectedEvent.city}`}
                      </p>
                      {selectedEvent.rsvpCount > 0 && (
                        <p className="event-map-popup__rsvps">
                          👥 {selectedEvent.rsvpCount} going
                        </p>
                      )}
                      <button
                        className="primary-button event-map-popup__btn"
                        onClick={() =>
                          navigate(`/events/${encodeURIComponent(selectedEvent.eventId)}`)
                        }
                      >
                        View Event
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}

            {/* Floating Search Bar (Top Left) with Autocomplete */}
            <div className="map-search-container" ref={searchContainerRef}>
              <form className="map-search-bar" onSubmit={handleSearchSubmit}>
                <Search size={16} className="map-search-bar__icon" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="map-search-bar__input"
                />
                {isSearching && (
                  <Loader2 size={15} className="map-search-bar__spinner" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    className="map-search-bar__clear"
                    onClick={handleClearSearch}
                    title="Clear location"
                    aria-label="Clear location"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="map-search-suggestions">
                  {suggestions.map((item) => (
                    <div
                      key={item.placeId || item.description}
                      className="map-search-suggestion-item"
                      onClick={() => handleSelectSuggestion(item)}
                    >
                      <div className="map-search-suggestion-icon">
                        <MapPin size={14} />
                      </div>
                      <div className="map-search-suggestion-text">
                        <strong className="map-search-suggestion-main">{item.mainText}</strong>
                        {item.secondaryText && (
                          <small className="map-search-suggestion-sub">{item.secondaryText}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error Toast */}
              {searchError && (
                <div className="map-search-error-toast">
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* Floating Controls (Top Right) */}
            <div className="map-floating-controls">
              <button
                type="button"
                className="map-ctrl-btn"
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
                onClick={handleToggleFullscreen}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <div className="map-ctrl-btn-group">
                <button
                  type="button"
                  className="map-ctrl-btn"
                  title="Zoom In"
                  aria-label="Zoom In"
                  onClick={handleZoomIn}
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  className="map-ctrl-btn"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  onClick={handleZoomOut}
                >
                  <Minus size={16} />
                </button>
              </div>
              <button
                type="button"
                className="map-ctrl-btn"
                title="My Location"
                aria-label="My Location"
                onClick={handleGetLocation}
              >
                <Crosshair size={16} />
              </button>
            </div>

            {/* Bottom Floating Legend with Dynamic Categories */}
            <div className="map-floating-legend">
              {distinctCategories.map((catKey) => {
                const cat = getCategoryConfig(catKey);
                return (
                  <div key={catKey} className="map-legend-item">
                    <span
                      className="map-legend-dot"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="map-legend-label">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


