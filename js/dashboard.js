// Enhanced API URL detection with better production support
const API_URL = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // More robust local development detection
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname === '0.0.0.0' ||
                   hostname.startsWith('192.168.') ||
                   hostname.endsWith('.local') ||
                   protocol === 'file:';
    
    const apiUrl = isLocal 
        ? "http://localhost:5000/api/auth"  
        : "https://calmspace-api.onrender.com/api/auth";
    
    console.log('🌍 Environment Detection:');
    console.log('  - Hostname:', hostname);
    console.log('  - Protocol:', protocol);
    console.log('  - Is Local:', isLocal);
    console.log('  - API URL:', apiUrl);
    
    return apiUrl;
})();

// Enhanced token management
const TokenManager = {
    get: () => {
        // First check URL parameters (for OAuth redirects)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
            console.log('📥 Token found in URL, saving to localStorage');
            localStorage.setItem('token', urlToken);
            // Clean URL immediately
            TokenManager.clearTokenFromURL();
            return urlToken;
        }
        
        // Then check localStorage
        const storageToken = localStorage.getItem('token');
        console.log('💾 Token from localStorage:', storageToken ? 'Found' : 'Not found');
        return storageToken;
    },
    
    set: (token) => {
        if (token) {
            localStorage.setItem('token', token);
            console.log('✅ Token saved to localStorage');
        }
    },
    
    remove: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Clean up user data too
        console.log('🗑️ Token removed from localStorage');
    },
    
    clearTokenFromURL: () => {
        if (window.location.search.includes('token=')) {
            const url = new URL(window.location);
            url.searchParams.delete('token');
            window.history.replaceState({}, document.title, url.pathname);
            console.log('🧹 Token cleared from URL');
        }
    }
};

// Enhanced API request with better error handling
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    const token = TokenManager.get();
    
    if (!token) {
        throw new Error('NO_TOKEN');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include' // Important for production CORS
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    console.log(`🌐 Making request to: ${API_URL}${endpoint}`);
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        // Handle different response types
        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get('content-type');
            
            try {
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                } else {
                    errorData = { message: await response.text() };
                }
            } catch (e) {
                errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
            }
            
            // Specific error handling
            if (response.status === 401) {
                console.log('🚫 Unauthorized - token invalid');
                TokenManager.remove();
                throw new Error('UNAUTHORIZED');
            } else if (response.status === 403) {
                console.log('🚫 Forbidden - access denied');
                throw new Error('FORBIDDEN');
            } else if (response.status === 404) {
                console.log('❌ Not found - user/endpoint not found');
                throw new Error('NOT_FOUND');
            } else if (response.status >= 500) {
                console.log('🔥 Server error');
                throw new Error('SERVER_ERROR');
            }
            
            throw new Error(errorData.message || errorData.msg || `Request failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('💥 Request failed:', error);
        
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.log('🌐 Network error - possibly CORS or server down');
            throw new Error('NETWORK_ERROR');
        }
        
        throw error;
    }
};

// Enhanced authentication check
const authenticateUser = async () => {
    console.log('🔐 Starting enhanced authentication check...');
    
    try {
        const token = TokenManager.get();
        
        if (!token) {
            console.log('❌ No token found anywhere');
            throw new Error('NO_TOKEN');
        }
        
        console.log('✅ Token found, verifying with server...');
        
        const userData = await makeAuthenticatedRequest('/me');
        
        console.log('✅ Authentication successful:', {
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname
        });
        
        // Update UI with user data
        const nicknameElement = document.getElementById('userNickname');
        if (nicknameElement && userData.nickname) {
            nicknameElement.textContent = userData.nickname;
        }
        
        // Store user data for offline access
        localStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
        
    } catch (error) {
        console.error('💥 Authentication failed:', error.message);
        
        // Handle different error types
        switch (error.message) {
            case 'NO_TOKEN':
                alert('No authentication token found. Please sign in.');
                window.location.href = 'signin.html';
                break;
                
            case 'UNAUTHORIZED':
                alert('Your session has expired. Please sign in again.');
                window.location.href = 'signin.html';
                break;
                
            case 'NOT_FOUND':
                alert('User account not found. Please sign in again.');
                TokenManager.remove();
                window.location.href = 'signin.html';
                break;
                
            case 'NETWORK_ERROR':
                console.log('🌐 Network issue detected');
                // Try to use cached user data if available
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) {
                    console.log('📦 Using cached user data');
                    const userData = JSON.parse(cachedUser);
                    const nicknameElement = document.getElementById('userNickname');
                    if (nicknameElement && userData.nickname) {
                        nicknameElement.textContent = userData.nickname;
                    }
                    // Show warning about network issues
                    showNetworkWarning();
                    return userData;
                }
                alert('Cannot connect to server. Please check your internet connection and try again.');
                break;
                
            case 'SERVER_ERROR':
                alert('Server is currently unavailable. Please try again later.');
                break;
                
            default:
                alert(`Authentication error: ${error.message}`);
                TokenManager.remove();
                window.location.href = 'signin.html';
        }
        
        throw error;
    }
};

// Show network warning
const showNetworkWarning = () => {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff6b6b;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    warning.textContent = 'Network issues detected. Some features may not work properly.';
    document.body.appendChild(warning);
    
    setTimeout(() => {
        if (document.body.contains(warning)) {
            document.body.removeChild(warning);
        }
    }, 5000);
};

// Initialize charts with error handling
const initializeCharts = () => {
    try {
        const activityChart = document.getElementById("activityChart");
        const moodChart = document.getElementById("moodChart");

        if (activityChart) {
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
        
        console.log('📊 Charts initialized successfully');
    } catch (error) {
        console.error('📊 Chart initialization error:', error);
    }
};

// Enhanced logout handler
const handleLogout = async () => {
    console.log('👋 Logout initiated...');
    
    const token = TokenManager.get();
    
    // Clear local storage first
    TokenManager.remove();
    
    // Try to call backend logout (optional, don't block on failure)
    try {
        if (token) {
            await makeAuthenticatedRequest('/logout', { method: 'POST' });
            console.log('✅ Backend logout successful');
        }
    } catch (error) {
        console.log('⚠️ Backend logout failed (non-critical):', error.message);
    }
    
    // Always redirect to signin
    console.log('🚀 Redirecting to signin...');
    window.location.href = 'signin.html';
};

// Enhanced menu toggle
const initializeMenuToggle = () => {
    const menuToggle = document.getElementById("menuToggle");
    const menuList = document.getElementById("menuList");

    if (menuToggle && menuList) {
        menuToggle.addEventListener("click", () => {
            menuList.classList.toggle("show");
        });
        console.log('📱 Menu toggle initialized');
    }
};

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
    console.log('🚀 Dashboard initialization started');
    console.log('🌍 Current URL:', window.location.href);
    console.log('🔧 User Agent:', navigator.userAgent);
    
    try {
        // Initialize UI components first
        initializeMenuToggle();
        
        // Initialize charts
        if (typeof Chart !== 'undefined') {
            initializeCharts();
        } else {
            console.log('⚠️ Chart.js not loaded, charts will not be available');
        }
        
        // Authenticate user (this is the critical part)
        await authenticateUser();
        
        // Setup logout handler
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                handleLogout();
            });
            console.log('👋 Logout handler attached');
        }
        
        console.log('✅ Dashboard initialization completed successfully');
        
    } catch (error) {
        console.error('💥 Dashboard initialization failed:', error);
        // Error handling is already done in authenticateUser
    }
});

// Handle page visibility changes (helps with token refresh)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Page became visible, checking authentication...');
        // Re-authenticate when page becomes visible (helps catch expired tokens)
        setTimeout(authenticateUser, 100);
    }
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    // If it's an auth-related error, handle gracefully
    if (event.reason && event.reason.message) {
        const message = event.reason.message.toLowerCase();
        if (message.includes('unauthorized') || message.includes('token') || message.includes('auth')) {
            console.log('🔐 Auth-related unhandled rejection, cleaning up...');
            TokenManager.remove();
            window.location.href = 'signin.html';
        }
    }
    
    event.preventDefault(); // Prevent the error from going to console
});