import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import MarkdownIt from 'markdown-it';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const transportSelect = document.getElementById('transportSelect');
  const themeToggle = document.getElementById('theme-toggle');
  const currentLocationBtn = document.getElementById('current-location');
  const timeEstimateBtn = document.getElementById('time-estimate-btn');

  // Initialize conversation
  let conversation = [];
  let currentUser = null;
  let queryType = 'full'; // 'full' or 'time-only'

  // Auth modal elements
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const showLogin = document.getElementById('show-login');
  const showSignup = document.getElementById('show-signup');
  const closeModal = document.querySelector('.close-modal');

  // Check auth state on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      authModal.style.display = 'none';
      addWelcomeMessage();
    } else {
      authModal.style.display = 'block';
      addMessage('Hi there! 👋 Please log in to use Uthutho, your transport AI assistant.', 'bot');
    }
  });

  // Set up event listeners
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentUser) {
      authModal.style.display = 'block';
      addMessage('Please log in to use the transport assistant.', 'bot');
    } else {
      queryType = 'full';
      processTransportQuery();
    }
  });

  timeEstimateBtn.addEventListener('click', function() {
    if (!currentUser) {
      authModal.style.display = 'block';
      addMessage('Please log in to use the transport assistant.', 'bot');
    } else {
      queryType = 'time-only';
      processTransportQuery();
    }
  });

  // Auth form toggling
  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('auth-title').textContent = 'Login';
  });

  showSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    document.getElementById('auth-title').textContent = 'Sign Up';
  });

  closeModal?.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  // Auth form submissions
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showAuthError(error.message);
      return;
    }

    currentUser = data.user;
    authModal.style.display = 'none';
    addWelcomeMessage();
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          preferred_transport: null,
        },
      },
    });

    if (error) {
      showAuthError(error.message);
      return;
    }

    currentUser = data.user;
    authModal.style.display = 'none';
    addWelcomeMessage(firstName);
  });

  function showAuthError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    const authForm = document.getElementById('auth-form');
    const existingError = authForm.querySelector('.error-message');
    if (existingError) {
      authForm.removeChild(existingError);
    }
    
    authForm.prepend(errorElement);
  }

  function addWelcomeMessage(firstName = null) {
    const welcomeMessage = firstName 
      ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`
      : 'Welcome back! Where would you like to go today?';
    
    addMessage(welcomeMessage, 'bot');
  }

  // Add logout button to header
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn icon-btn';
    logoutBtn.id = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    headerActions.appendChild(logoutBtn);

    logoutBtn.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addMessage(`Logout failed: ${error.message}`, 'bot');
      } else {
        currentUser = null;
        authModal.style.display = 'block';
        document.getElementById('output').innerHTML = '';
        addMessage('Please log in to use Uthutho, your transport AI assistant.', 'bot');
      }
    });
  }

  // Get user's current location on page load
  getCurrentLocation().then(location => {
    if (location) {
      fromInput.value = location;
      if (currentUser) {
        addMessage(`I've automatically set your current location to ${location}`, 'bot');
      }
    }
  });

  // Set up event listeners
  themeToggle.addEventListener('click', toggleTheme);
  currentLocationBtn.addEventListener('click', () => {
    getCurrentLocation().then(location => {
      if (location) {
        fromInput.value = location;
        if (currentUser) {
          addMessage(`Updated your current location to ${location}`, 'bot');
        }
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
  async function processTransportQuery() {
    const fromLocation = fromInput.value.trim();
    const toLocation = toInput.value.trim();
    const language = languageSelect.value;
    const transportType = transportSelect.value;

    if (!fromLocation || !toLocation) {
      addMessage('Please enter both your starting location and destination.', 'bot');
      return;
    }

    addMessage(`I need to travel from ${fromLocation} to ${toLocation}`, 'user');

    const loadingElement = addMessage("Finding the best transport options...", 'bot', true);
    scrollToBottom();

    try {
      const prompt = generatePrompt(fromLocation, toLocation, language, queryType, transportType);

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
      calculateLocalRoute(fromLocation, toLocation, queryType, transportType);
    }
  }

  // Generate the prompt for Gemini
  function generatePrompt(fromLocation, toLocation, language, queryType = 'full', transportType = 'all') {
    const transportTypeMap = {
      bus: 'bus only',
      train: 'train only',
      taxi: 'taxi only',
      rideshare: 'ride-hailing only',
      walking: 'walking only',
      all: 'all available'
    };

    const queryTypeMap = {
      'full': 'Provide full route details with all information',
      'time-only': 'Provide only time estimates for each option'
    };

    const languageMapping = {
      en: `You are Uthutho AI, a South African transport assistant. ${queryTypeMap[queryType]} from ${fromLocation} to ${toLocation} using ${transportTypeMap[transportType]} transport options. Include:`,
      zu: `Uyi-Uthutho AI, umsizi wezothutho waseNingizimu Afrika. ${queryTypeMap[queryType]} ukusuka ${fromLocation} ukuya ${toLocation} usebenzisa ${transportTypeMap[transportType]} izinketho zokuhamba. Faka:`,
      xh: `Uyi-Uthutho AI, umncedisi wezothutho waseMzantsi Afrika. ${queryTypeMap[queryType]} ukusuka ${fromLocation} ukuya ${toLocation} usebenzisa ${transportTypeMap[transportType]} iinketho zothutho. Quka:`
    };

    const promptDetails = {
      en: `
      - Different transport options available
      - Estimated travel times for each option
      ${queryType === 'full' ? '- Approximate costs\n- Safety recommendations\n- Any current traffic alerts\n- Alternative routes if available' : ''}
      - Respond using ONLY markdown formatted for visual display
      - Include relevant emojis for each transport type
      - Use bullet points and clear section headings
      - Response in English only
      `,
      zu: `
      - Izinketho zokuhamba ezahlukene
      - Isikhathi sokuhamba esilinganiselwe salezo zinketho
      ${queryType === 'full' ? '- Izindleko ezilinganiselwe\n- Izincomo zokuphepha\n- Noma yiziphi izaziso zamanje zethrafikhi\n- Izindlela ezingezinye uma zikhona' : ''}
      - Phendula ngesiZulu kuphela
      `,
      xh: `
      - Iinketho zothutho ezahlukeneyo
      - Ixesha eliqikelelweyo lohambo ngalunye
      ${queryType === 'full' ? '- Amaxabiso aqikelelweyo\n- Iingcebiso zokhuseleko\n- Naziphi izaziso zethrafikhi zangoku\n- Ezinye iindlela zokuhamba ukuba zikhona' : ''}
      - Phendula ngesiXhosa kuphela
      `
    };

    return `${languageMapping[language]}\n${promptDetails[language]}`;
  }

  // Fallback route calculation
  function calculateLocalRoute(fromLocation, toLocation, queryType = 'full', transportType = 'all') {
    let response = `## Transport Options from ${fromLocation} to ${toLocation}\n`;
    
    if (transportType === 'all' || transportType === 'bus') {
      response += `
### 🚍 MyCiTi Bus
- **Route T01**: Civic Centre → Table View
  - ⏱️ 25 mins${queryType === 'full' ? ' | 💵 R25 | 🔄 Every 15 mins' : ''}
- **Route 104**: Adderley St → Sea Point
  - ⏱️ 15 mins${queryType === 'full' ? ' | 💵 R15 | 🔄 Every 8-12 mins' : ''}
`;
    }

    if (transportType === 'all' || transportType === 'train') {
      response += `
### 🚆 Metrorail
- **Northern Line**: On time
  - ⏱️ 35 mins${queryType === 'full' ? ' | 💵 R12.50 | 🔄 Every 20 mins' : ''}
`;
    }

    if ((transportType === 'all' || transportType === 'taxi' || transportType === 'rideshare') && queryType === 'full') {
      response += `
### 🚕 Other Options
${transportType === 'all' || transportType === 'taxi' ? '- **Metered Taxi**: ~R80-120 (20-30 mins)\n' : ''}
${transportType === 'all' || transportType === 'rideshare' ? '- **Ride-hailing**: ~R60-100 (15-25 mins)\n' : ''}
`;
    }

    if (queryType === 'full') {
      response += `
### ⚠️ Traffic Alert
- Moderate traffic on N1 Highway
- Avoid Buitengragt St between 4-6pm

### 💡 Safety Tip
Avoid empty train carriages and be aware of your surroundings
`;
    }
    
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