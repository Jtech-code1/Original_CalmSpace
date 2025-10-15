// API URL Configuration
const API_URL = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname === '0.0.0.0' ||
                   hostname.startsWith('192.168.') ||
                   hostname.endsWith('.local') ||
                   protocol === 'file:';
    
    return isLocal 
        ? "http://localhost:5000/api/auth"  
        : "https://calmspace-api.onrender.com/api/auth";
})();

// Real-time password validation
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
        errors.push("at least 6 characters");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("one uppercase letter");
    }
    if (!/\d/.test(password)) {
        errors.push("one number");
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push("one special character (@$!%*?&)");
    }
    
    return errors;
}

// Real-time validation on password input
document.getElementById("password").addEventListener("input", (e) => {
    const password = e.target.value;
    const errorElement = document.getElementById("passwordError");
    
    if (!password) {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        return;
    }
    
    const errors = validatePassword(password);
    
    if (errors.length > 0) {
        errorElement.textContent = `Password must include: ${errors.join(", ")}`;
        errorElement.style.display = "block";
    } else {
        errorElement.textContent = "✓ Password meets all requirements";
        errorElement.style.display = "block";
        errorElement.style.color = "#10b981";
    }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Clear previous errors
    document.getElementById("fullNameError").style.display = "none";
    document.getElementById("emailError").style.display = "none";
    document.getElementById("passwordError").style.display = "none";

    // Client-side validation
    let hasError = false;

    if (!fullName || fullName.length < 2) {
        document.getElementById("fullNameError").textContent = "Full name must be at least 2 characters";
        document.getElementById("fullNameError").style.display = "block";
        hasError = true;
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        document.getElementById("emailError").textContent = "Please enter a valid email address";
        document.getElementById("emailError").style.display = "block";
        hasError = true;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        document.getElementById("passwordError").textContent = `Password must include: ${passwordErrors.join(", ")}`;
        document.getElementById("passwordError").style.display = "block";
        document.getElementById("passwordError").style.color = "#ef4444";
        hasError = true;
    }

    if (hasError) return;

    // Disable button during submission
    const submitButton = e.target.querySelector('input[type="submit"]');
    const originalValue = submitButton.value;
    submitButton.disabled = true;
    submitButton.value = 'Creating Account...';

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullname: fullName, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            // Save email in localStorage for OTP verification
            localStorage.setItem("pendingEmail", email);
            alert("Registration successful! Check your email for the OTP.");
            window.location.href = "verify-otp.html";
        } else {
            // Handle backend validation errors
            if (data.errors && Array.isArray(data.errors)) {
                // Express-validator format
                data.errors.forEach(error => {
                    if (error.path === "fullname") {
                        document.getElementById("fullNameError").textContent = error.msg;
                        document.getElementById("fullNameError").style.display = "block";
                    } else if (error.path === "email") {
                        document.getElementById("emailError").textContent = error.msg;
                        document.getElementById("emailError").style.display = "block";
                    } else if (error.path === "password") {
                        document.getElementById("passwordError").textContent = error.msg;
                        document.getElementById("passwordError").style.display = "block";
                        document.getElementById("passwordError").style.color = "#ef4444";
                    }
                });
            } else if (data.msg || data.error) {
                // Simple error message
                alert(data.msg || data.error || "Something went wrong");
            } else {
                alert("Something went wrong. Please try again.");
            }
        }
    } catch (err) {
        console.error(err);
        alert("Network error. Please check your connection and try again.");
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.value = originalValue;
    }
});