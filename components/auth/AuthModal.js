export class AuthModal {
    constructor() {
      this.modal = document.getElementById('auth-modal');
    }
  
    init({ onLogin, onSignup }) {
      this.closeModal = document.querySelector('.close-modal');
      this.showLogin = document.getElementById('show-login');
      this.showSignup = document.getElementById('show-signup');
      this.loginForm = document.getElementById('login-form');
      this.signupForm = document.getElementById('signup-form');
  
      // Event listeners
      this.closeModal?.addEventListener('click', () => this.hide());
      this.showLogin?.addEventListener('click', (e) => this.showLoginForm(e));
      this.showSignup?.addEventListener('click', (e) => this.showSignupForm(e));
  
      // Form submissions
      this.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const error = await onLogin(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );
        if (error) this.showError(error.message);
      });
  
      this.signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const error = await onSignup(
          document.getElementById('signup-email').value,
          document.getElementById('signup-password').value,
          document.getElementById('first-name').value,
          document.getElementById('last-name').value
        );
        if (error) this.showError(error.message);
      });
    }
  
    show() { this.modal.style.display = 'block'; }
    hide() { this.modal.style.display = 'none'; }
  
    showLoginForm(e) {
      e.preventDefault();
      this.signupForm.style.display = 'none';
      this.loginForm.style.display = 'block';
      document.getElementById('auth-title').textContent = 'Login';
    }
  
    showSignupForm(e) {
      e.preventDefault();
      this.loginForm.style.display = 'none';
      this.signupForm.style.display = 'block';
      document.getElementById('auth-title').textContent = 'Sign Up';
    }
  
    showError(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = message;
      
      const authForm = document.getElementById('auth-form');
      const existingError = authForm.querySelector('.error-message');
      if (existingError) authForm.removeChild(existingError);
      
      authForm.prepend(errorElement);
    }
  }