import MarkdownIt from 'markdown-it';

export class ChatMessage {
  static add(content, sender, isLoading = false) {
    const chatContainer = document.getElementById('output');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender} ${isLoading ? 'loading' : ''}`;
    
    messageElement.innerHTML = `
      <div class="message-content">
        ${sender === 'bot' ? '<div class="bot-icon"><i class="fas fa-robot"></i></div>' : ''}
        <div class="message-text">${this.renderContent(content)}</div>
      </div>
      <small class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
    `;
    
    chatContainer.appendChild(messageElement);
    this.scrollToBottom();
    return messageElement;
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