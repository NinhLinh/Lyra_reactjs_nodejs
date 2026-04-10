import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState<any>({});
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || ''
      });
    };

    fetchUser();
  }, []);

  const handleUpdate = async () => {
    await axios.put(
      'http://localhost:5000/api/users/me',
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setMessage('Profile updated');
  };

  const handleChangePassword = async () => {
    setErrors({});
    try {
      await axios.put(
        'http://localhost:5000/api/users/change-password',
        passwordForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '' });

    } catch (err: any) {
      const { field, message } = err.response.data;
      setErrors({ [field]: message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-24 p-4">
      <h2 className="text-2xl mb-6">My Profile</h2>

      {message && <p className="text-green-500 mb-4">{message}</p>}

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="mb-4 font-semibold">Profile Info</h3>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="w-full p-2 border mb-2"
        />

        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
          className="w-full p-2 border mb-2"
        />

        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          className="w-full p-2 border mb-2"
        />

        <button
          onClick={handleUpdate}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="mb-4 font-semibold">Change Password</h3>

        <input
          type="password"
          placeholder="Current password"
          value={passwordForm.currentPassword}
          onChange={(e) =>
            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
          }
          className={`w-full p-2 border mb-1 ${
            errors.currentPassword ? 'border-red-500' : ''
          }`}
        />
        {errors.currentPassword && (
          <p className="text-red-500 text-sm mb-2">
            {errors.currentPassword}
          </p>
        )}

        <input
          type="password"
          placeholder="New password"
          value={passwordForm.newPassword}
          onChange={(e) =>
            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
          }
          className={`w-full p-2 border mb-1 ${
            errors.newPassword ? 'border-red-500' : ''
          }`}
        />
        {errors.newPassword && (
          <p className="text-red-500 text-sm mb-2">
            {errors.newPassword}
          </p>
        )}

        <button
          onClick={handleChangePassword}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default Profile;
