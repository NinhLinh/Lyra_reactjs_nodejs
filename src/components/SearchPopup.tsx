import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
}

interface SearchPopupProps {
    onClose: () => void;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ onClose }) => {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { cart, addToCart } = useCart();
    const navigate = useNavigate();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/products');
                setProducts(res.data);
                setFilteredProducts(res.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useEffect(() => {
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [search, products]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleCheckout = () => {
        if (totalItems === 0) return;
        onClose();
        navigate('/checkout');
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[100] flex items-start justify-center md:justify-end bg-black/40 backdrop-blur-sm"
        >
            <div className="flex h-full w-full max-w-full flex-col overflow-hidden rounded bg-white text-slate-950 shadow-2xl md:max-w-[550px] animate-[popupSlideIn_0.25s_cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                    <FiSearch className="text-slate-500 text-xl flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Finding something? Search here..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-base outline-none"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <FiX className="text-lg" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 transition-colors ml-1"
                    >
                        <span className="text-xs border border-slate-300 rounded px-2 py-1">X</span>
                    </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex h-full items-center justify-center px-4 text-slate-500 text-sm">
                            Loading products...
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                                {filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
                                        <FiSearch className="text-3xl" />
                                        <p className="text-sm text-center">
                                            {search ? `No search results matches "${search}"` : 'There are no products to display.'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 hover:border-slate-300 transition"
                                        >
                                            <a
                                                href={`/product/${product._id}`}
                                                onClick={onClose}
                                                className="flex min-w-0 flex-1 items-start gap-3"
                                            >
                                                <div className="h-[92px] w-[92px] overflow-hidden rounded-2xl bg-slate-200 flex-shrink-0">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-base font-semibold text-slate-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-5 text-slate-600 line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                    <p className="mt-3 text-sm font-semibold text-slate-900">
                                                        ${product.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    addToCart(product);
                                                }}
                                                className="self-start rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {totalItems > 0 ? `${totalItems} sản phẩm trong giỏ` : 'Giỏ hàng hiện tại trống'}
                            </p>
                            <p className="text-sm text-slate-600">
                                Tổng: ${totalPrice.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={totalItems === 0}
                                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                            >
                                <FiShoppingCart className="mr-2" />
                                Checkout
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPopup;
