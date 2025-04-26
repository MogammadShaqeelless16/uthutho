import { AuthModal } from './components/auth/AuthModal.js';
import { ChatMessage } from './components/chat/ChatMessage.js';
import { TransportForm } from './components/forms/TransportForm.js';
import { TransportService } from './services/transportService.js';
import { getSession, login, signup, logout } from './services/authService.js';
import { getCurrentLocation } from './services/locationService.js';

// Initialize services
const authModal = new AuthModal();
const transportService = new TransportService();
const transportForm = new TransportForm(transportService);
let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize auth modal
    authModal.init({
      onLogin: async (email, password) => {
        const { data, error } = await login(email, password);
        if (error) {
          authModal.showError(error.message);
          return;
        }
        currentUser = data.user;
        authModal.hide();
        showWelcomeMessage();
        setupLoggedInState();
      },
      onSignup: async (email, password, firstName, lastName) => {
        const { data, error } = await signup(email, password, firstName, lastName);
        if (error) {
          authModal.showError(error.message);
          return;
        }
        currentUser = data.user;
        authModal.hide();
        showWelcomeMessage(firstName);
        setupLoggedInState();
      }
    });

    // Check auth state
    const { data: { session } } = await getSession();
    if (session) {
      currentUser = session.user;
      authModal.hide();
      showWelcomeMessage();
      setupLoggedInState();
    } else {
      authModal.show();
      ChatMessage.add('Hi there! 👋 Please log in to use Uthutho.', 'bot');
    }

    // Initialize transport form
    transportForm.init();

    // Set up logout button
    setupLogoutHandler();

    // Set up theme toggle
    setupThemeToggle();

  } catch (error) {
    console.error('Initialization error:', error);
    ChatMessage.add('Application error. Please refresh the page.', 'bot');
  }
});

function showWelcomeMessage(firstName = null) {
  const message = firstName 
    ? `Welcome ${firstName}! 👋 I'm Uthutho, your transport AI assistant.`
    : 'Welcome back! Where would you like to go today?';
  ChatMessage.add(message, 'bot');
}

function setupLoggedInState() {
  const fromInput = document.getElementById('from');
  if (fromInput && !fromInput.value) {
    getCurrentLocation().then(location => {
      if (location) {
        fromInput.value = location;
        ChatMessage.add(`Location set to ${location}`, 'bot');
      }
    });
  }
}

function setupLogoutHandler() {
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'btn icon-btn';
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
  document.querySelector('.header-actions').appendChild(logoutBtn);

  logoutBtn.addEventListener('click', async () => {
    const { error } = await logout();
    if (error) {
      ChatMessage.add(`Logout failed: ${error.message}`, 'bot');
    } else {
      currentUser = null;
      authModal.show();
      document.getElementById('output').innerHTML = '';
      ChatMessage.add('Please log in to continue.', 'bot');
      logoutBtn.remove();
    }
  });
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark' 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  });
}