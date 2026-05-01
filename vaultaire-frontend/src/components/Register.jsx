import React, { useState } from 'react';

function Register({ onRegister, switchToLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            // Send as URLSearchParams (form data)
            const formParams = new URLSearchParams();
            formParams.append('email', formData.email);
            formParams.append('password', formData.password);

            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formParams
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Registration failed');
            }

            const responseText = await response.text();
            console.log('Registration response:', responseText);

            // After successful registration, auto-login
            const loginParams = new URLSearchParams();
            loginParams.append('email', formData.email);
            loginParams.append('password', formData.password);

            const loginResponse = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: loginParams
            });

            if (!loginResponse.ok) {
                throw new Error('Auto-login failed');
            }

            const loginText = await loginResponse.text();
            const userIdMatch = loginText.match(/Login Successful: (.+)$/);
            const userId = userIdMatch ? userIdMatch[1] : null;

            if (userId) {
                localStorage.setItem('userId', userId);
                localStorage.setItem('userEmail', formData.email);

                if (onRegister) {
                    onRegister({
                        userId: userId,
                        email: formData.email
                    });
                }
            } else {
                throw new Error('Could not extract user ID');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2 className="project-name">Vaultaire</h2>
            <h1>Create Account</h1>

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
                        {errors.email && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                                {errors.email}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password (min 6 characters)"
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
                        {errors.password && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
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
                        {errors.confirmPassword && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                                {errors.confirmPassword}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <p>
                        Already have an account?{' '}
                        <button
                            onClick={switchToLogin}
                            style={{
                                background: 'none',
                                color: '#4a90e2',
                                textDecoration: 'underline',
                                padding: '0',
                                margin: '0'
                            }}
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}


export default Register;