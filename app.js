// ==========================================
// 1. SUPABASE INIT & GLOBALS
// ==========================================
const supabaseUrl = 'https://xlimntsvahequrntnjlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaW1udHN2YWhlcXVybnRuamxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjMxNTksImV4cCI6MjA5NTE5OTE1OX0.8UUL2er5Zo0egwji2tRChnduXn8wMlLXEiQE2K2uTlo';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const landingSection = document.getElementById('landing-section');
const landingGuest = document.getElementById('landing-guest');
const landingUser = document.getElementById('landing-user');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const landingAuthContainer = document.getElementById('landing-auth-buttons');
let currentUser = null; 

// ==========================================
// 2. UX: TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-slate-900 border-green-500' : 'bg-red-600 border-red-800';
    
    toast.className = `${colorClass} text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 font-semibold transform transition-all duration-300 translate-x-full opacity-0 flex items-center gap-3 min-w-[250px]`;
    toast.innerHTML = `<span class="text-xl">${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-x-full', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// 3. PROFILE MANAGEMENT (Using Auth Metadata!)
// ==========================================
function updateProfileUI() {
    // Read the metadata attached to the user's login token
    const meta = currentUser?.user_metadata || {};
    
    // Update the Dashboard Profile Card
    document.getElementById('display-emoji').innerText = meta.avatarEmoji || '👨‍🎓';
    document.getElementById('display-fullname').innerText = meta.fullName || 'Student Applicant';
    document.getElementById('display-major').innerText = meta.major || 'Set up your profile...';
}

function openProfileModal() {
    const meta = currentUser?.user_metadata || {};
    // Pre-fill the modal inputs with current data
    document.getElementById('edit-emoji').value = meta.avatarEmoji || '👨‍🎓';
    document.getElementById('edit-fullname').value = meta.fullName || '';
    document.getElementById('edit-major').value = meta.major || '';
    
    document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

async function saveProfile() {
    const avatarEmoji = document.getElementById('edit-emoji').value;
    const fullName = document.getElementById('edit-fullname').value;
    const major = document.getElementById('edit-major').value;

    // Save to Supabase Auth Metadata (Requires no SQL changes!)
    const { data, error } = await db.auth.updateUser({
        data: { fullName, major, avatarEmoji }
    });

    if (error) return showToast(error.message, 'error');

    currentUser = data.user; // Update local user state
    updateProfileUI(); // Refresh the card on screen
    closeProfileModal(); // Hide popup
    showToast('Profile updated!', 'success');
}

// ==========================================
// 4. SMART ROUTER
// ==========================================
function updateLandingState() {
    if (currentUser) {
        landingAuthContainer.innerHTML = `<button onclick="showDashboardPage()" class="text-blue-600 bg-blue-50 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">Go to Dashboard →</button>`;
        landingGuest.classList.add('hidden');
        landingUser.classList.remove('hidden');
    } else {
        landingAuthContainer.innerHTML = `
            <button onclick="showAuthPage()" class="hidden sm:block text-blue-600 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">Sign In</button>
            <button onclick="showAuthPage()" class="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md">Get Started</button>
        `;
        landingGuest.classList.remove('hidden');
        landingUser.classList.add('hidden');
    }
}

function showLandingPage() {
    landingSection.classList.remove('hidden');
    authSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    updateLandingState();
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
    updateProfileUI(); // Load profile when dashboard opens
    fetchApplications();
}

// ==========================================
// 5. AUTHENTICATION
// ==========================================
db.auth.onAuthStateChange((event, session) => {
  currentUser = session ? session.user : null;
  updateLandingState();

  if (!session) {
      if (!dashboardSection.classList.contains('hidden') || !authSection.classList.contains('hidden')) showLandingPage();
  } else if (event === 'INITIAL_SESSION') {
      showDashboardPage();
  } else if (event === 'SIGNED_IN') {
      if (!authSection.classList.contains('hidden')) {
          showToast('Successfully logged in!', 'success');
          showDashboardPage();
      }
  }
});

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if(!email || !password) return showToast('Please enter email and password', 'error');

  const { error } = await db.auth.signUp({ email, password });
  if (error) showToast(error.message, 'error');
  else showToast('Account created! Logging in...', 'success');
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if(!email || !password) return showToast('Please enter credentials', 'error');

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) showToast(error.message, 'error');
}

async function logout() {
  await db.auth.signOut();
  showToast('Logged out successfully', 'success');
}

// ==========================================
// 6. CRUD, ANALYTICS, & KANBAN ENGINE
// ==========================================
async function addApplication() {
  const companyName = document.getElementById('company_name').value;
  const roleTitle = document.getElementById('role_title').value;

  if (!companyName || !roleTitle) return showToast('Please fill out Company and Role', 'error');

  const { error } = await db.from('applications').insert([
      { user_id: currentUser.id, company_name: companyName, role_title: roleTitle, status: 'Applied' }
  ]);

  if (error) return showToast('Failed to save application', 'error');

  document.getElementById('company_name').value = '';
  document.getElementById('role_title').value = '';
  showToast('Job added to pipeline!', 'success');
  fetchApplications();
}

async function fetchApplications() {
  if (!currentUser) return;

  const { data, error } = await db.from('applications')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('id', { ascending: false });

  if (error) return showToast('Error loading data', 'error');

  const colApplied = document.getElementById('kanban-applied');
  const colInterviewing = document.getElementById('kanban-interviewing');
  const colOutcomes = document.getElementById('kanban-outcomes');
  colApplied.innerHTML = ''; colInterviewing.innerHTML = ''; colOutcomes.innerHTML = '';

  let total = data.length;
  let interviews = 0;
  let offers = 0;

  data.forEach((app) => {
    const statusLower = app.status.toLowerCase();
    
    if (statusLower.includes('interview')) interviews++;
    if (statusLower.includes('offer')) offers++;

    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative';
    
    const opts = ['Applied', 'Interviewing', 'Offer', 'Rejected'].map(s => 
        `<option value="${s}" ${statusLower === s.toLowerCase() ? 'selected' : ''}>${s}</option>`
    ).join('');

    card.innerHTML = `
      <div class="mb-3">
        <h4 class="text-base font-bold text-slate-900 leading-tight">${app.company_name}</h4>
        <p class="text-xs text-slate-500 font-semibold">${app.role_title}</p>
      </div>
      <div class="flex justify-between items-center border-t border-slate-100 pt-3">
        <select onchange="updateStatus(${app.id}, this.value)" class="text-xs font-bold bg-slate-100 border-none rounded-md px-2 py-1 text-slate-600 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none">
            ${opts}
        </select>
        <button onclick="deleteApplication(${app.id})" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-colors" title="Delete Job">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

    if (statusLower.includes('interview')) colInterviewing.appendChild(card);
    else if (statusLower.includes('offer') || statusLower.includes('reject')) colOutcomes.appendChild(card);
    else colApplied.appendChild(card);
  });

  const successRate = total > 0 ? Math.round((interviews / total) * 100) + '%' : '0%';
  
  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-interview').innerText = interviews;
  document.getElementById('stat-offer').innerText = offers;
  document.getElementById('display-rate').innerText = successRate; // Also update the Profile Card stat!

  document.getElementById('count-applied').innerText = colApplied.children.length;
  document.getElementById('count-interviewing').innerText = interviews;
  document.getElementById('count-outcomes').innerText = colOutcomes.children.length;
}

async function updateStatus(id, newStatus) {
    const { error } = await db.from('applications').update({ status: newStatus }).eq('id', id); 
    if (error) return showToast("Error updating status", "error");
    
    showToast('Moved to ' + newStatus + '!', 'success');
    fetchApplications();
}

async function deleteApplication(id) {
    const { error } = await db.from('applications').delete().eq('id', id);
    if (error) return showToast("Error deleting job", "error");
    
    showToast('Job removed from tracker', 'success');
    fetchApplications(); 
}