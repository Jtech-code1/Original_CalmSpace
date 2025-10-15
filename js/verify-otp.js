
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

// Display email from localStorage
const email = localStorage.getItem("pendingEmail");
if (email) {
    document.getElementById("emailDisplay").innerHTML = `Email: <strong>${email}</strong>`;
} else {
    document.getElementById("emailDisplay").innerHTML = `Email: <strong>Not found</strong>`;
}

// OTP input handling
const otpInputs = document.querySelectorAll('.otp-digit');
const hiddenOtpInput = document.getElementById('otp');

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
    const value = e.target.value;
    
    if (value.match(/[0-9]/)) {
        if (index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
        }
    }
    
    updateHiddenInput();
    });

    input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
    }
    });

    input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('');
    
    digits.forEach((digit, i) => {
        if (otpInputs[i] && digit.match(/[0-9]/)) {
        otpInputs[i].value = digit;
        }
    });
    
    updateHiddenInput();
    if (digits.length === 6) {
        otpInputs[5].focus();
    }
    });
});

function updateHiddenInput() {
    const otpValue = Array.from(otpInputs).map(input => input.value).join('');
    hiddenOtpInput.value = otpValue;
}

// Form submission
document.getElementById("otpForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = document.getElementById("otp").value;

    if (!email) {
    alert("No pending email found. Please register again.");
    window.location.href = "register.html";
    return;
    }

    if (otp.length !== 6) {
    alert("Please enter all 6 digits");
    return;
    }

    try {
    const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
        alert("Account verified successfully!");
        localStorage.removeItem("pendingEmail");
        localStorage.setItem("verifiedEmail", email);
        window.location.href = "onboarding1.html"; 
    } else {
        alert(data.error || "Invalid OTP. Try again.");
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    }
    } catch (err) {
    console.error(err);
    alert("Network error");
    }
});

// Resend functionality placeholder
document.getElementById("resendLink").addEventListener("click", () => {
    alert("Resend functionality - implement according to your API");
});

otpInputs[0].focus();
