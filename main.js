import { AuthModal } from './components/auth/AuthModal.js';
import { ChatMessage } from './components/chat/ChatMessage.js';
import { TransportForm } from './components/forms/TransportForm.js';
import { TransportService } from './services/transportService.js';
import { getSession, login, signup, logout, getProfile } from './services/authService.js';
import { getCurrentLocation } from './services/locationService.js';

// Initialize services and components
const authModal = new AuthModal();
const transportService = new TransportService();
const transportForm = new TransportForm(transportService);
let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize auth modal with handlers
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
          first_name: currentUser.user_metadata?.first_name,
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
      console.error('Session check error:', error);
      authModal.show();
      ChatMessage.add('Error checking your session. Please try again.', 'bot');
      return;
    }

    if (session) {
      currentUser = session.user;
      // Ensure we have profile data
      if (!currentUser.profile) {
        currentUser.profile = await getProfile(currentUser.id) || {
          first_name: currentUser.user_metadata?.first_name,
          last_name: currentUser.user_metadata?.last_name
        };
      }
      
      authModal.hide();
      showWelcomeMessage(currentUser.profile?.first_name);
      setupLoggedInState();
      setupHeaderUserInfo();
    } else {
      authModal.show();
      ChatMessage.add('Hi there! 👋 Please log in to use Uthutho, your transport AI assistant.', 'bot');
    }

    // Initialize transport form
    transportForm.init();

    // Set up theme toggle
    setupThemeToggle();

  } catch (error) {
    console.error('Initialization error:', error);
    ChatMessage.add(`
      ❌ Application Error: 
      ${error.message}
      Please refresh the page or try again later.
    `, 'bot');
  }
});

function showWelcomeMessage(firstName = null) {
  const message = firstName 
    ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`
    : 'Welcome back! Where would you like to go today?';
  ChatMessage.add(message, 'bot');
}



function setupLoggedInState() {
  // Set current location if available
  const fromInput = document.getElementById('from');
  if (fromInput && !fromInput.value) {
    getCurrentLocation().then(location => {
      if (location) {
        fromInput.value = location;
        ChatMessage.add(`I've automatically set your current location to ${location}`, 'bot');
      }
    }).catch(error => {
      console.error('Location detection failed:', error);
    });
  }

  const headerActions = document.querySelector('.header-actions');
  const profileBtn = document.createElement('button');
  profileBtn.className = 'btn icon-btn';
  profileBtn.innerHTML = '<i class="fas fa-user"></i>';
  profileBtn.addEventListener('click', showProfilePage);
  headerActions.prepend(profileBtn);

  

  // Add logout button
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'btn icon-btn';
  logoutBtn.id = 'logout-btn';
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
  document.querySelector('.header-actions').appendChild(logoutBtn);

  logoutBtn.addEventListener('click', async () => {
    try {
      const { error } = await logout();
      if (error) throw error;
      
      currentUser = null;
      authModal.show();
      document.getElementById('output').innerHTML = '';
      ChatMessage.add('Please log in to continue using Uthutho.', 'bot');
      logoutBtn.remove();
      
      // Remove user info from header
      const userInfoElement = document.querySelector('.user-info');
      if (userInfoElement) userInfoElement.remove();
    } catch (error) {
      console.error('Logout failed:', error);
      ChatMessage.add(`Logout failed: ${error.message}`, 'bot');
    }
  });
}


async function showProfilePage() {
  // Create profile form
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

  // Show profile form in chat container temporarily
  const chatContainer = document.getElementById('output');
  chatContainer.innerHTML = '';
  chatContainer.insertAdjacentHTML('afterbegin', profileHTML);

  setupAddressAutocomplete('profile-home', 'home-suggestions');
  
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateProfile({
      first_name: document.getElementById('profile-first-name').value,
      last_name: document.getElementById('profile-last-name').value,
      home: document.getElementById('profile-home').value
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
    <span class="user-name">${currentUser.profile.first_name || 'User'}</span>
    <span class="user-title">${currentUser.profile.selected_title || 'Explorer'}</span>
  `;
  headerActions.prepend(userInfo);
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  });
}