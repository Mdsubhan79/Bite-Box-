
const API_BASE = "https://bbbackend-bng2.onrender.com";

function isLoggedIn() {
    const token = localStorage.getItem("biteboxToken");
    const user = localStorage.getItem("biteboxUser");
    return !!(token && user && token !== "undefined" && user !== "undefined");
}


function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("biteboxUser"));
    } catch {
        return null;
    }
}


function requireAuth(action, redirectUrl = "login.html") {
    if (!isLoggedIn()) {
        
        sessionStorage.setItem("intendedAction", action);
        sessionStorage.setItem("intendedUrl", window.location.href);
        
        
        if (confirm("Please login or signup to continue. Would you like to login now?")) {
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 100);
        }
        return false;
    }
    return true;
}


function handleMenuClick() {
    if (requireAuth("menu")) {
        window.location.href = "services.html";
    }
}


function handleProfileClick() {
    if (requireAuth("profile")) {
      
        document.getElementById("profilePanel")?.classList.add("active");
        document.getElementById("profileOverlay")?.classList.add("active");
    }
}


function initAuthUI() {
    const token = localStorage.getItem("biteboxToken");
    const user = getCurrentUser();
    
    const profileIcon = document.getElementById("profileIcon");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    
    if (isLoggedIn() && user) {
        
        console.log("✅ Logged in as:", user.email);
        
        if (profileName) profileName.textContent = user.name || "User";
        if (profileEmail) profileEmail.textContent = user.email;
        
        if (profileIcon) {
            profileIcon.style.opacity = "1";
            profileIcon.title = user.name || "Profile";
        }
        
       
        if (typeof loadSubscriptions === 'function') loadSubscriptions();
        if (typeof checkTiffinSubscription === 'function') checkTiffinSubscription();
    } else {
      
        console.log("👤 Guest user");
        
        if (profileIcon) {
            profileIcon.style.opacity = "0.5";
            profileIcon.title = "Click to login";
        }
    }
}


function checkLoginRedirect() {
    const intendedAction = sessionStorage.getItem("intendedAction");
    const intendedUrl = sessionStorage.getItem("intendedUrl");
    
    if (intendedAction && isLoggedIn()) {
        sessionStorage.removeItem("intendedAction");
        sessionStorage.removeItem("intendedUrl");
        
        if (intendedAction === "menu") {
            window.location.href = "services.html";
        } else if (intendedAction === "profile") {
           
            document.getElementById("profilePanel")?.classList.add("active");
            document.getElementById("profileOverlay")?.classList.add("active");
        }
    }
}

//functions global
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.handleMenuClick = handleMenuClick;
window.handleProfileClick = handleProfileClick;
window.initAuthUI = initAuthUI;
window.checkLoginRedirect = checkLoginRedirect;