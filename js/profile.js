// js/profile.js
document.addEventListener('DOMContentLoaded', () => {
  const avatarImg = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');

  const nameInput = document.getElementById('profileName');
  const emailInput = document.getElementById('profileEmail');
  const editBtn = document.getElementById('editProfileBtn');
  const saveBtn = document.getElementById('saveProfileBtn');
  const cancelBtn = document.getElementById('cancelProfileBtn');

  // Load saved profile data from localStorage
  const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: 'https://via.placeholder.com/120'
  };

  // Populate inputs
  nameInput.value = userProfile.name;
  emailInput.value = userProfile.email;
  avatarImg.src = userProfile.avatar;

  // --- Avatar Upload Functionality ---
  changeAvatarBtn.addEventListener('click', () => {
    avatarInput.click(); // Open file picker
  });

  avatarInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Ensure it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      avatarImg.src = e.target.result; // Show preview
      userProfile.avatar = e.target.result; // Save new avatar
      localStorage.setItem('userProfile', JSON.stringify(userProfile)); // Persist in storage
      alert('✅ Avatar updated successfully!');
    };
    reader.readAsDataURL(file);
  });

  // --- Edit Profile ---
  editBtn.addEventListener('click', () => {
    nameInput.readOnly = false;
    emailInput.readOnly = false;
    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    nameInput.focus();
  });

  // --- Save Profile ---
  saveBtn.addEventListener('click', () => {
    userProfile.name = nameInput.value;
    userProfile.email = emailInput.value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    alert('✅ Profile saved successfully!');
    nameInput.readOnly = true;
    emailInput.readOnly = true;
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
  });

  // --- Cancel Edit ---
  cancelBtn.addEventListener('click', () => {
    nameInput.value = userProfile.name;
    emailInput.value = userProfile.email;
    nameInput.readOnly = true;
    emailInput.readOnly = true;
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
  });
});
