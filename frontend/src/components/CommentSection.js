import React, { useEffect, useState } from "react";
import "./CommentSection.css";

const CommentSection = ({ productId }) => {
  const [userName, setUserName] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const API_BASE_URL = process.env.REACT_APP_API_BACKEND;

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}user?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setUserName(data.user?.name || "Anonymous");
        } else {
          setMessage(data.message || "Failed to load user data.");
        }
      } catch (error) {
        setMessage("Error fetching user data.");
      }
    };
    fetchUserData();
  }, [token, API_BASE_URL]);

  // Fetch Comments
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}product/comment/${productId}`);
      const data = await response.json();
      console.log("Fetched comments from DB:", data); // Debugging

      if (data && typeof data === "object") {
        // Convert object to array
        const commentsArray = Object.values(data).reverse();
        setComments(commentsArray);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Error fetching comments.");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [productId, API_BASE_URL]);

  // Handle Comment Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName || !comment || !rating) {
      setMessage("All fields are required!");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}product/comment/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, comment, rating }),
      });

      const data = await response.json();
      if (response.ok) {
        setComment("");
        setRating(5);
        setMessage("");

        // Re-fetch comments from the database after submitting
        fetchComments();
      } else {
        setMessage(data.message || "Failed to add comment.");
      }
    } catch (error) {
      setMessage("Error submitting comment.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="comment-section">
      <h3>{comments.length} Comments</h3>
      {token ? (
        <div className="comment-input-box">
          <form onSubmit={handleSubmit} className="comment-form">
            <textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            {/* Rating Slider */}
            <div className="comment-rating-button">
              <div className="rating-slider">
                <label>Rating: {rating} ⭐</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Comment"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {message && <p className="comment-message">{message}</p>}

      <ul className="comment-list">
        {comments.length > 0 ? (
          comments.map((c, index) => (
            <li key={index} className="comment-item">
              <div className="comment-content">
                <div className="comment-name-rating">
                  <strong>@{c.userName || "Unknown"}</strong>
                  <span>
                    {Array.from({ length: c.rating || 5 }, (_, i) => (
                      <span key={i} className="comment-rating-star">
                        ⭐
                      </span>
                    ))}
                  </span>
                </div>
                <span className="comment-timestamp">
                  {formatTime(c.timestamp) || "Just now"}
                </span>
                <p>{c.comment}</p>
              </div>
            </li>
          ))
        ) : (
          <p>No comments yet.</p>
        )}
      </ul>
    </div>
  );
};

export default CommentSection;
