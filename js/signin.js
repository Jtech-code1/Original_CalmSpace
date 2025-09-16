const API_URL = "https://calmspace-api.onrender.com/api/auth" ;

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
        // ✅ Successful login
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful! Redirecting...");
        window.location.href = "dashboard.html"; // main app page
        } else {
        // ❌ Handle specific cases
        if (data.msg?.toLowerCase().includes("not found")) {
            alert("No account found for this email. Redirecting to signup...");
            window.location.href = "signup.html"; // redirect to signup
        } else if (data.needsVerification) {
            // If backend says OTP is needed
            alert("Please verify your email.");
            window.location.href = "verify-otp.html?email=" + email;
        } else {
            alert(data.msg || data.error || "Login failed");
        }
        }
    } catch (err) {
        console.error(err);
        alert("Network error, please try again");
    }
});
