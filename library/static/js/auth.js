document.addEventListener('DOMContentLoaded', function() {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async function getFreshCsrfToken() {
        try {
            const response = await fetch('/api/csrf/', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("Response was not JSON");
            }
            
            const data = await response.json();
            const token = getCookie('csrftoken');
            if (!token) {
                throw new Error('CSRF token not found in cookies');
            }
            return token;
        } catch (error) {
            console.error('Error getting CSRF token:', error);
            const existingToken = getCookie('csrftoken');
            if (!existingToken) {
                showNotification('Error: Unable to get security token. Please refresh the page.', 'error');
            }
            return existingToken;
        }
    }

    const registerForm = document.querySelector('.auth-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="btn-text">Creating Account...</span>';
            submitButton.disabled = true;

            try {
                const csrftoken = await getFreshCsrfToken();
                if (!csrftoken) {
                    throw new Error('No CSRF token available');
                }

                const response = await fetch(registerForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrftoken,
                        'Accept': 'application/json'
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new TypeError("Response was not JSON");
                }

                const data = await response.json();
                if (data.success) {
                    showNotification(data.message || 'Account created successfully! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect_url;
                    }, 1500);
                } else {
                    showNotification(data.message || 'Registration failed. Please try again.', 'error');
                    if (data.errors) {
                        displayFormErrors(data.errors);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred. Please try again.', 'error');
            } finally {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    const loginForm = document.querySelector('.auth-form');
    if (loginForm && loginForm.closest('.auth-box').querySelector('h2').textContent === 'Welcome Back') {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="btn-text">Logging in...</span>';
            submitButton.disabled = true;

            try {
                const csrftoken = await getFreshCsrfToken();
                if (!csrftoken) {
                    throw new Error('No CSRF token available');
                }

                const response = await fetch(loginForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrftoken,
                        'Accept': 'application/json'
                    },
                    credentials: 'same-origin'
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new TypeError("Response was not JSON");
                }

                const data = await response.json();
                
                if (response.ok && data.success) {
                    showNotification(data.message || 'Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect_url;
                    }, 1000);
                } else {
                    showNotification(data.message || 'Login failed. Please check your credentials.', 'error');
                    if (data.errors) {
                        displayFormErrors(data.errors);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred. Please try again.', 'error');
            } finally {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    function displayFormErrors(errors) {
        const errorElements = document.querySelectorAll('.errorlist');
        errorElements.forEach(el => el.remove());

        Object.keys(errors).forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const errorList = document.createElement('ul');
                errorList.className = 'errorlist';
                errors[fieldName].forEach(error => {
                    const li = document.createElement('li');
                    li.textContent = error;
                    errorList.appendChild(li);
                });
                field.parentElement.appendChild(errorList);
            }
        });
    }
}); 