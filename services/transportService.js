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
      let prompt;
      switch (this.queryType) {
        case 'price-only':
          prompt = `What is the price range for traveling from ${fromLocation} to ${toLocation} using ${transportType} in ${language}?`;
          break;
        case 'time-only':
          prompt = `How long does it take to travel from ${fromLocation} to ${toLocation} using ${transportType} in ${language}?`;
          break;
        case 'full':
        default:
          prompt = generatePrompt(fromLocation, toLocation, language, this.queryType, transportType);
          break;
      }
      
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