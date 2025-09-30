// Dynamic API URL based on environment
const API_URL = (() => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    
    // More robust environment detection
    const isLocal = hostname === 'localhost' || 
                hostname === '127.0.0.1' || 
                hostname === '0.0.0.0' ||
                hostname.includes('localhost') ||
                window.location.port === '5500'; // Live Server port
    
    const apiUrl = isLocal 
        ? "http://localhost:5000/api/auth"  // Local backend
        : "https://calmspace-api.onrender.com/api/auth";  // Production backend
    
    console.log('Environment Detection:');
    console.log('  - Hostname:', hostname);
    console.log('  - Port:', window.location.port);
    console.log('  - Protocol:', window.location.protocol);
    console.log('  - Is Local:', isLocal);
    console.log('  - Using API URL:', apiUrl);
    
    return apiUrl;
})();

// Function to get token from URL parameters
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('Token from URL:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    return token;
}

// Function to clear token from URL without refreshing page
function clearTokenFromURL() {
    if (window.location.search.includes('token=')) {
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname);
        console.log('Token cleared from URL');
    }
}

// Improved authentication check
document.addEventListener("DOMContentLoaded", async () => {
    console.log('=== AUTHENTICATION CHECK STARTED ===');
    console.log('Current URL:', window.location.href);
    console.log('API URL:', API_URL);
    
    // Step 1: Check for token in URL (from OAuth redirect)
    let token = getTokenFromURL();
    
    if (token) {
        console.log('📥 Token found in URL, saving to localStorage...');
        localStorage.setItem('token', token);
        clearTokenFromURL();
    } else {
        // Step 2: Check localStorage for existing token
        token = localStorage.getItem('token');
        console.log('📱 Token from localStorage:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    }

    // Step 3: If no token found anywhere, redirect to signin
    if (!token) {
        console.log('❌ No token found anywhere, redirecting to signin');
        window.location.href = 'signin.html';
        return;
    }

    console.log('✅ Token found, verifying with server...');
    
    try {
        console.log('🔄 Making request to:', `${API_URL}/me`);
        
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // Add timeout for production
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        console.log('📡 Server response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            console.log('❌ Server response not OK');
            
            // Handle different error status codes
            if (response.status === 401) {
                console.log('🔒 Unauthorized - token invalid or expired');
                localStorage.removeItem('token');
                alert('Your session has expired. Please sign in again.');
                window.location.href = 'signin.html';
                return;
            } 
            
            if (response.status === 404) {
                console.log('👤 User not found');
                localStorage.removeItem('token');
                alert('User account not found. Please sign in again.');
                window.location.href = 'signin.html';
                return;
            }
            
            if (response.status >= 500) {
                console.log('🚨 Server error:', response.status);
                alert('Server error. Please try again later or contact support.');
                return;
            }
            
            // For other errors, try to get error message
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.log('Could not parse error response');
            }
            
            console.log('💥 Authentication failed:', errorMessage);
            localStorage.removeItem('token');
            alert('Authentication failed. Please sign in again.');
            window.location.href = 'signin.html';
            return;
        }

        // Parse successful response
        const userData = await response.json();
        console.log('👤 User data received:', {
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname,
            fullname: userData.fullname,
            isVerified: userData.isVerified
        });
        
        // Check if user profile is complete
        if (!userData.nickname && !userData.fullname) {
            console.log('📝 User profile incomplete, redirecting to onboarding');
            alert('Please complete your profile setup.');
            window.location.href = 'onboarding1.html';
            return;
        }
        
        // Update UI with user info
        const nickname = userData.nickname || userData.fullname || 'User';
        const nicknameElement = document.getElementById('userNickname');
        
        if (nicknameElement) {
            nicknameElement.textContent = nickname;
            console.log('✅ UI updated - nickname set to:', nickname);
        } else {
            console.log('⚠️ userNickname element not found in DOM');
        }

        console.log('🎉 Authentication successful!');
        
    } catch (error) {
        console.error('💥 Authentication error:', error);
        
        // Handle different types of errors
        if (error.name === 'AbortError') {
            console.log('⏱️ Request timeout');
            alert('Connection timeout. Please check your internet connection and try again.');
            return;
        }
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            console.log('🌐 Network error detected');
            alert('Cannot connect to server. Please check your internet connection.');
            return;
        }
        
        // For other errors, clear token and redirect
        console.log('🔄 Clearing token and redirecting to signin');
        localStorage.removeItem('token');
        alert('Authentication failed. Please sign in again.');
        window.location.href = 'signin.html';
    }
});

// Enhanced logout handler
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log('🔓 Logout initiated...');
            
            const token = localStorage.getItem('token');
            
            // Clear token from localStorage immediately
            localStorage.removeItem("token");
            
            // Try to call backend logout (non-blocking)
            try {
                const response = await fetch(`${API_URL}/logout`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` })
                    },
                    signal: AbortSignal.timeout(5000) // 5 second timeout for logout
                });
                
                if (response.ok) {
                    console.log('✅ Backend logout successful');
                } else {
                    console.log('⚠️ Backend logout failed, but continuing...');
                }
            } catch (err) {
                console.log("⚠️ Backend logout error (non-critical):", err.message);
            }
            
            // Always redirect regardless of backend logout status
            console.log('🔄 Redirecting to signin...');
            window.location.href = "signin.html";
        });
    } else {
        console.log('⚠️ Logout button not found in DOM');
    }
});

// Initialize charts
document.addEventListener("DOMContentLoaded", () => {
    // Only initialize charts if elements exist (avoid errors)
    const activityChart = document.getElementById("activityChart");
    const moodChart = document.getElementById("moodChart");

    if (activityChart) {
        // Activity Chart (Bubble Style)
        new Chart(activityChart, {
            type: "bubble",
            data: {
                datasets: [{
                    label: "Weekly Activities",
                    data: [
                        {x: 1, y: 20, r: 10},
                        {x: 2, y: 30, r: 12},
                        {x: 3, y: 25, r: 14},
                        {x: 4, y: 60, r: 18},
                        {x: 5, y: 45, r: 15},
                        {x: 6, y: 40, r: 16}
                    ],
                    backgroundColor: "#8bcba7"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            callback: value => ["","Yoga","Journaling","Breathing","Music","Sound Therapy","Mood Tracking"][value]
                        },
                        grid: { drawOnChartArea: false }
                    },
                    y: {
                        beginAtZero: true,
                        max: 70,
                        title: { display: true, text: "Minutes" }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    if (moodChart) {
        // Mood Tracker
        new Chart(moodChart, {
            type: "line",
            data: {
                labels: ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"],
                datasets: [{
                    label: "Mood Level",
                    data: [3,4,3,5,4,6,5,6,5,7,6,8],
                    borderColor: "#8bcba7",
                    backgroundColor: "rgba(139,203,167,0.2)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: "#8bcba7"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => ["😡","😕","🙂","😀","😄"][value-1]
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
});