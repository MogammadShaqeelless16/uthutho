import { AuthModal } from './components/auth/AuthModal.js';
import { ChatMessage } from './components/chat/ChatMessage.js';
import { TransportForm } from './components/forms/TransportForm.js';
import { TransportService } from './services/transportService.js';
import { getSession, login, signup, logout, getProfile } from './services/authService.js';
import { 
  getCurrentLocation,
  setupAddressAutocomplete,
  geocodeAddress           // If you need this too
} from './services/locationService.js';

let authModal, transportService, transportForm;
let currentUser = null;
let currentStream = null;

function changeHtmlLanguage(language) {
  document.documentElement.lang = language;
  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) {
    const options = languageSelect.options;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.value === "en") {
        option.text = "English";
      } else if (option.value === "zu") {
        option.text = "Zulu";
      } else if (option.value === "xh") {
        option.text = "Xhosa";
      } else if (option.value === "af") {
        option.text = "Afrikaans";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
    // Initialize services and components
    authModal = new AuthModal();
    transportService = new TransportService();
    transportForm = new TransportForm(transportService);
  try {
    authModal.init({
      onLogin: async (email, password) => {    
        const { data, error } = await login(email, password);
        if (error) {
          authModal.showError(error.message);
          return error;
        }

        currentUser = data.user;
        // Fetch profile after successful login
        const profile = await getProfile(currentUser.id);
        currentUser.profile = profile || {
          first_name: currentUser.user_metadata?.first_name || '',
          last_name: currentUser.user_metadata?.last_name
        };
        authModal.hide();

        showWelcomeMessage(currentUser.profile?.first_name);
        setupLoggedInState();
        setupHeaderUserInfo();
        return null;
      },
      onSignup: async (email, password, firstName, lastName) => {    
        const { data, error } = await signup(email, password, firstName, lastName);
        if (error) {
          authModal.showError(error.message);
          return error;
        }

                currentUser = data.user;
        // Profile is created during signup but we fetch to confirm
        const profile = await getProfile(currentUser.id);
        currentUser.profile = profile || {
          first_name: firstName,
          last_name: lastName
        };

        authModal.hide();

        showWelcomeMessage(firstName);
        setupLoggedInState();
        setupHeaderUserInfo();
        return null;
      }
    });

    // Check initial auth state
    const { data: { session }, error } = await getSession();
    if (error) {
      console.error("Session check error:", error);
      authModal.show();
      ChatMessage.add('Error checking your session. Please try again.', 'bot');
      return;
    }

    if (session) {
      currentUser = session.user;
      // Ensure we have profile data
      if (!currentUser.profile) {
        currentUser.profile = await getProfile(currentUser.id) || {
          first_name: currentUser.user_metadata?.first_name || '',
          last_name: currentUser.user_metadata?.last_name
        };
      } 
      
      authModal.hide();

      showWelcomeMessage(currentUser.profile?.first_name);
      setupLoggedInState();
      setupHeaderUserInfo();
    } else {
      authModal.show();
      ChatMessage.add("Hi there! 👋 Please log in to use Uthutho, your transport AI assistant.", "bot");
    }

    // Initialize transport form
    transportForm.init();
    // Set up address autocomplete after everything else is initialized
    setupAddressAutocomplete("from", "from-suggestions");
    setupAddressAutocomplete("to", "to-suggestions");

    // Set up theme toggle
    setupThemeToggle();

    // Change HTML language based on selection
    const languageSelect = document.getElementById("languageSelect");
    changeHtmlLanguage(languageSelect.value);
    languageSelect.addEventListener("change", (e) => {
      changeHtmlLanguage(e.target.value);
    });


  } catch (error) {
    console.error('Initialization error:', error);
    ChatMessage.add(`
      ❌ Application Error: 
      ${error.message}
      Please refresh the page or try again later.
    `, 'bot');

    document.getElementById("output").innerHTML = `
    <div class='error-message'>
      ❌ Application Error:
       ${error.message}
       Please refresh the page or try again later.
    </div>
`;

  }
});


function showWelcomeMessage(firstName = null) {
  const message = firstName
    ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`
    : "Welcome back! Where would you like to go today?";
  ChatMessage.add(message, "bot");
}

  
function showAiResponse(from, to, transportType, aiResponse) {
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
    submitBtn.style.display = 'none'; // Hide the submit button

    stopBtn.addEventListener('click', () => {
        if (currentStream) {
            currentStream.controller.abort(); // Abort the stream
            currentStream = null;
            
            // Remove stop button and show submit button
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


function setupLoggedInState() {
  // Set current location if available
  const fromInput = document.getElementById("from");
  if (fromInput && !fromInput.value) {
    getCurrentLocation().then((location) => {
      if (location) {
        fromInput.value = location;
      }
    }).catch((error) => {
      console.error("Location detection failed:", error);
    });
  }

  const headerActions = document.querySelector(".header-actions");
  const profileBtn = document.createElement("button");
  profileBtn.className = "btn icon-btn";
  profileBtn.innerHTML = '<i class="fas fa-user"></i>';
  profileBtn.addEventListener("click", showProfilePage);
  headerActions.prepend(profileBtn);
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "btn icon-btn";
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
  document.querySelector(".header-actions").appendChild(logoutBtn);
  logoutBtn.addEventListener("click", async () => {
    try {
      const { error } = await logout();
      if (error) throw error;

      currentUser = null;
      authModal.show();
      document.getElementById("output").innerHTML = "";
      ChatMessage.add("Please log in to continue using Uthutho.", "bot");
      logoutBtn.remove();
      
      // Remove user info from header
      const userInfoElement = document.querySelector('.user-info');
      if (userInfoElement) userInfoElement.remove();
    } catch (error) {
      console.error("Logout failed:", error);
      ChatMessage.add(`Logout failed: ${error.message}`, "bot");
    }
  });
};
  const profileHTML = `
    <div class="profile-container">
      <h2>My Profile</h2>
      <form id="profile-form">
        <div class="input-group">
          <label>First Name</label>
          <input type="text" id="profile-first-name" value="${currentUser.profile?.first_name || ''}">
        </div>
        <div class="input-group">
          <label>Last Name</label>
          <input type="text" id="profile-last-name" value="${currentUser.profile?.last_name || ''}">
        </div>
        <div class="input-group">
          <label>Home Location</label>
          <div class="input-wrapper">
            <input type="text" id="profile-home" value="${currentUser.profile?.home || ''}">
            <div id="home-suggestions" class="suggestions"></div>
          </div>
        </div>
        <button type="submit" class="btn primary">Save Changes</button>
      </form>
    </div>
  `;
  async function showProfilePage() {
    // Create modal element
    const modal = document.createElement("div");
    modal.id = "profile-modal";
    modal.className = "modal";
    modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-content").insertAdjacentHTML("beforeend", profileHTML);

    // Add event listener to close button
    const closeBtn = modal.querySelector(".close");
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    // Display modal
    modal.style.display = "block";

    setupAddressAutocomplete("profile-home", "home-suggestions");

    document.getElementById("profile-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProfile({
        first_name: document.getElementById("profile-first-name").value,
        last_name: document.getElementById("profile-last-name").value,
        home: document.getElementById("profile-home").value,
      });
      // Reload to refresh the UI
      location.reload();
    });
  }


function setupHeaderUserInfo() {
  if (!currentUser?.profile) return;

  // Remove existing user info if present
  const existingInfo = document.querySelector('.user-info');
if (existingInfo) existingInfo.remove();
const headerActions = document.querySelector('.header-actions');
if (!headerActions) return;

const userInfo = document.createElement('div');
userInfo.className = 'user-info';
userInfo.innerHTML = `
`;
headerActions.prepend(userInfo);

}

function setupThemeToggle() {    
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      if (currentTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "light");
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
    });
}
