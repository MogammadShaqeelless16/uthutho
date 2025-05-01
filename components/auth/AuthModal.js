import { supabase } from '../../supabase.js';

export class AuthModal {
    constructor() {
      this.modal = document.getElementById('auth-modal');
      this.loginForm = document.getElementById('login-form');
      this.signupForm = document.getElementById('signup-form');
    }
  
    init({ onLogin, onSignup, onGoogleSignUp, onFacebookSignUp }) {
      // Form toggling
      const showLoginButton = document.getElementById('show-login');
      if (showLoginButton) {
        showLoginButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.showLoginForm();
        });
      }
    
      const showSignupButton = document.getElementById('show-signup');
      if (showSignupButton) {
        showSignupButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.showSignupForm();
        });
      }
    
      const closeModalButton = document.querySelector('.close-modal');
      if (closeModalButton) {
        closeModalButton.addEventListener('click', () => this.hide());
      }
    
      // Form submissions
      if (this.loginForm) {
        this.loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value;
          const password = document.getElementById('login-password').value;
          await onLogin(email, password);
        });
      }
    
      if (this.signupForm) {
        this.signupForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        await onSignup(email, password, firstName, lastName);
      });
    }

      // Google Sign-Up
      const googleBtn = document.getElementById('google-signup');
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
          });
          if (error) {
            this.showError(`Error signing in with Google: ${error.message}`);
          } else {
             const { data, error } = await supabase.auth.getSession()
             if(data.session){
              await onLogin(data.session.user.email, null)
             }else{
              this.showError(`Error signing in with Google.`)
             }
          }
        });
      }

      // Facebook Sign-Up
      const facebookBtn = document.getElementById('facebook-signup');
      if (facebookBtn) {
        facebookBtn.addEventListener('click', async () => {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
          });
          if (error) {
            this.showError(`Error signing in with Facebook: ${error.message}`);
          }else {
             const { data, error } = await supabase.auth.getSession()
             if(data.session){
              await onLogin(data.session.user.email, null)
             }else{
              this.showError(`Error signing in with Facebook.`)
             }
          }
        });
      }
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