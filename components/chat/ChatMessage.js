import MarkdownIt from 'markdown-it';

export class ChatMessage {
  static async add(content, sender, options = {}) {
    const { isLoading = false, typingSpeed = 30 } = options;
    const chatContainer = document.getElementById('output');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender} ${isLoading ? 'loading' : ''}`;
    
    // Create message structure
    messageElement.innerHTML = `
      <div class="message-content">
        ${sender === 'bot' ? '<div class="bot-icon"><i class="fas fa-robot"></i></div>' : ''}
        <div class="message-text"></div>
      </div>
    `;
    
    chatContainer.appendChild(messageElement);
    
    const textContainer = messageElement.querySelector('.message-text');
    
    if (sender === 'bot' && !isLoading && typingSpeed > 0) {
      // Add typing indicator and animate message
      messageElement.classList.add('typing');
      await this.typeMessage(textContainer, content, typingSpeed);
      messageElement.classList.remove('typing');
    } else {
      // Immediate display for user messages or when no typing effect wanted
      textContainer.innerHTML = this.renderContent(content);
    }
    
    // Add timestamp after message is complete
    const timeElement = document.createElement('small');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.appendChild(timeElement);
    
    this.scrollToBottom();
    return messageElement;
  }

  static async typeMessage(element, content, speed) {
    const renderedContent = this.renderContent(content);
    let i = 0;
    
    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    element.appendChild(typingIndicator);
    
    // Wait a moment before starting to type
    await new Promise(resolve => setTimeout(resolve, 800));
    element.removeChild(typingIndicator);
    
    // Type the message character by character
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (i < renderedContent.length) {
          element.innerHTML = renderedContent.substring(0, i + 1);
          
          // Scroll periodically (not on every character for performance)
          if (i % 5 === 0) {
            this.scrollToBottom();
          }
          
          i++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  static renderContent(content) {
    if (typeof content === 'string') {
      return new MarkdownIt().render(content);
    }
    return content;
  }

  static remove(element) {
    element?.parentNode?.removeChild(element);
  }

  static scrollToBottom() {
    const chatContainer = document.getElementById('output');
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}