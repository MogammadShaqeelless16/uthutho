import { ChatMessage } from '../components/chat/ChatMessage.js';
import { generatePrompt, getGeminiResponse } from './geminiService.js';

export class TransportService {
  constructor() {
    this.queryType = 'full';
  }

  setQueryType(type) {
    this.queryType = type;
  }

  async process(fromLocation, toLocation, language, transportType) {
    if (!fromLocation || !toLocation) {
      ChatMessage.add('Please enter both locations.', 'bot');
      return;
    }

    ChatMessage.add(`From ${fromLocation} to ${toLocation}`, 'user');
    const loadingMsg = ChatMessage.add('Finding options...', 'bot', true);

    try {
      const prompt = generatePrompt(fromLocation, toLocation, language, this.queryType, transportType);
      const response = await getGeminiResponse(prompt);
      ChatMessage.remove(loadingMsg);
      ChatMessage.add(response, 'bot');
    } catch (error) {
      ChatMessage.remove(loadingMsg);
      ChatMessage.add(`Error: ${error.message}`, 'bot');
      this.showFallbackOptions(fromLocation, toLocation);
    }
  }

  showFallbackOptions(from, to) {
    const options = `## Fallback Options\n- Bus: ~30 min\n- Train: ~25 min`;
    ChatMessage.add(options, 'bot');
  }
}