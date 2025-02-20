import React, { useState } from "react";
import axios from "axios";
import { AiOutlineUser, AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import "./Auth.css";
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BACKEND}signup`, { name, email, password });
            setMessage(response.data.message);
            navigate("/login", { replace: true }); 
        } catch (error) {
            setMessage(error.response?.data?.message || "Signup failed");
        }
    };

    return (
        <div className="auth-container">
            <h2>Signup</h2>
            <form className="auth-form" onSubmit={handleSignup}>
                <div className="input-group">
                    <AiOutlineUser className="icon" />
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="input-group">
                    <AiOutlineMail className="icon" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                    <AiOutlineLock className="icon" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Signup</button>
            </form>
            {message && <p className="auth-message">{message}</p>}
        </div>
    );
};

export default Signup;
