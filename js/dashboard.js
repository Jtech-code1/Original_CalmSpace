const API_URL = "https://calmspace-api.onrender.com/api/auth";

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
    // Activity Chart (Bubble Style)
    new Chart(document.getElementById("activityChart"), {
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

    // Mood Tracker
    new Chart(document.getElementById("moodChart"), {
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
});

// Enhanced authentication check - FIXED VERSION
document.addEventListener("DOMContentLoaded", async () => {
    console.log('🔍 Starting authentication check...');
    
    // First check if there's a token in the URL (Google OAuth redirect)
    let token = getTokenFromURL();
    console.log('🔗 Token from URL:', token ? 'Found' : 'Not found');
    
    if (token) {
        console.log('Saving token to localStorage...');
        // Save token to localStorage for future use
        localStorage.setItem('token', token);
        // Clean up URL
        clearTokenFromURL();
        console.log('🧹 URL cleaned, token saved');
    } else {
        // Check localStorage for existing token
        token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'Found' : 'Not found');
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
        const res = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Server response status:', res.status);
        
        if (!res.ok) {
            console.log('❌ Server response not OK:', res.statusText);
            // Log the response for debugging
            const errorText = await res.text();
            console.log('📄 Error response:', errorText);
            
            // If token is invalid, clear it and redirect
            localStorage.removeItem('token');
            throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('✅ User data received:', data);
        
        const nickname = data.nickname || data.fullname || 'User';
        const nicknameElement = document.getElementById('userNickname');
        
        if (nicknameElement) {
            nicknameElement.textContent = nickname;
            console.log('Nickname set to:', nickname);
        } else {
            console.log('userNickname element not found');
        }

        console.log('User authenticated successfully');
        
    } catch (error) {
        console.error('Error during authentication:', error);
        
        // Clear invalid token
        localStorage.removeItem('token');
        
        // Show specific error message
        let errorMessage = 'Authentication failed. Please sign in again.';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Your session has expired. Please sign in again.';
        }
        
        alert(errorMessage);
        window.location.href = 'signin.html';
    }
});

// Handle logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
    console.log('Logout initiated...');
    
    // Clear token from localStorage
    localStorage.removeItem("token");

    // Call the backend route for logout (optional)
    try {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        console.log('Backend logout successful');
    } catch (err) {
        console.error("Backend logout error (non-critical):", err);
    }

    // Redirect to signin page
    console.log('Redirecting to signin...');
    window.location.href = "signin.html";
});