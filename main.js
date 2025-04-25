import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import MarkdownIt from 'markdown-it';

// API Key Banner Function
function maybeShowApiKeyBanner(key, action = `enter it at the top of <code>main.js</code>`) {
  if (key === 'TODO') {
    let banner = document.createElement('div');
    banner.className = 'api-key-banner';
    banner.innerHTML = `
      To get started with the Gemini API,
      <a href="https://g.co/ai/idxGetGeminiKey" target="_blank">
      get an API key</a> (Ctrl+Click) and ${action}`;
    document.body.prepend(banner);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('search-form');
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const chatContainer = document.getElementById('output');
  const languageSelect = document.getElementById('languageSelect');
  const themeToggle = document.getElementById('theme-toggle');
  const currentLocationBtn = document.getElementById('current-location');

  // Initialize conversation
  let conversation = [
    {
      sender: 'bot',
      message: 'Hi there! 👋 I\'m Uthutho, your transport AI assistant. Where would you like to go today?',
      timestamp: new Date()
    }
  ];

  // Get user's current location on page load
  getCurrentLocation().then(location => {
    if (location) {
      fromInput.value = location;
      addMessage(`I've automatically set your current location to ${location}`, 'bot');
    }
  });

  // Set up event listeners
  form.addEventListener('submit', askUthuthoAI);
  themeToggle.addEventListener('click', toggleTheme);
  currentLocationBtn.addEventListener('click', () => {
    getCurrentLocation().then(location => {
      if (location) {
        fromInput.value = location;
        addMessage(`Updated your current location to ${location}`, 'bot');
      }
    });
  });

  // Theme management
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  // Get current location using browser geolocation and reverse geocoding
  async function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        addMessage('Geolocation is not supported by your browser.', 'bot');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const location = await reverseGeocode(latitude, longitude);
            if (location) {
              resolve(location);
            } else {
              addMessage('Could not determine your exact address. Please enter it manually.', 'bot');
              resolve(null);
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            addMessage('Error determining your location. Please enter it manually.', 'bot');
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          addMessage('Could not access your location. Please enable location services or enter manually.', 'bot');
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

  // Reverse geocode coordinates to address using Nominatim (free service)
  async function reverseGeocode(lat, lon) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      
      if (data.address) {
        // Construct a readable address
        const address = [];
        if (data.address.road) address.push(data.address.road);
        if (data.address.suburb) address.push(data.address.suburb);
        if (data.address.city) address.push(data.address.city);
        
        return address.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  // Main function to handle transport queries
  async function askUthuthoAI(e) {
    e.preventDefault();
    const fromLocation = fromInput.value.trim();
    const toLocation = toInput.value.trim();
    const language = languageSelect.value;

    if (!fromLocation || !toLocation) {
      addMessage('Please enter both your starting location and destination.', 'bot');
      return;
    }

    addMessage(`I need to travel from ${fromLocation} to ${toLocation}`, 'user');

    const loadingElement = addMessage("Finding the best transport options...", 'bot', true);
    scrollToBottom();

    try {
      const prompt = generatePrompt(fromLocation, toLocation, language);

      const contents = [
        new HumanMessage({ content: [{ type: 'text', text: prompt }] })
      ];

      const chat = new ChatGoogleGenerativeAI({
        modelName: 'gemini-1.5-pro',
        apiKey: 'AIzaSyCkixn21fvW0by1S8SrP7h5jotBlpBW1Rk',
        safetySettings: [],
      });

      const stream = await chat.stream(contents);
      const buffer = [];
      const md = new MarkdownIt();

      removeElement(loadingElement);
      const botMessageElement = addMessage('', 'bot');

      for await (const chunk of stream) {
        buffer.push(chunk.content);
        const renderedMessage = md.render(buffer.join(''));
        botMessageElement.innerHTML = renderedMessage;
        scrollToBottom();
      }
    } catch (err) {
      removeElement(loadingElement);
      addMessage(`❌ Error: ${err.message}`, 'bot');
      console.error(err);
      
      // Fallback to local calculation
      calculateLocalRoute(fromLocation, toLocation);
    }
  }

  // Generate the prompt for Gemini
  function generatePrompt(fromLocation, toLocation, language) {
    const languageMapping = {
      en: `You are Uthutho AI, a South African transport assistant. Provide an infographic-style response with transport options from ${fromLocation} to ${toLocation}. Include:`,
      zu: `Uyi-Uthutho AI, umsizi wezothutho waseNingizimu Afrika. Nikeza izinketho zokuhamba ezichazwe kahle ukusuka ${fromLocation} ukuya ${toLocation}. Faka:`,
      xh: `Uyi-Uthutho AI, umncedisi wezothutho waseMzantsi Afrika. Nika iinketho zothutho ezivela ${fromLocation} ukuya ${toLocation}. Quka:`
    };

    const promptDetails = {
      en: `
      - Different transport options available (bus, train, taxi, etc.)
      - Estimated travel times for each option
      - Approximate costs
      - Safety recommendations
      - Any current traffic alerts
      - Alternative routes if available
      - Respond using ONLY markdown formatted for visual display
      - Include relevant emojis for each transport type
      - Use bullet points and clear section headings
      - Response in English only
      `,
      zu: `
      - Izinketho zokuhamba ezahlukene (amabhasi, izitimela, amatekisi, njll.)
      - Isikhathi sokuhamba esilinganiselwe salezo zinketho
      - Izindleko ezilinganiselwe
      - Izincomo zokuphepha
      - Noma yiziphi izaziso zamanje zethrafikhi
      - Izindlela ezingezinye uma zikhona
      - Phendula ngesiZulu kuphela
      `,
      xh: `
      - Iinketho zothutho ezahlukeneyo (iibhasi, iitreyini, iitekisi, njl.)
      - Ixesha eliqikelelweyo lohambo ngalunye
      - Amaxabiso aqikelelweyo
      - Iingcebiso zokhuseleko
      - Naziphi izaziso zethrafikhi zangoku
      - Ezinye iindlela zokuhamba ukuba zikhona
      - Phendula ngesiXhosa kuphela
      `
    };

    return `${languageMapping[language]}\n${promptDetails[language]}`;
  }

  // Fallback route calculation
  function calculateLocalRoute(fromLocation, toLocation) {
    const response = `
## 🚌 Transport Options from ${fromLocation} to ${toLocation}

### 🚍 MyCiTi Bus
- **Route T01**: Civic Centre → Table View
  - ⏱️ 25 mins | 💵 R25 | 🔄 Every 15 mins
- **Route 104**: Adderley St → Sea Point
  - ⏱️ 15 mins | 💵 R15 | 🔄 Every 8-12 mins

### 🚆 Metrorail
- **Northern Line**: On time
  - ⏱️ 35 mins | 💵 R12.50 | 🔄 Every 20 mins

### 🚕 Other Options
- **Metered Taxi**: ~R80-120 (20-30 mins)
- **Ride-hailing**: ~R60-100 (15-25 mins)

### ⚠️ Traffic Alert
- Moderate traffic on N1 Highway
- Avoid Buitengragt St between 4-6pm

### 💡 Safety Tip
Avoid empty train carriages and be aware of your surroundings
    `;
    
    addMessage(response, 'bot');
  }

  // Helper functions
  function addMessage(content, sender, isLoading = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    if (isLoading) messageElement.classList.add('loading');
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    
    if (sender === 'bot') {
      const botIcon = document.createElement('div');
      botIcon.classList.add('bot-icon');
      botIcon.innerHTML = '<i class="fas fa-robot"></i>';
      messageContent.appendChild(botIcon);
    }
    
    const messageText = document.createElement('div');
    messageText.classList.add('message-text');
    
    // If content is a string, parse markdown
    if (typeof content === 'string') {
      const md = new MarkdownIt();
      messageText.innerHTML = md.render(content);
    } else {
      // If content is a DOM element, append it directly
      messageText.appendChild(content);
    }
    
    messageContent.appendChild(messageText);
    messageElement.appendChild(messageContent);
    
    const messageTime = document.createElement('small');
    messageTime.classList.add('message-time');
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.appendChild(messageTime);
    
    chatContainer.appendChild(messageElement);
    scrollToBottom();
    return messageElement;
  }

  function removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

// Show API key banner if needed
maybeShowApiKeyBanner('AIzaSyCkixn21fvW0by1S8SrP7h5jotBlpBW1Rk');