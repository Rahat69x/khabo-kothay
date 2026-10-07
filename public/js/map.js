/**
 * Interactive Map Controller
 * Supports Google Maps JavaScript API with fallback interactive tile map for mock mode
 */

class MapController {
  constructor() {
    this.mapInstance = null;
    this.userMarker = null;
    this.restaurantMarkers = [];
    this.routePolyline = null;
    this.isGoogleMapsLoaded = false;
    this.activeId = null;
  }

  async init(containerId, googleApiKey) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    if (googleApiKey && typeof window.google === 'undefined') {
      try {
        await this.loadGoogleMapsScript(googleApiKey);
        this.isGoogleMapsLoaded = true;
      } catch (err) {
        console.warn('Google Maps JS API failed to load, falling back to mock interactive canvas map.', err);
      }
    } else if (typeof window.google !== 'undefined') {
      this.isGoogleMapsLoaded = true;
    }

    if (this.isGoogleMapsLoaded && window.google?.maps) {
      this.initGoogleMap();
    } else {
      this.initMockMap();
    }
  }

  loadGoogleMapsScript(apiKey) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  initGoogleMap() {
    const center = { lat: 23.7925, lng: 90.4150 }; // Gulshan 2
    this.mapInstance = new google.maps.Map(this.container, {
      center,
      zoom: 14,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] }
      ],
      disableDefaultUI: false,
      zoomControl: true
    });
  }

  initMockMap() {
    this.container.innerHTML = `
      <div class="mock-map-view" id="mockMapCanvas">
        <div class="map-overlay-badge">
          <span>📍 Dhaka Food Map (Mock View)</span>
        </div>
        <svg id="mockMapSvg" class="map-svg-layer" viewBox="0 0 800 600"></svg>
        <div id="mockMapMarkers" class="map-markers-layer"></div>
      </div>
    `;
  }

  update(userLocation, restaurants, onMarkerClick) {
    this.onMarkerClick = onMarkerClick;
    if (this.isGoogleMapsLoaded && this.mapInstance) {
      this.updateGoogleMap(userLocation, restaurants);
    } else {
      this.updateMockMap(userLocation, restaurants);
    }
  }

  updateGoogleMap(userLocation, restaurants) {
    // Clear old markers
    if (this.userMarker) this.userMarker.setMap(null);
    for (const m of this.restaurantMarkers) m.setMap(null);
    this.restaurantMarkers = [];
    if (this.routePolyline) this.routePolyline.setMap(null);

    const bounds = new google.maps.LatLngBounds();

    // User Marker
    const userLatLng = { lat: userLocation.lat, lng: userLocation.lng };
    bounds.extend(userLatLng);
    this.userMarker = new google.maps.Marker({
      position: userLatLng,
      map: this.mapInstance,
      title: 'Your Location: ' + (userLocation.name || 'Current'),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      }
    });

    // Restaurant Markers
    restaurants.forEach((r, idx) => {
      const pos = { lat: r.location.latitude, lng: r.location.longitude };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map: this.mapInstance,
        label: {
          text: String(idx + 1),
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        title: `${idx + 1}. ${r.displayName}`
      });

      marker.addListener('click', () => {
        if (this.onMarkerClick) this.onMarkerClick(r);
        this.highlightRestaurant(userLocation, r);
      });

      this.restaurantMarkers.push({ id: r.id, marker, restaurant: r });
    });

    if (restaurants.length > 0) {
      this.mapInstance.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }

  updateMockMap(userLocation, restaurants) {
    const markersContainer = document.getElementById('mockMapMarkers');
    const svgLayer = document.getElementById('mockMapSvg');
    if (!markersContainer || !svgLayer) return;

    markersContainer.innerHTML = '';
    svgLayer.innerHTML = `
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#0F172A"/>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <!-- Gulshan Lake Graphic -->
      <path d="M 450 0 C 430 180, 480 320, 440 600" fill="none" stroke="#1E3A8A" stroke-width="40" opacity="0.6"/>
      <path d="M 450 0 C 430 180, 480 320, 440 600" fill="none" stroke="#38BDF8" stroke-width="4" opacity="0.8"/>
      <!-- Main Roads -->
      <line x1="50" y1="280" x2="750" y2="280" stroke="#334155" stroke-width="12" stroke-linecap="round"/>
      <line x1="380" y1="50" x2="380" y2="550" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
      <g id="mockRouteLines"></g>
    `;

    // Coordinates mapping to 800x600 viewBox
    // Gulshan roughly lat 23.77 - 23.81, lng 90.40 - 90.43
    const minLat = 23.770, maxLat = 23.810;
    const minLng = 90.395, maxLng = 90.435;

    const toX = (lng) => Math.max(40, Math.min(760, ((lng - minLng) / (maxLng - minLng)) * 720 + 40));
    const toY = (lat) => Math.max(40, Math.min(560, (1 - (lat - minLat) / (maxLat - minLat)) * 520 + 40));

    // User pin
    const uX = toX(userLocation.lng);
    const uY = toY(userLocation.lat);

    const userPin = document.createElement('div');
    userPin.className = 'map-user-pin';
    userPin.style.left = `${(uX / 800) * 100}%`;
    userPin.style.top = `${(uY / 600) * 100}%`;
    userPin.innerHTML = `<div class="pulse-ring"></div><div class="user-dot" title="You are here">📍</div>`;
    markersContainer.appendChild(userPin);

    // Restaurant pins
    restaurants.forEach((r, idx) => {
      const rX = toX(r.location.longitude);
      const rY = toY(r.location.latitude);

      const rPin = document.createElement('div');
      rPin.className = `map-place-pin ${r.id === this.activeId ? 'active' : ''}`;
      rPin.id = `map-pin-${r.id}`;
      rPin.style.left = `${(rX / 800) * 100}%`;
      rPin.style.top = `${(rY / 600) * 100}%`;
      rPin.innerHTML = `<span class="pin-number">${idx + 1}</span>`;
      rPin.title = `${r.displayName} (${r.cuisine})`;

      rPin.onclick = () => {
        if (this.onMarkerClick) this.onMarkerClick(r);
        this.highlightRestaurant(userLocation, r);
      };

      markersContainer.appendChild(rPin);
    });

    if (restaurants.length > 0) {
      this.highlightRestaurant(userLocation, restaurants[0]);
    }
  }

  highlightRestaurant(userLocation, restaurant) {
    this.activeId = restaurant.id;

    if (this.isGoogleMapsLoaded && this.mapInstance) {
      const pos = { lat: restaurant.location.latitude, lng: restaurant.location.longitude };
      this.mapInstance.panTo(pos);

      // Draw polyline connecting user to restaurant
      if (this.routePolyline) this.routePolyline.setMap(null);
      this.routePolyline = new google.maps.Polyline({
        path: [
          { lat: userLocation.lat, lng: userLocation.lng },
          pos
        ],
        geodesic: true,
        strokeColor: '#10B981',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: this.mapInstance
      });
    } else {
      // Mock Map highlighting & line
      document.querySelectorAll('.map-place-pin').forEach(p => p.classList.remove('active'));
      const activePin = document.getElementById(`map-pin-${restaurant.id}`);
      if (activePin) activePin.classList.add('active');

      const routeGroup = document.getElementById('mockRouteLines');
      if (routeGroup) {
        const minLat = 23.770, maxLat = 23.810;
        const minLng = 90.395, maxLng = 90.435;
        const toX = (lng) => Math.max(40, Math.min(760, ((lng - minLng) / (maxLng - minLng)) * 720 + 40));
        const toY = (lat) => Math.max(40, Math.min(560, (1 - (lat - minLat) / (maxLat - minLat)) * 520 + 40));

        const uX = toX(userLocation.lng);
        const uY = toY(userLocation.lat);
        const rX = toX(restaurant.location.longitude);
        const rY = toY(restaurant.location.latitude);

        routeGroup.innerHTML = `
          <line x1="${uX}" y1="${uY}" x2="${rX}" y2="${rY}" stroke="#10B981" stroke-width="4" stroke-dasharray="6 4"/>
        `;
      }
    }
  }

  getGoogleMapsDirectionsUrl(userLocation, restaurant) {
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${restaurant.location.latitude},${restaurant.location.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }
}

export const mapController = new MapController();
export default mapController;
