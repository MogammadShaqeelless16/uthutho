export class AuthModal {
    constructor() {
      this.modal = document.getElementById('auth-modal');
      this.loginForm = document.getElementById('login-form');
      this.signupForm = document.getElementById('signup-form');
    }
  
    init({ onLogin, onSignup }) {
      // Form toggling
      document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
      
      document.getElementById('show-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSignupForm();
      });
  
      document.querySelector('.close-modal')?.addEventListener('click', () => this.hide());
  
      // Form submissions
      this.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await onLogin(email, password);
      });
  
      this.signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        await onSignup(email, password, firstName, lastName);
      });
    }
  
    show() { this.modal.style.display = 'block'; }
    hide() { this.modal.style.display = 'none'; }
  
    showLoginForm() {
      this.signupForm.style.display = 'none';
      this.loginForm.style.display = 'block';
      document.getElementById('auth-title').textContent = 'Login';
    }
  
    showSignupForm() {
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