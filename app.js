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

// 7. Fetch Applications (NOW WITH BUTTONS!)
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

    // Added Flexbox classes here to make it look nice
    item.className = 'border p-3 rounded mb-2 flex justify-between items-center bg-gray-50';

    item.innerHTML = `
      <div>
        <p><strong>Company:</strong> ${app.company_name}</p>
        <p><strong>Role:</strong> ${app.role_title}</p>
        <p><strong>Status:</strong> ${app.status}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="updateStatus(${app.id}, '${app.status}')" class="bg-yellow-400 text-black px-3 py-1 rounded text-sm hover:bg-yellow-500 font-semibold shadow">Edit Status</button>
        <button onclick="deleteApplication(${app.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 font-semibold shadow">Delete</button>
      </div>
    `;

    applicationsList.appendChild(item);
  });
}

// ==========================================
// PR 3: UPDATE AND DELETE OPERATIONS
// ==========================================

// 8. Update Application (UPDATE)
async function updateStatus(id, currentStatus) {
    const newStatus = prompt("Enter new status (e.g., Interviewing, Offer, Rejected):", currentStatus);
    
    if (!newStatus || newStatus === currentStatus) return;

    const { data, error } = await db.from('applications')
        .update({ status: newStatus })
        .eq('id', id); 

    if (error) {
        alert("Error updating: " + error.message);
    } else {
        fetchApplications(); 
    }
}

// 9. Delete Application (DELETE)
async function deleteApplication(id) {
    if (!confirm("Are you sure you want to delete this application?")) return;

    const { data, error } = await db.from('applications')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Error deleting: " + error.message);
    } else {
        fetchApplications(); 
    }
}