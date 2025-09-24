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

// Enhanced authentication check
document.addEventListener("DOMContentLoaded", async () => {
    // First check if there's a token in the URL (Google OAuth redirect)
    let token = getTokenFromURL();
    
    if (token) {
        // Save token to localStorage for future use
        localStorage.setItem('token', token);
        // Clean up URL
        clearTokenFromURL();
    } else {
        // Check localStorage for existing token
        token = localStorage.getItem('token');
    }

    // If no token found anywhere, redirect to signin
    if (!token) {
        console.log('No token found, redirecting to signin');
        window.location.href = 'signin.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            // If token is invalid, clear it and redirect
            localStorage.removeItem('token');
            throw new Error('Failed to fetch user data');
        }

        const data = await res.json();
        const nickname = data.nickname || 'User';
        document.getElementById('userNickname').textContent = nickname;

        console.log('User authenticated successfully:', data);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        alert('Session expired. Please sign in again.');
        window.location.href = 'signin.html';
    }
});

// Handle logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    // Clear token from localStorage
    localStorage.removeItem("token");

    // Call the backend route for logout (if needed)
    fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }).catch(err => console.error("Logout error:", err));

    // Redirect to signin page
    window.location.href = "signin.html";
});