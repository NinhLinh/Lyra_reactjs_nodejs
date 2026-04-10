import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const [errors, setErrors] = useState<any>({});
  const [popup, setPopup] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const validate = () => {
    const newErrors: any = {};

    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = 'Invalid email';
    if (!form.password) {
      newErrors.password = 'Password is required';
    }
    else if (!isLogin && form.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }
    if (!isLogin && !form.name) {
      newErrors.name = 'Name is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validateErrors = validate();
    setErrors(validateErrors);

    if (Object.keys(validateErrors).length > 0) return;

    try {
      if (isLogin) {
        await login(form.email, form.password);
        const redirect = location.state?.redirect || searchParams.get('redirect') || '/orders';
        navigate(redirect);
      } else {
        await register(form.name, form.email, form.password);
        setPopup('Register successful!');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.log(err.response?.data);
      const field = err?.response?.data?.field;
      const message = err?.response?.data?.message;

      if (field) {
        setErrors({
          [field]: message
        });
      } else {
        setPopup(message || 'Something went wrong');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto pt-[80px] lg:pt-[100px]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 my-10 mx-4 rounded shadow"
      >
        <h2 className="text-2xl mb-4">
          {isLogin ? 'Login' : 'Register'}
        </h2>

        {/* NAME */}
        {!isLogin && (
          <div>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className={`w-full p-2 mb-1 border ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mb-2">
                {errors.name}
              </p>
            )}
          </div>
        )}

        {/* EMAIL */}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className={`w-full p-2 mb-1 border ${
              errors.email ? 'border-red-500' : ''
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-2">
              {errors.email}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className={`w-full p-2 mb-1 border ${
              errors.password ? 'border-red-500' : ''
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mb-2">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded mt-2"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }}
          className="w-full mt-2 text-blue-500"
        >
          {isLogin
            ? 'Need to register?'
            : 'Already have account?'}
        </button>
      </form>

      {/* POPUP */}
      {popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <p className="mb-4">{popup}</p>
            <button
              onClick={() => setPopup(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
