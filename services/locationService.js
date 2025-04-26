export async function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            resolve(location || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          } catch {
            resolve(null);
          }
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
  
  async function reverseGeocode(lat, lon) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.address?.road || data.display_name;
  }