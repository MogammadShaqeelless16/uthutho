import { AuthModal } from './components/auth/AuthModal.js';
import { ChatMessage } from './components/chat/ChatMessage.js';
import { TransportForm } from './components/forms/TransportForm.js';
import { TransportService } from './services/transportService.js';
import { getSession, login, signup, logout, supabase } from './services/authService.js';
import { getCurrentLocation } from './services/locationService.js';

// Initialize services and components
const authModal = new AuthModal();
const transportService = new TransportService();
const transportForm = new TransportForm(transportService);
let currentUser = null;

// Verify Supabase connection on startup
function verifySupabaseConnection() {
  if (!supabase) {
    const errorMsg = 'Supabase connection failed. Please check your environment variables.';
    console.error(errorMsg);
    ChatMessage.add(`
      ❌ Application Error: 
      ${errorMsg}
      Please contact support or check your configuration.
    `, 'bot');
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", async function () {
  // First verify Supabase connection
  if (!verifySupabaseConnection()) return;

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
        authModal.hide();
        showWelcomeMessage();
        setupLoggedInState();
        return null;
      },
      onSignup: async (email, password, firstName, lastName) => {
        const { data, error } = await signup(email, password, firstName, lastName);
        if (error) {
          authModal.showError(error.message);
          return error;
        }
        currentUser = data.user;
        authModal.hide();
        showWelcomeMessage(firstName);
        setupLoggedInState();
        return null;
      }
    });

    // Check initial auth state
    await checkAuthState();

    // Initialize transport form
    transportForm.init();

    // Set up logout button if exists
    setupLogoutHandler();

    // Set up theme toggle if exists
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

async function checkAuthState() {
  try {
    const { data: { session }, error } = await getSession();
    if (error) throw error;

    if (session) {
      currentUser = session.user;
      authModal.hide();
      showWelcomeMessage();
      setupLoggedInState();
    } else {
      authModal.show();
      ChatMessage.add('Hi there! 👋 Please log in to use Uthutho, your transport AI assistant.', 'bot');
    }
  } catch (error) {
    console.error('Auth state check failed:', error);
    ChatMessage.add('⚠️ Unable to check login status. Please refresh the page.', 'bot');
  }
}

function showWelcomeMessage(firstName = null) {
  const message = firstName 
    ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant. Where would you like to go today?`
    : 'Welcome back! Where would you like to go today?';
  ChatMessage.add(message, 'bot');
}

function setupLoggedInState() {
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
}

function setupLogoutHandler() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      const { error } = await logout();
      if (error) throw error;
      
      currentUser = null;
      authModal.show();
      document.getElementById('output').innerHTML = '';
      ChatMessage.add('Please log in to continue using Uthutho.', 'bot');
    } catch (error) {
      console.error('Logout failed:', error);
      ChatMessage.add(`Logout failed: ${error.message}`, 'bot');
    }
  });
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