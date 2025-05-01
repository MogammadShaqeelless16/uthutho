function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.display_name) {
                resolve(data.display_name);
              } else {
                resolve(`${latitude}, ${longitude}`);
              }
            })
            .catch((error) => {
              reject(error);
            });
        },
        (error) => {
          reject(error);
        },
        { timeout: 10000 } // Add timeout option
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

export { getCurrentLocation };