import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, authAPI } from '../api';
import { Eye, EyeOff, Plus, Store, Users, LogOut, Loader, ChevronRight, BarChart2 } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [usersCount, setUsersCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [waitTime, setWaitTime] = useState('10');
  const [rating, setRating] = useState('4.5');
  const [formPasskey, setFormPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  const [passkeyModalVisible, setPasskeyModalVisible] = useState(false);
  const [passkeyTargetId, setPasskeyTargetId] = useState(null);
  const [modalPasskey, setModalPasskey] = useState('');
  const [passkeySaving, setPasskeySaving] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);

  useEffect(() => {
    fetchRestaurants();
    fetchUsersCount();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await restaurantAPI.getAll();
      setRestaurants(res?.restaurants || []);
    } catch (err) {
      console.error('Failed to fetch restaurants', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchUsersCount = async () => {
    try {
      setLoadingUsers(true);
      const res = await authAPI.getAllUsers();
      setUsersCount(res?.users?.length || 0);
    } catch (err) {
      console.error('Failed to fetch users count', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !imageFile) {
      alert('Name, Location, and Image are required.');
      return;
    }

    try {
      setSubmitting(true);
      
      const uploadRes = await restaurantAPI.uploadImage(imageFile);
      const imageUrl = uploadRes.url;

      const payload = {
        name: name.trim(),
        location: location.trim(),
        image: imageUrl,
        description: description.trim(),
        waitTime: Number(waitTime) || 0,
        rating: Number(rating) || 4.5,
        isOpen: true,
        ...(formPasskey && { vendorPasskey: formPasskey }),
      };
      await restaurantAPI.createRestaurant(payload);
      alert('Restaurant created successfully');
      setName(''); setLocation(''); setImageFile(null); setImagePreview(''); setDescription(''); 
      setWaitTime('10'); setRating('4.5'); setFormPasskey('');
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert('Error creating restaurant: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOpenClose = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      await restaurantAPI.updateRestaurant(id, { isOpen: !currentStatus });
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert('Could not update status');
    } finally {
      setTogglingId(null);
    }
  };

  const openPasskeyModal = (id) => {
    setPasskeyTargetId(id);
    setModalPasskey('');
    setShowModalPassword(false);
    setPasskeyModalVisible(true);
  };

  const savePasskey = async () => {
    if (!passkeyTargetId) return;
    try {
      setPasskeySaving(true);
      await restaurantAPI.updateRestaurant(passkeyTargetId, { vendorPasskey: modalPasskey || '' });
      setPasskeyModalVisible(false);
      alert('Vendor passkey updated successfully');
    } catch (err) {
      console.error(err);
      alert('Could not update passkey');
    } finally {
      setPasskeySaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Platform Overview</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
        >
          <LogOut size={16} />
          Exit
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-600 mb-2">
                <Users size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Total Users</h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {loadingUsers ? <Loader size={24} className="animate-spin text-gray-400" /> : usersCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <ChevronRight size={20} className="text-brand-600" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/analytics')}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
          >
            <div>
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <BarChart2 size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Analytics</h3>
              </div>
              <p className="text-sm font-bold text-gray-500 mt-2">
                View day-wise orders
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <ChevronRight size={20} className="text-purple-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Store size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Restaurants</h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {loadingRestaurants ? <Loader size={24} className="animate-spin text-gray-400" /> : restaurants.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Restaurant Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus size={18} className="text-brand-600" />
                Add Restaurant
              </h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Restaurant Name" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Food Court" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant Image</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }} 
                      required={!imagePreview}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                    />
                  </div>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-200" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Brief description..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Wait (min)</label>
                    <input type="number" value={waitTime} onChange={e => setWaitTime(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                    <input type="number" step="0.1" value={rating} onChange={e => setRating(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vendor Passkey (Optional)</label>
                  <div className="relative">
                    <input 
                      type={showFormPassword ? "text" : "password"} 
                      value={formPasskey} 
                      onChange={e => setFormPasskey(e.target.value)} 
                      className="w-full px-3 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                      placeholder="Leave blank for none" 
                    />
                    <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2"
                >
                  {submitting ? <Loader size={18} className="animate-spin" /> : <><Plus size={18} /> Create Restaurant</>}
                </button>
              </form>
            </div>
          </div>

          {/* Restaurant List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Existing Restaurants</h2>
              <button onClick={fetchRestaurants} className="text-brand-600 text-sm font-semibold hover:underline">Refresh List</button>
            </div>

            {loadingRestaurants ? (
              <div className="flex justify-center py-12"><Loader size={32} className="animate-spin text-brand-600" /></div>
            ) : restaurants.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
                No restaurants added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {restaurants.map(r => (
                  <div key={r._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={r.image || 'https://via.placeholder.com/150'} alt={r.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-gray-900">{r.name}</h3>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${r.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {r.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">📍 {r.location}</p>
                        <p className="text-xs font-medium text-gray-600">Wait: {r.waitTime} min • ⭐ {r.rating}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex gap-3">
                      <button 
                        onClick={() => toggleOpenClose(r._id, r.isOpen)}
                        disabled={togglingId === r._id}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors flex justify-center items-center ${
                          r.isOpen ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100'
                        }`}
                      >
                        {togglingId === r._id ? <Loader size={16} className="animate-spin" /> : r.isOpen ? 'Close Venue' : 'Open Venue'}
                      </button>
                      
                      <button 
                        onClick={() => openPasskeyModal(r._id)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                      >
                        Set Passkey
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Passkey Modal */}
      {passkeyModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Update Vendor Passkey</h3>
            <p className="text-sm text-gray-500 mb-5">Enter a new passkey for this restaurant. Leave blank to clear.</p>
            
            <div className="relative mb-6">
              <input 
                type={showModalPassword ? "text" : "password"} 
                value={modalPasskey}
                onChange={e => setModalPasskey(e.target.value)}
                placeholder="New Passkey"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setShowModalPassword(!showModalPassword)} 
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showModalPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPasskeyModalVisible(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={savePasskey}
                disabled={passkeySaving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {passkeySaving ? <><Loader size={16} className="animate-spin" /> Saving</> : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
