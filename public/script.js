const messagesArea = document.getElementById('messagesArea');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let chatHistory = [];

function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    // Convert markdown usage (basic) to HTML
    let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-content">${formattedContent}</div>
        <div class="message-time">${time}</div>
    `;

    return messageDiv;
}

function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    return indicator;
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

async function handleSubmit(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message
    messagesArea.appendChild(createMessageElement(message, true));
    messageInput.value = '';
    scrollToBottom();

    // Disable input while waiting
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Show typing indicator
    const typingIndicator = createTypingIndicator();
    messagesArea.appendChild(typingIndicator);
    scrollToBottom();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory
            })
        });

        const data = await response.json();

        // Update history
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: data.reply });

        // Remove typing indicator and add bot response
        typingIndicator.remove();
        messagesArea.appendChild(createMessageElement(data.reply, false));

    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        messagesArea.appendChild(createMessageElement('Lo siento, hubo un error al conectar con el servidor.', false));
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
        scrollToBottom();
    }
}

chatForm.addEventListener('submit', handleSubmit);
