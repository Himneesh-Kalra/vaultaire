import  { useState } from 'react';

function Login({ onLogin, switchToRegister }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
        const API_URL = import.meta.env.VITE_API_URL;

        const formParams = new URLSearchParams();
        formParams.append('email', formData.email);
        formParams.append('password', formData.password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formParams
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Login failed');
        }

        const responseText = await response.text();
        console.log('Login response:', responseText);

        const userIdMatch = responseText.match(/Login Successful: (.+)$/);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId) {
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', formData.email);

            if (onLogin) {
                onLogin({
                    userId: userId,
                    email: formData.email
                });
            }
        } else {
            throw new Error('Could not extract user ID from response');
        }
    } catch (error) {
        console.error('Login error:', error);
        setErrors({ general: error.message });
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="container">
            <h2 className="project-name">Vaultaire</h2>
            <h1>Login</h1>

            {errors.general && (
                <div style={{ color: 'red', marginBottom: '10px' }}>
                    ⚠️ {errors.general}
                </div>
            )}

            <div className="card" style={{ cursor: 'default' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <p>
                        Don't have an account?{' '}
                        <button
                            onClick={switchToRegister}
                            style={{
                                background: 'none',
                                color: '#4a90e2',
                                textDecoration: 'underline',
                                padding: '0',
                                margin: '0'
                            }}
                        >
                            Register
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
