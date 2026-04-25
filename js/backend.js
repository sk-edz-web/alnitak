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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const logoutBtn = document.getElementById('logout-btn');

const authTitle = document.getElementById('auth-title');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authActionBtn = document.getElementById('auth-action-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');

let isLoginMode = true;

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

authActionBtn.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) return alert("Email and Password fill pannunga bro!");

    if (isLoginMode) {
        auth.signInWithEmailAndPassword(email, password).catch(error => alert("Login Error: " + error.message));
    } else {
        const username = authUsername.value.trim();
        if (!username) return alert("Username fill pannunga bro!");

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => userCredential.user.updateProfile({ displayName: username }))
            .catch(error => alert("Sign Up Error: " + error.message));
    }
});

logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'block';
        authEmail.value = ''; authPassword.value = ''; authUsername.value = '';
    } else {
        loginScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
    }
});

// ==========================================
// 2. SIDEBAR & MULTI-CHAT LOGIC
// ==========================================
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const closeSidebar = document.getElementById('close-sidebar');
const historyList = document.getElementById('history-list');

// Open and Close Sidebar
menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

let allSessions = JSON.parse(localStorage.getItem('alnitak_sessions')) || [];
let currentSessionId = null;
let chatHistory = [];

function saveCurrentSession() {
    if (chatHistory.length === 0) return;
    
    // Auto-generate title based on first message
    const title = chatHistory[0].text.substring(0, 25) + "..."; 

    const existingSession = allSessions.find(s => s.id === currentSessionId);
    if (existingSession) {
        existingSession.messages = chatHistory;
        existingSession.title = title;
    } else {
        const newSession = { id: Date.now(), title: title, messages: chatHistory };
        allSessions.unshift(newSession); 
        currentSessionId = newSession.id;
    }
    localStorage.setItem('alnitak_sessions', JSON.stringify(allSessions));
    renderSidebar();
}

function renderSidebar() {
    historyList.innerHTML = '';
    allSessions.forEach(session => {
        const div = document.createElement('div');
        div.classList.add('history-item');
        if (session.id === currentSessionId) div.classList.add('active-chat');
        div.textContent = session.title;
        
        div.addEventListener('click', () => {
            currentSessionId = session.id;
            chatHistory = [...session.messages];
            chatBox.innerHTML = ''; 
            if (document.getElementById('greeting-message')) document.getElementById('greeting-message').style.display = 'none';
            chatHistory.forEach(msg => renderMessageOnly(msg.sender, msg.text));
            sidebar.classList.remove('active'); 
            renderSidebar();
        });
        historyList.appendChild(div);
    });
}

document.getElementById('new-chat-btn').addEventListener('click', () => {
    chatHistory = [];
    currentSessionId = null;
    chatBox.innerHTML = `
        <div id="greeting-message" class="greeting-message">
            <h2 class="greet-name">Hi I am Alnitak</h2>
            <h1 class="greet-text">How can I help you today?</h1>
        </div>`;
    sidebar.classList.remove('active');
    renderSidebar();
});

// Load latest chat on startup
window.addEventListener('DOMContentLoaded', () => {
    if (allSessions.length > 0) {
        currentSessionId = allSessions[0].id;
        chatHistory = [...allSessions[0].messages];
        if (document.getElementById('greeting-message')) document.getElementById('greeting-message').style.display = 'none';
        chatHistory.forEach(msg => renderMessageOnly(msg.sender, msg.text));
    }
    renderSidebar();
});


// ==========================================
// 3. AI CHAT LOGIC (OPENROUTER)
// ==========================================
const OPENROUTER_API_KEY = "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";
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function renderMessageOnly(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'User' ? 'user-msg' : 'ai-msg');
    const contentSpan = document.createElement('span');
    contentSpan.classList.add('message-content');
    contentSpan.textContent = text; 
    msgDiv.appendChild(contentSpan);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(sender, text) {
    renderMessageOnly(sender, text);
    chatHistory.push({ sender, text });
    saveCurrentSession();
}

function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'ai-msg', 'typing-indicator');
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        msgDiv.appendChild(dot);
    }
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; 
    return msgDiv; 
}

async function fetchAIResponse(userText) {
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
                    { "role": "system", "content": "You are Alnitak AI, developed by Sk edz. Answer briefly and naturally." },
                    { "role": "user", "content": userText }
                ],
                "stream": true 
            })
        });

        chatBox.removeChild(typingDiv);
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai-msg');
        const contentSpan = document.createElement('span');
        contentSpan.classList.add('message-content');
        msgDiv.appendChild(contentSpan);
        chatBox.appendChild(msgDiv);

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
                    if (dataStr === '[DONE]') break; 
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices[0].delta.content || "";
                        fullAIResponse += content;
                        contentSpan.textContent = fullAIResponse;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    } catch (e) {}
                }
            }
        }

        chatHistory.push({ sender: 'AI', text: fullAIResponse });
        saveCurrentSession();

    } catch (error) {
        if (typingDiv.parentNode) chatBox.removeChild(typingDiv);
        appendMessage('AI', "Connection error! API key check pannunga bro.");
    }
}

// Send Actions
sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        if (document.getElementById('greeting-message')) document.getElementById('greeting-message').style.display = 'none';
        appendMessage('User', text);
        userInput.value = '';
        fetchAIResponse(text);
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// ==========================================
// 4. BACKUP & IMPORT
// ==========================================
document.getElementById('backup-btn').addEventListener('click', () => {
    if(allSessions.length === 0) return alert("No messages to backup!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allSessions));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", "alnitak_backup.json");
    document.body.appendChild(downloadNode); 
    downloadNode.click();
    downloadNode.remove();
});

const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSessions = JSON.parse(e.target.result);
                allSessions = importedSessions;
                localStorage.setItem('alnitak_sessions', JSON.stringify(allSessions));
                renderSidebar();
                alert("Backup restored successfully!");
                // Reload first chat if exists
                if (allSessions.length > 0) {
                    currentSessionId = allSessions[0].id;
                    chatHistory = [...allSessions[0].messages];
                    chatBox.innerHTML = '';
                    if (document.getElementById('greeting-message')) document.getElementById('greeting-message').style.display = 'none';
                    chatHistory.forEach(msg => renderMessageOnly(msg.sender, msg.text));
                }
            } catch (error) {
                alert("Invalid backup file!");
            }
        };
        reader.readAsText(file);
    }
});
