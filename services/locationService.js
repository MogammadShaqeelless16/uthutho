// Free Nominatim API for address suggestions (no key required)
export async function getAddressSuggestions(query) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      return await response.json();
    } catch (error) {
      console.error('Address suggestion error:', error);
      return [];
    }
  }
  
  export function setupAddressAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
  
    if (!input || !suggestions) return;
  
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      if (input.value.length < 3) {
        suggestions.innerHTML = '';
        return;
      }
  
      timeout = setTimeout(async () => {
        const results = await getAddressSuggestions(input.value);
        suggestions.innerHTML = results
          .map(result => `
            <div class="suggestion-item" data-address="${result.display_name}">
              ${result.display_name}
            </div>
          `)
          .join('');
  
        // Add click handlers to suggestions
        document.querySelectorAll(`#${suggestionsId} .suggestion-item`).forEach(item => {
          item.addEventListener('click', () => {
            input.value = item.getAttribute('data-address');
            suggestions.innerHTML = '';
          });
        });
      }, 300);
    });
  
    // Hide suggestions when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.innerHTML = '';
      }
    });
  }
  
  // Get current location using browser geolocation and reverse geocoding
  export async function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by your browser');
        resolve(null);
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const location = await reverseGeocode(latitude, longitude);
            resolve(location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch (error) {
            console.error('Geocoding error:', error);
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
  
  // Reverse geocode coordinates to address using Nominatim
  async function reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      
      if (data.address) {
        // Construct a readable address
        const addressParts = [];
        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.suburb) addressParts.push(data.address.suburb);
        if (data.address.city) addressParts.push(data.address.city);
        if (data.address.state) addressParts.push(data.address.state);
        if (data.address.country) addressParts.push(data.address.country);
        
        return addressParts.join(', ') || data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }
  
  // Get coordinates from address (for future use)
  export async function geocodeAddress(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      return data[0] ? {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        address: data[0].display_name
      } : null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }