import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {FiTrash} from "react-icons/fi";

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth', { state: { redirect: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center border-b pb-2">Shopping cart</h2>
      {cart.length === 0 ? (
        <p className="text-base text-[#4B4D4E] text-center">Your cart is empty.</p>
      ) : (
        <>
          <div className="max-h-[500px] overflow-y-auto">
            {cart.map(item => (
              <div key={item.product._id} className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <img src={item.product.image} alt={item.product.name} className="h-12 w-12 object-cover" />
                  <div>
                    <p className="font-semibold text-[#4B4D4E] text-base hover:underline underline-offset-2">{item.product.name}</p>
                    <p className="text-[#4B4D4E] text-base">${item.product.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 rounded text-lg font-semibold text-[#4B4D4E] hover:bg-black/50 hover:text-white"
                  >
                    -
                  </button>
                  <span className="text-[#4B4D4E] text-base text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 rounded text-lg font-semibold text-[#4B4D4E] hover:bg-black/50 hover:text-white"
                  >
                    +
                  </button>
                  <button onClick={() => removeFromCart(item.product._id)} className="group p-2 rounded hover:bg-red-50 transition-colors">
                    <FiTrash className="text-base text-[#4B4D4E] group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <p className="text-base font-medium text-[#4B4D4E] mb-4">Total: ${total.toFixed(2)}</p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCheckout}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
