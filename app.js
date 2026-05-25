// ==========================================
// 1. INITIALIZE SUPABASE
// ==========================================
const supabaseUrl = 'https://xlimntsvahequrntnjlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaW1udHN2YWhlcXVybnRuamxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjMxNTksImV4cCI6MjA5NTE5OTE1OX0.8UUL2er5Zo0egwji2tRChnduXn8wMlLXEiQE2K2uTlo';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. UI ELEMENTS & SMART ROUTER
// ==========================================
const landingSection = document.getElementById('landing-section');
const landingGuest = document.getElementById('landing-guest'); // The Login Cards & Marketing
const landingUser = document.getElementById('landing-user');   // The Video & Articles
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');
const landingAuthContainer = document.getElementById('landing-auth-buttons');

let currentUser = null; 

// Changes what the Navbar & Homepage looks like based on login status
function updateLandingState() {
    if (currentUser) {
        // User is Logged In
        landingAuthContainer.innerHTML = `
            <button onclick="showDashboardPage()" class="text-blue-600 bg-blue-50 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">Go to Dashboard →</button>
            <button onclick="logout()" class="hidden sm:block text-slate-500 font-bold px-5 py-2.5 hover:text-red-600 transition-colors">Sign Out</button>
        `;
        landingGuest.classList.add('hidden');
        landingUser.classList.remove('hidden');
    } else {
        // User is Logged Out
        landingAuthContainer.innerHTML = `
            <button onclick="showAuthPage()" class="hidden sm:block text-blue-600 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">Sign In</button>
            <button onclick="showAuthPage()" class="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all">Get Started</button>
        `;
        landingGuest.classList.remove('hidden');
        landingUser.classList.add('hidden');
    }
}

function showLandingPage() {
    landingSection.classList.remove('hidden');
    authSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    updateLandingState(); // Make sure the right homepage shows!
}

function showAuthPage() {
    landingSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboardPage() {
    if (!currentUser) return showAuthPage(); 
    landingSection.classList.add('hidden');
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    fetchApplications();
}

// ==========================================
// 3. AUTHENTICATION
// ==========================================
db.auth.onAuthStateChange((event, session) => {
  currentUser = session ? session.user : null;
  updateLandingState();

  if (!session) {
      // If they log out, kick them to the home page
      if (!dashboardSection.classList.contains('hidden') || !authSection.classList.contains('hidden')) {
          showLandingPage();
      }
  } else if (event === 'INITIAL_SESSION') {
      // When they first open the website, take them to their dashboard
      showDashboardPage();
  } else if (event === 'SIGNED_IN') {
      // Supabase sends a background "SIGNED_IN" event when switching tabs.
      // We ONLY want to move them to the dashboard if they were actively on the Auth screen!
      if (!authSection.classList.contains('hidden')) {
          showDashboardPage();
      }
  }
});

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await db.auth.signUp({ email, password });

  if (error) {
    authMessage.innerText = error.message;
  } else {
    authMessage.innerText = 'Success! Please log in.';
    authMessage.classList.replace('text-red-500', 'text-green-500');
  }
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) authMessage.innerText = error.message;
}

async function logout() {
  await db.auth.signOut();
}

// Leave addApplication, fetchApplications, updateStatus, deleteApplication alone below this!
// ==========================================
// 4. CRUD OPERATIONS
// ==========================================

async function addApplication() {
  const companyName = document.getElementById('company_name').value;
  const roleTitle = document.getElementById('role_title').value;

  if (!currentUser) return alert('User not logged in');

  const { error } = await db.from('applications').insert([
      { user_id: currentUser.id, company_name: companyName, role_title: roleTitle }
  ]);

  if (error) return alert('Failed to save application');

  document.getElementById('company_name').value = '';
  document.getElementById('role_title').value = '';
  fetchApplications();
}

async function fetchApplications() {
  if (!currentUser) return;

  const { data, error } = await db.from('applications')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('id', { ascending: false });

  if (error) return console.error(error);

  const applicationsList = document.getElementById('applications-list');
  applicationsList.innerHTML = '';

  if (data.length === 0) {
      applicationsList.innerHTML = `
      <div class="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div class="text-4xl mb-4">📭</div>
          <h4 class="text-xl font-bold text-slate-800 mb-2">No applications yet</h4>
          <p class="text-slate-500">Your pipeline is empty. Add a job on the left to get started!</p>
      </div>`;
      return;
  }

  data.forEach((app) => {
    const item = document.createElement('div');
    item.className = 'bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group';

    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'; 
    if (app.status.toLowerCase().includes('offer')) badgeColor = 'bg-green-100 text-green-700 border-green-200';
    if (app.status.toLowerCase().includes('interview')) badgeColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (app.status.toLowerCase().includes('reject')) badgeColor = 'bg-red-100 text-red-700 border-red-200';

    item.innerHTML = `
      <div>
        <h4 class="text-xl font-bold text-slate-900 leading-tight mb-1">${app.company_name}</h4>
        <p class="text-sm text-slate-500 font-semibold mb-3">${app.role_title}</p>
        <span class="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${badgeColor}">
            ${app.status}
        </span>
      </div>
      <div class="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
        <button onclick="updateStatus(${app.id}, '${app.status}')" class="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            Update
        </button>
        <button onclick="deleteApplication(${app.id})" class="flex-1 bg-white border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm">
            Delete
        </button>
      </div>
    `;
    applicationsList.appendChild(item);
  });
}

async function updateStatus(id, currentStatus) {
    const newStatus = prompt("Enter new status (e.g., Interviewing, Offer, Rejected):", currentStatus);
    if (!newStatus || newStatus === currentStatus) return;

    const { error } = await db.from('applications').update({ status: newStatus }).eq('id', id); 
    if (error) alert("Error updating: " + error.message);
    else fetchApplications(); 
}

async function deleteApplication(id) {
    if (!confirm("Are you sure you want to delete this application?")) return;
    const { error } = await db.from('applications').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else fetchApplications(); 
}