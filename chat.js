import { ChatMessage } from './components/chat/ChatMessage.js';

function showWelcomeMessage(firstName = null, isFirstTime = false) {
  const message = isFirstTime
    ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`
    : `Welcome back, ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`;
  ChatMessage.add(message, "bot");
}

function showAiResponse(from, to, transportType, aiResponse, currentStream) {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";

  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${
    import.meta.env.GOOGLE_MAP_API_KEY
  }&origin=${from}&destination=${to}&mode=${
    transportType === "rideshare" || transportType === "taxi"
      ? "driving"
      : transportType
  }`;

  const mapDiv = document.createElement("div");
  mapDiv.innerHTML = `<iframe width="100%" height="400" src="${mapUrl}" frameborder="0" style="border:0;"></iframe>`;
  outputDiv.appendChild(mapDiv);

  const costsDiv = document.createElement("div");
  costsDiv.className = "costs";
  outputDiv.appendChild(costsDiv);

  const timesDiv = document.createElement("div");
  timesDiv.className = "times";
  outputDiv.appendChild(timesDiv);

  const aiLines = aiResponse.split("\n");

  aiLines.forEach((line) => {
    if (line.toLowerCase().includes("cost") || line.toLowerCase().includes("r")) {
      const costDiv = document.createElement("div");
      costDiv.textContent = line;
      costsDiv.appendChild(costDiv);
    } else if (line.toLowerCase().includes("time")) {
      const timeDiv = document.createElement("div");
      timeDiv.textContent = line;
      if (line.includes("Ride-hailing")) {
        const uberLink = document.createElement("a");
        uberLink.href = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${to}&dropoff[longitude]=${to}&dropoff[nickname]=${to}`;
        uberLink.textContent = "Open Uber";
        timeDiv.appendChild(uberLink);
      }
      timesDiv.appendChild(timeDiv);
    }
  });

  const stopBtn = document.createElement('button');
  stopBtn.className = 'btn primary';
  stopBtn.textContent = 'Stop';
  outputDiv.appendChild(stopBtn);

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.style.display = 'none';

  stopBtn.addEventListener('click', () => {
    if (currentStream) {
      currentStream.controller.abort();
      currentStream = null;
      stopBtn.remove();
      submitBtn.style.display = 'block';
    }
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = `
        <div class='error-message'>
         stopped AI
        </div>
    `;

  });
}

export { showWelcomeMessage, showAiResponse };