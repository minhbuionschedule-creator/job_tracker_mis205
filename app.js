// 1. Initialize Supabase (Put your keys here!)
const supabaseUrl = 'https://xlimntsvahequrntnjlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaW1udHN2YWhlcXVybnRuamxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjMxNTksImV4cCI6MjA5NTE5OTE1OX0.8UUL2er5Zo0egwji2tRChnduXn8wMlLXEiQE2K2uTlo';

// We call it 'db' here so the browser doesn't get confused!
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// UI Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');

// 2. Auth State Listener 
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// 3. Register Function
async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await db.auth.signUp({ email, password });
    
    if (error) {
        authMessage.innerText = error.message;
    } else {
        authMessage.innerText = "Success! You can now log in.";
        authMessage.classList.replace('text-red-500', 'text-green-500');
    }
}

// 4. Login Function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    
    if (error) authMessage.innerText = error.message;
}

// 5. Logout Function
async function logout() {
    await db.auth.signOut();
}