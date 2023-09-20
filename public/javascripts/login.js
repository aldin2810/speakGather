document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
        const response = await fetch('/submit/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(formData),
        });
        if (response.ok) {
            const {token} = await response.json();
            if (document.getElementById('remember').checked) {
                localStorage.setItem('token', token);
            } else {sessionStorage.setItem('token', token);

        }
            window.location.href = 'http://localhost:3000/homepage?token=' + token;
    }
        else if (response.status === 401) {
            const data = await response.json();
            const errorMessage = data.error;
            const error = document.getElementById('error');
            error.textContent = errorMessage;
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});