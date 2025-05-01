import { ChatMessage } from '../chat/ChatMessage.js';
import { getCurrentLocation } from '../../services/locationService.js';

export class TransportForm {
  constructor(transportService) {
    this.transportService = transportService;
    this.form = document.getElementById('search-form');
    this.fromInput = document.getElementById('from');
    this.toInput = document.getElementById('to');
    this.languageSelect = document.getElementById('languageSelect');
    this.transportSelect = document.getElementById('transportSelect');
    this.currentLocationBtn = document.getElementById('current-location');
    this.timeEstimateBtn = document.getElementById('time-estimate-btn');
    this.priceRangeBtn = document.getElementById('price-range-btn');
  }

  init() {
    // Event listeners
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e, 'full'));
    this.timeEstimateBtn?.addEventListener('click', () => this.handleSubmit(null, 'time-only'));
    this.currentLocationBtn?.addEventListener('click', () => this.setCurrentLocation());
    this.priceRangeBtn?.addEventListener('click', () => this.handleSubmit(null, 'price-only'));

    // Initialize current location if available
    this.setCurrentLocation();
  }

  async handleSubmit(e, queryType) {
    e?.preventDefault();
    
    if (!this.validateInputs()) return;

    const fromLocation = this.fromInput.value.trim();
    const toLocation = this.toInput.value.trim();
    const language = this.languageSelect.value;
    const transportType = this.transportSelect.value;

    this.transportService.setQueryType(queryType);
    await this.transportService.process(fromLocation, toLocation, language, transportType);
  }

  validateInputs() {
    if (!this.fromInput.value.trim() || !this.toInput.value.trim()) {
      ChatMessage.add('Please enter both your starting location and destination.', 'bot');
      return false;
    }
    return true;
  }

  async setCurrentLocation() {
    const location = await getCurrentLocation();
    if (location && this.fromInput) {
      this.fromInput.value = location;
      ChatMessage.add(`Current location set to: ${location}`, 'bot');
    } else {
      ChatMessage.add('Could not determine current location', 'bot');
    }
  }

  getFormData() {
    return {
      from: this.fromInput.value.trim(),
      to: this.toInput.value.trim(),
      language: this.languageSelect.value,
      transportType: this.transportSelect.value
    };
  }
}