// Shared nav auth + dropdown logic for profile and settings pages

const profileAvatar   = document.getElementById("profile-avatar");
const profileName     = document.getElementById("profile-name");
const profileTrigger  = document.getElementById("profile-trigger");
const profileDropdown = document.getElementById("profile-dropdown");

async function loadUser() {
  try {
    const res = await fetch("/auth/me");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const user = await res.json();
    if (user.picture) { profileAvatar.src = user.picture; profileAvatar.alt = user.name || ""; }
    if (user.name)    { profileName.textContent = user.name; }

    // Populate page-specific user fields
    const heroAvatar  = document.getElementById("hero-avatar");
    const heroName    = document.getElementById("hero-name");
    const heroEmail   = document.getElementById("hero-email");
    const accountEmail = document.getElementById("account-email");
    if (heroAvatar)   { heroAvatar.src = user.picture || ""; heroAvatar.alt = user.name || ""; }
    if (heroName)     { heroName.textContent = user.name || "—"; }
    if (heroEmail)    { heroEmail.textContent = user.email || "—"; }
    if (accountEmail) { accountEmail.textContent = user.email || "—"; }

    // Placeholder stats
    const s = document.getElementById("stat-sessions");
    const n = document.getElementById("stat-notes");
    const w = document.getElementById("stat-words");
    if (s) s.textContent = "—";
    if (n) n.textContent = "—";
    if (w) w.textContent = "—";
  } catch {
    window.location.href = "/login";
  }
}

loadUser();

// Dropdown toggle
profileTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = profileDropdown.classList.toggle("open");
  profileTrigger.setAttribute("aria-expanded", String(open));
  profileDropdown.setAttribute("aria-hidden", String(!open));
});

document.addEventListener("click", (e) => {
  if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("open");
    profileTrigger.setAttribute("aria-expanded", "false");
    profileDropdown.setAttribute("aria-hidden", "true");
  }
});
