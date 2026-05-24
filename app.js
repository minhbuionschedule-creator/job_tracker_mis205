// 1. Initialize Supabase
const supabaseUrl = 'https://xlimntsvahequrntnjlo.supabase.co';

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaW1udHN2YWhlcXVybnRuamxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjMxNTksImV4cCI6MjA5NTE5OTE1OX0.8UUL2er5Zo0egwji2tRChnduXn8wMlLXEiQE2K2uTlo';

const db = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// UI Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');

// 2. Auth State Listener
db.auth.onAuthStateChange((event, session) => {
  if (session) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    fetchApplications();
  } else {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }
});

// 3. Register Function
async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await db.auth.signUp({
    email,
    password
  });

  if (error) {
    authMessage.innerText = error.message;
  } else {
    authMessage.innerText = 'Success! You can now log in.';
    authMessage.classList.replace('text-red-500', 'text-green-500');
  }
}

// 4. Login Function
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authMessage.innerText = error.message;
  }
}

// 5. Logout Function
async function logout() {
  await db.auth.signOut();
}

// 6. Add Application
async function addApplication() {
  const companyName = document.getElementById('company_name').value;

  const roleTitle = document.getElementById('role_title').value;

  const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError || !user) {
    alert('User not logged in');
    return;
  }

  const { error } = await db
    .from('applications')
    .insert([
      {
        user_id: user.id,
        company_name: companyName,
        role_title: roleTitle
      }
    ]);

  if (error) {
    console.error(error);
    alert('Failed to save application');
    return;
  }

  document.getElementById('company_name').value = '';
  document.getElementById('role_title').value = '';

  fetchApplications();
}

// 7. Fetch Applications
async function fetchApplications() {
  const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError || !user) {
    return;
  }

  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('id', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const applicationsList = document.getElementById(
    'applications-list'
  );

  applicationsList.innerHTML = '';

  data.forEach((app) => {
    const item = document.createElement('div');

    item.className = 'border p-3 rounded';

    item.innerHTML = `
      <p><strong>Company:</strong> ${app.company_name}</p>
      <p><strong>Role:</strong> ${app.role_title}</p>
      <p><strong>Status:</strong> ${app.status}</p>
    `;

    applicationsList.appendChild(item);
  });
}