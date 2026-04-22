// ==========================================
// 1. FIREBASE CONFIGURATION & AUTHENTICATION
// ==========================================
const firebaseConfig = {
   apiKey: "AIzaSyAOrluzELUzlH-ePkWMOMmQVRZa-yizNqU",
  authDomain: "alnitak-ai.firebaseapp.com",
  projectId: "alnitak-ai",
  storageBucket: "alnitak-ai.firebasestorage.app",
  messagingSenderId: "449925456545",
  appId: "1:449925456545:web:ca46cfd4760d95a78e86e0",
  measurementId: "G-PBLZ9H0T57"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// UI Elements for Auth
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const logoutBtn = document.getElementById('logout-btn');

const authTitle = document.getElementById('auth-title');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authActionBtn = document.getElementById('auth-action-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');

// State to track if user is on Login or Sign Up screen
let isLoginMode = true;

// Toggle between Login and Sign Up UI
toggleAuthBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerHTML = 'Log <span class="highlight">In</span>';
        authUsername.style.display = 'none';
        authActionBtn.textContent = 'Login';
        toggleAuthBtn.previousSibling.textContent = "Don't have an account? ";
        toggleAuthBtn.textContent = 'Create new';
    } else {
        authTitle.innerHTML = 'Sign <span class="highlight">Up</span>';
        authUsername.style.display = 'block';
        authActionBtn.textContent = 'Create Account';
        toggleAuthBtn.previousSibling.textContent = "Already have an account? ";
        toggleAuthBtn.textContent = 'Login here';
    }
});

// Handle Login / Sign Up Action
authActionBtn.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
        alert("Email and Password fill pannunga bro!");
        return;
    }

    if (isLoginMode) {
        // Login Logic
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => alert("Login Error: " + error.message));
    } else {
        // Sign Up Logic
        const username = authUsername.value.trim();
        if (!username) {
            alert("Username fill pannunga bro!");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Update profile with the username
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .catch(error => alert("Sign Up Error: " + error.message));
    }
});

// Logout Logic
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Auth State Observer (Switches screens automatically)
auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'block';
        // Clear input fields for security
        authEmail.value = '';
        authPassword.value = '';
        authUsername.value = '';
    } else {
        loginScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
    }
});

// ==========================================
// 2. AI CHAT LOGIC (OPENROUTER API)
// ==========================================
const OPENROUTER_API_KEY = "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";
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Array to store messages for Backup
let chatHistory = [];

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'User' ? 'user-msg' : 'ai-msg');
    
    // white-space: pre-wrap CSS property ensures line breaks (\n) are shown properly
    const contentSpan = document.createElement('span');
    contentSpan.classList.add('message-content');
    contentSpan.textContent = text; 
    
    msgDiv.appendChild(contentSpan);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Save to history array for backup
    chatHistory.push({ sender, text });
}

// Typing Indicator UI kaata oru function
function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'ai-msg', 'typing-indicator');
    
    // 3 Dots create pandrom
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        msgDiv.appendChild(dot);
    }
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll
    
    return msgDiv; // Idha return pandrom so that response vandhathum delete pannidalam
}

// Updated Fetch Function with STREAMING
async function fetchAIResponse(userText) {
    // 1. AI Type panra mari kaata typing indicator-a call pandrom
    const typingDiv = showTypingIndicator();

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5500", 
                "X-Title": "Alnitak AI"
            },
            body: JSON.stringify({
                "model": "openai/gpt-oss-120b:free",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a highly intelligent and helpful AI assistant named Alnitak AI. You were created and developed by Sk edz. Answer user queries politely and accurately."
                    },
                    {
                        "role": "user", 
                        "content": userText
                    }
                ],
                "stream": true // Streaming enable panidrom
            })
        });

        // 2. Response start aanathum Typing indicator-a remove pannidrom
        chatBox.removeChild(typingDiv);

        // Pudhusa oru empty message box create pandrom (Type aaguradha kaata)
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai-msg');
        const contentSpan = document.createElement('span');
        contentSpan.classList.add('message-content');
        msgDiv.appendChild(contentSpan);
        chatBox.appendChild(msgDiv);

        // Streaming Data-va read panna logic
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAIResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') break; // Process mudinjiduchu

                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices[0].delta.content || "";
                        fullAIResponse += content;
                        
                        // Text update panni auto-scroll pandrom
                        contentSpan.textContent = fullAIResponse;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    } catch (e) {
                        // Incomplete chunks vandha ignore pannidum
                    }
                }
            }
        }

        // Full message vandhathum backup-ku save pandrom
        chatHistory.push({ sender: 'AI', text: fullAIResponse });

    } catch (error) {
        if (typingDiv.parentNode) chatBox.removeChild(typingDiv);
        appendMessage('AI', "Connection error! API key check pannunga bro.");
        console.error(error);
    }
}

// ==========================================
// 3. UI EVENT LISTENERS & BACKUP LOGIC
// ==========================================

// Send Message Event
sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        // Greeting-a hide panna
        const greetingMsg = document.getElementById('greeting-message');
        if (greetingMsg) greetingMsg.style.display = 'none';

        appendMessage('User', text);
        userInput.value = '';
        userInput.style.height = '50px'; // Reset height
        userInput.style.overflowY = 'hidden';
        fetchAIResponse(text);
    }
});

// Handle Enter key for sending, Shift+Enter for new line
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

const backupBtn = document.getElementById('backup-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// Backup: Download chat history as a JSON file
backupBtn.addEventListener('click', () => {
    if(chatHistory.length === 0) return alert("No messages to backup!");
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "chat_backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

// Import: Trigger file input click
importBtn.addEventListener('click', () => importFile.click());

// Load JSON file and display messages
importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedHistory = JSON.parse(e.target.result);
                chatBox.innerHTML = ''; // Clear current chat
                chatHistory = []; // Reset history
                
                importedHistory.forEach(msg => {
                    appendMessage(msg.sender, msg.text);
                });
            } catch (error) {
                alert("Invalid backup file!");
            }
        };
        reader.readAsText(file);
    }
});