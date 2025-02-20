import React, { useEffect, useState } from "react";
import { FaUser, FaEdit, FaSave, FaHistory, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import "./ProfilePage.css"; // Importing CSS file
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [history, setHistory] = useState([]);
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, [token]);

    const fetchUserData = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BACKEND}user?token=${token}`);
            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setHistory(data.user.history || []);
                setAddress(data.user.address || "");
                setPhone(data.user.phone || "");
                fetchProductDetails(data.user.history || []);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Error fetching user data");
        }
    };

    const fetchProductDetails = async (historyArray) => {
        try {
            const productDetails = await Promise.all(
                historyArray.map(async (productId) => {
                    const res = await fetch(`http://localhost:3300/products/${productId}`);
                    return res.ok ? res.json() : null;
                })
            );
            setProducts(productDetails.filter(Boolean)); // Remove null values
        } catch (error) {
            setMessage("Error fetching product details");
        }
    };

    const updateUserData = async () => {
        let updateQuery = `?token=${token}`;
        if (address) updateQuery += `&address=${address}`;
        if (phone) updateQuery += `&phone=${phone}`;

        try {
            const response = await fetch(`http://localhost:3300/user/update${updateQuery}`, {
                method: "POST",
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("Profile updated successfully!");
                setIsEditing(false);
                fetchUserData();
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Error updating user data");
        }
    };

    return (
        <div className="profile-container">
            <h2 className="profile-header">
                <FaUser className="icon" /> Profile Page
            </h2>
            {message && <p className="message">{message}</p>}

            {user ? (
                <>
                    <div className="profile-field">
                        <p className="label">Email:</p>
                        <p className="value">{user.email}</p>
                    </div>

                    <div className="profile-field">
                        <label className="label">
                            <FaMapMarkerAlt className="icon" /> Address:
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={!isEditing}
                            className={`input ${isEditing ? "editable" : "disabled"}`}
                        />
                    </div>

                    <div className="profile-field">
                        <label className="label">
                            <FaPhone className="icon" /> Phone:
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={!isEditing}
                            className={`input ${isEditing ? "editable" : "disabled"}`}
                        />
                    </div>

                    <div className="history-section">
                        <h3>
                            <FaHistory className="icon" /> Purchase History
                        </h3>
                        <div className="history-cards">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div key={product.id} className="history-card" onClick={()=>{
                                        navigate(`/product/${product.product_id}`);
                                    }}>
                                        <img src={product.product_image_url} alt={product.product_name} className="product-image" />
                                        <div className="product-details">
                                            <h4>{product.product_name}</h4>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-history">No purchase history found.</p>
                            )}
                        </div>
                    </div>

                    <div className="button-container">
                        {isEditing ? (
                            <button className="save-btn" onClick={updateUserData}>
                                <FaSave className="icon-btn" /> Save
                            </button>
                        ) : (
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                <FaEdit className="icon-btn" /> Edit Profile
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <p className="loading-text">Loading user data...</p>
            )}
        </div>
    );
};

export default ProfilePage;
