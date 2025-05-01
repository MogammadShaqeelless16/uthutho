const profileHTML = `
    <div class="profile-container">
      <h2>My Profile</h2>
      <form id="profile-form">
        <div class="input-group">
          <label>First Name</label>
          <input type="text" id="profile-first-name" value="">
        </div>
        <div class="input-group">
          <label>Last Name</label>
          <input type="text" id="profile-last-name" value="">
        </div>
        <div class="input-group">
          <label>Home Location</label>
          <div class="input-wrapper">
            <input type="text" id="profile-home" value="">
            <div id="home-suggestions" class="suggestions"></div>
          </div>
        </div>
        <button type="submit" class="btn primary">Save Changes</button>
      </form>
    </div>
  `;
  
async function showProfilePage(currentUser, updateProfile, setupAddressAutocomplete) {
    if (!currentUser) return;
    // Create modal element
    const modal = document.createElement("div");
    modal.id = "profile-modal";
    modal.className = "modal";
    modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-content").insertAdjacentHTML("beforeend", profileHTML);
  
    // Add event listener to close button
    const closeBtn = modal.querySelector(".close");
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
  
    // Display modal
    modal.style.display = "block";
  
    document.getElementById("profile-first-name").value = currentUser.profile?.first_name || '';
    document.getElementById("profile-last-name").value = currentUser.profile?.last_name || '';
    document.getElementById("profile-home").value = currentUser.profile?.home || '';
  
    setupAddressAutocomplete("profile-home", "home-suggestions");
  
    document.getElementById("profile-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const newProfileData = {
        id: currentUser.id,
        first_name: document.getElementById("profile-first-name").value,
        last_name: document.getElementById("profile-last-name").value,
        home: document.getElementById("profile-home").value,
      };
      const updatedProfile = await updateProfile(newProfileData);
  
      if (updatedProfile) {
          currentUser.profile = { ...currentUser.profile, ...newProfileData };
          // Reload to refresh the UI
          location.reload();
      }
      modal.remove();
    });
  }

export { showProfilePage };