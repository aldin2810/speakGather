 document.getElementById('signupForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('passwordConfirmation').value;
        const attendee = document.getElementById('attendee').checked;
        const lecturer = document.getElementById('lecturer').checked;
        const error = document.getElementById('error');
        if(firstName.length < 3){
            error.textContent = 'Invalid length of first name!';
            return;
        }
        else if(lastName.length < 3){
            error.textContent = 'Invalid length of last name!';
            return;
        }
        else if(username.length < 8){
            error.textContent = 'Username too short!';
            return;
        }
        else if(!(email.includes('@'))){
            error.textContent = 'Invalid email';
            return;
        }
        else if(password.length < 8){
            error.textContent = 'Invalid length of password!';
            return;
        }
        else if (password !== confirmPassword) {
            error.textContent = 'Passwords do not match.';
            return;
        }
        else if(!attendee && !lecturer){
            error.textContent = 'You must choose at least one of options provided.';
            return;
        }
        const formData = new FormData(event.target);
        try {
            const response = await fetch('/submit/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(formData),
            });
            if(response.ok){
                window.location.href = 'http://localhost:3000/'
            }
            else if (response.status === 409) {
                const data = await response.json();
                const errorMessage = data.error;
                console.log(errorMessage);
                const error = document.getElementById('error');
                error.textContent = errorMessage;
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
    });


