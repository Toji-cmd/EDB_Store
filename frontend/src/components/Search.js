import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import "./Search.css";
import RecommendedProducts from "./SearchRecommendedProducts";

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [noProductsMessage, setNoProductsMessage] = useState("");

    // Fetch products when the search query changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProducts([]);   // Clear the product list
            setNoProductsMessage("");  // Clear the message
            return;
        }

        const fetchProducts = async () => {
            try {
                const url = `${process.env.REACT_APP_API_BACKEND}search?q=${searchQuery}`;
                const response = await fetch(url);
                const data = await response.json();
                const productArray = Array.isArray(data) ? data : Object.values(data);

                if (productArray.length > 0) {
                    setFilteredProducts(productArray);
                    setNoProductsMessage("");
                } else {
                    setFilteredProducts([]);
                    setNoProductsMessage("No products found.");
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                setFilteredProducts([]);
                setNoProductsMessage("Error fetching products. Please try again later.");
            }
        };

        fetchProducts();
    }, [searchQuery]);

    return (
        <div className="search-page-container">
            {/* Search bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="global-search"
                />
                <FaSearch />
            </div>

            {/* Recommended products */}
            {searchQuery.trim() === '' && <RecommendedProducts />}
            {/* Product list */}
            <div className="product-list">
                {searchQuery.trim() !== "" && filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <Link to={`/product/${product.product_id}`} key={product.product_id} className="product-item">
                            <img
                                src={product.product_image_url}
                                alt={product.product_name}
                                className="product-image"
                            />
                            <div className="text-cont">
                                <div className="child-text-cont">
                                    <span className="product-name">{product.product_name}</span>
                                    <span className="product-brand">{product.product_brand}</span>
                                </div>
                                <span className="product-price">₹{product.product_price}</span>
                            </div>
                        </Link>
                    ))
                ) : searchQuery.trim() !== "" ? (
                    <p>{noProductsMessage}</p>
                ) : null}
            </div>
        </div>
    );
};

export default SearchPage;
