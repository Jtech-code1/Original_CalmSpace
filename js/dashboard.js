// Dynamic API URL based on environment
const API_URL = (() => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    
    const apiUrl = isLocal 
        ? "http://localhost:5000/api/auth"  // Local backend
        : "https://calmspace-api.onrender.com/api/auth";  // Production backend
    
    console.log('Detected hostname:', hostname);
    console.log('Using API URL:', apiUrl);
    return apiUrl;
})();

// Function to get token from URL parameters
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// Function to clear token from URL without refreshing page
function clearTokenFromURL() {
    if (window.location.search.includes('token=')) {
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname);
    }
}

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

// Enhanced authentication check - LOCAL DEVELOPMENT VERSION
document.addEventListener("DOMContentLoaded", async () => {
    console.log('Starting authentication check...');
    console.log('Current URL:', window.location.href);
    console.log('API URL:', API_URL);
    
    // First check if there's a token in the URL (Google OAuth redirect)
    let token = getTokenFromURL();
    console.log('Token from URL:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    
    if (token) {
        console.log('Saving token to localStorage...');
        // Save token to localStorage for future use
        localStorage.setItem('token', token);
        // Clean up URL
        clearTokenFromURL();
        console.log('URL cleaned, token saved');
    } else {
        // Check localStorage for existing token
        token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    }

    // If no token found anywhere, redirect to signin
    if (!token) {
        console.log('No token found, redirecting to signin');
        alert('No authentication token found. Please sign in again.');
        window.location.href = 'signin.html';
        return;
    }

    console.log('Token found, verifying with server...');
    
    try {
        console.log('Making request to:', `${API_URL}/me`);
        
        const res = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('Server response status:', res.status);
        console.log('Server response ok:', res.ok);
        
        if (!res.ok) {
            console.log('Server response not OK:', res.status, res.statusText);
            
            // Get response text for debugging
            let errorText;
            try {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    errorText = JSON.stringify(errorData, null, 2);
                } else {
                    errorText = await res.text();
                }
                console.log('Error response body:', errorText);
            } catch (e) {
                console.log('Could not read error response body:', e);
            }
            
            // Handle different error types
            if (res.status === 401) {
                console.log('Unauthorized - token invalid or expired');
                localStorage.removeItem('token');
                alert('Your session has expired. Please sign in again.');
                window.location.href = 'signin.html';
                return;
            } else if (res.status === 404) {
                console.log('User not found');
                localStorage.removeItem('token');
                alert('User account not found. Please sign in again.');
                window.location.href = 'signin.html';
                return;
            } else if (res.status >= 500) {
                console.log('Server error');
                alert('Server error. Please try again later.');
                return;
            } else {
                console.log('Other error');
                localStorage.removeItem('token');
                throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
            }
        }

        const data = await res.json();
        console.log('User data received:', {
            id: data.id,
            email: data.email,
            nickname: data.nickname,
            isVerified: data.isVerified
        });
        
        // Check if user profile is complete
        if (!data.nickname) {
            console.log('User profile incomplete, redirecting to onboarding');
            alert('Please complete your profile setup.');
            window.location.href = 'onboarding1.html';
            return;
        }
        
        const nickname = data.nickname || data.fullname || 'User';
        const nicknameElement = document.getElementById('userNickname');
        
        if (nicknameElement) {
            nicknameElement.textContent = nickname;
            console.log('Nickname set to:', nickname);
        } else {
            console.log('userNickname element not found in DOM');
        }

        console.log('User authenticated successfully');
        
    } catch (error) {
        console.error('Error during authentication:', error);
        
        // Handle network errors differently from auth errors
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            console.log('Network error detected');
            console.log('Check if backend server is running on:', API_URL.replace('/api/auth', ''));
            alert('Cannot connect to server. Please ensure the backend server is running.');
            return;
        }
        
        // For other errors, clear token and redirect
        localStorage.removeItem('token');
        
        let errorMessage = 'Authentication failed. Please sign in again.';
        if (error.message.includes('401')) {
            errorMessage = 'Your session has expired. Please sign in again.';
        }
        
        alert(errorMessage);
        window.location.href = 'signin.html';
    }
});

// Handle logout
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log('Logout initiated...');
            
            const token = localStorage.getItem('token');
            
            // Clear token from localStorage
            localStorage.removeItem("token");
            
            // Call the backend route for logout (optional)
            try {
                await fetch(`${API_URL}/logout`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` })
                    }
                });
                console.log('Backend logout successful');
            } catch (err) {
                console.error("Backend logout error (non-critical):", err);
            }
            
            // Redirect to signin page
            console.log('Redirecting to signin...');
            window.location.href = "signin.html";
        });
    } else {
        console.log('Logout button not found in DOM');
    }
});