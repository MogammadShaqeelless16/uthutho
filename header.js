function setupHeaderUserInfo(currentUser) {
  if (!currentUser?.profile) return;

  // Remove existing user info if present
  const existingInfo = document.querySelector('.user-info');
  if (existingInfo) existingInfo.remove();
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.textContent = `${currentUser.profile.first_name} ${currentUser.profile.last_name}`;
  headerActions.prepend(userInfo);
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  });
}
export { setupHeaderUserInfo, setupThemeToggle };