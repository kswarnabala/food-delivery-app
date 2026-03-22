import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodsAPI, ordersAPI } from '../utils/api';
import { useAuth } from '../context/AppContext';
import ChatBot from '../components/ChatBot';

interface Food {
    id: number;
    name: string;
    category: string;
    price: number;
    image_url: string;
    description: string;
}

interface Order {
    id: number;
    user_id: number;
    total_amount: number;
    delivery_date: string;
    delivery_time?: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    created_at: string;
}

const AdminDashboard = () => {
    const [foods, setFoods] = useState<Food[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'foods'>('orders');
    const [formData, setFormData] = useState({
        name: '',
        category: 'Rice',
        price: '',
        image_url: '',
        description: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/home');
            return;
        }
        fetchFoods();
        fetchOrders();
    }, [user]);

    const fetchFoods = async () => {
        try {
            const response = await foodsAPI.getAll();
            setFoods(response.data);
        } catch (error) {
            console.error('Failed to fetch foods');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAllAdmin();
            setOrders(response.data || []);
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    };

    const handleUpdateOrderStatus = async (orderId: number, status: string) => {
        try {
            await ordersAPI.updateStatus(orderId, status);
            fetchOrders();
        } catch (error) {
            alert('Failed to update order status.');
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_url: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const foodData = {
                ...formData,
                price: parseFloat(formData.price)
            };

            console.log('SUBMITTING FOOD DATA:', { editingId, name: foodData.name });

            if (editingId) {
                console.log('CALLING foodsAPI.update with ID:', editingId);
                await foodsAPI.update(editingId, foodData);
                setMessage({ type: 'success', text: 'Food item updated successfully!' });
            } else {
                await foodsAPI.create(foodData);
                setMessage({ type: 'success', text: 'Food item added successfully!' });
            }

            handleCancelEdit();
            fetchFoods();
        } catch (error) {
            setMessage({ type: 'danger', text: editingId ? 'Failed to update food item' : 'Failed to add food item' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (food: Food) => {
        setEditingId(food.id);
        setFormData({
            name: food.name,
            category: food.category,
            price: food.price.toString(),
            image_url: food.image_url,
            description: food.description
        });
        setMessage({ type: 'info', text: 'You are now editing: ' + food.name });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            name: '',
            category: 'Rice',
            price: '',
            image_url: '',
            description: ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to remove this item from the menu?')) {
            try {
                await foodsAPI.delete(id);
                fetchFoods();
                if (editingId === id) handleCancelEdit();
            } catch (error) {
                alert('Failed to delete food item');
            }
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Admin Header */}
            <div className="bg-white shadow-sm py-4 mb-5">
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-800 text-primary mb-0">Hotel Manager</h2>
                        <p className="text-muted small mb-0">Manage your restaurant menu items</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button onClick={() => navigate('/home')} className="btn btn-outline-primary py-2 px-3">
                            <i className="bi bi-house-door me-1"></i>Store
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="btn btn-outline-secondary py-2 px-3"
                        >
                            <i className="bi bi-box-arrow-right me-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Tabs */}
                <div className="mb-4 d-flex gap-2">
                    <button
                        className={`btn btn-sm rounded-pill px-4 fw-700 ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Customer Orders
                    </button>
                    <button
                        className={`btn btn-sm rounded-pill px-4 fw-700 ${activeTab === 'foods' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('foods')}
                    >
                        Food Items
                    </button>
                </div>

                {activeTab === 'foods' ? (
                    <div className="row g-4">
                        {/* Add Food Form */}
                        <div className="col-lg-4">
                            <div className={`premium-card p-4 bg-white animate-up ${editingId ? 'border border-primary' : ''}`}>
                                <h4 className="fw-800 mb-4">{editingId ? 'Edit Food Item' : 'Add New Item'}</h4>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-700 text-muted text-uppercase">Food Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="form-control bg-light border-0 py-2"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-700 text-muted text-uppercase">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="form-control bg-light border-0 py-2"
                                        >
                                            <option value="Rice">Rice</option>
                                            <option value="Gravy">Gravy</option>
                                            <option value="Fry">Fry</option>
                                            <option value="Dry">Dry</option>
                                            <option value="Combo">Combo</option>
                                            <option value="Drinks">Drinks</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-700 text-muted text-uppercase">Price (₹)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="form-control bg-light border-0 py-2"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-700 text-muted text-uppercase">{editingId ? 'Update Photo' : 'Upload Food Photo'}</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="form-control bg-light border-0 py-2"
                                        />
                                        <small className="text-muted d-block mt-1">Select a photo to {editingId ? 'update' : 'upload'}.</small>
                                        {formData.image_url && (
                                            <div className="mt-2 rounded-3 overflow-hidden border" style={{ height: '120px', backgroundColor: '#f8f9fa' }}>
                                                <img
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    className="w-100 h-100 object-fit-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-700 text-muted text-uppercase">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="form-control bg-light border-0 py-2"
                                            rows={3}
                                        ></textarea>
                                    </div>

                                    {message.text && (
                                        <div className={`alert alert-${message.type} border-0 small py-2 mb-4 animate-fade`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="d-flex gap-2">
                                        <button type="submit" disabled={loading} className="btn-premium flex-grow-1 py-3">
                                            {loading ? 'Processing...' : editingId ? 'Update Menu' : 'Add to Menu'}
                                        </button>
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="btn btn-light px-3"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Current Menu List */}
                        <div className="col-lg-8">
                            <div className="premium-card p-4 bg-white animate-up" style={{ animationDelay: '0.1s' }}>
                                <h4 className="fw-800 mb-4">Current Menu</h4>
                                <div className="table-responsive">
                                    <table className="table table-borderless align-middle">
                                        <thead className="bg-light text-muted small text-uppercase">
                                            <tr>
                                                <th className="rounded-start ps-3">Item</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th className="text-end rounded-end pe-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {foods.map((food) => (
                                                <tr key={food.id} className="border-bottom-sm">
                                                    <td className="ps-3 py-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-light rounded-3 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                                                                <img src={food.image_url || 'https://via.placeholder.com/40'} className="w-100 h-100 object-fit-cover" alt="" />
                                                            </div>
                                                            <span className="fw-700">{food.name}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-light text-dark rounded-pill fw-600 px-3">{food.category}</span></td>
                                                    <td><span className="fw-700 text-primary">₹{food.price}</span></td>
                                                    <td className="text-end pe-3">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(food)}
                                                                className={`btn btn-link p-0 ${editingId === food.id ? 'text-primary' : 'text-muted'}`}
                                                            >
                                                                <i className="bi bi-pencil-square fs-5"></i>
                                                            </button>
                                                            <button onClick={() => handleDelete(food.id)} className="btn btn-link text-danger p-0">
                                                                <i className="bi bi-trash fs-5"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="premium-card p-4 bg-white animate-up">
                        <h4 className="fw-800 mb-4">Customer Orders</h4>
                        {orders.length === 0 ? (
                            <p className="text-muted mb-0">No orders have been placed yet.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle">
                                    <thead className="bg-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="rounded-start ps-3">Customer</th>
                                            <th>Phone</th>
                                            <th>Delivery Date</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                            <th className="rounded-end pe-3 text-end">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-bottom-sm">
                                                <td className="ps-3 py-3">
                                                    <div className="fw-700">{order.customer_name}</div>
                                                    <div className="small text-muted">{order.customer_address}</div>
                                                </td>
                                                <td>{order.customer_phone}</td>
                                                <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                                                <td>{order.delivery_time || '-'}</td>
                                                <td>
                                                    <select
                                                        className={`form-select form-select-sm fw-600 rounded-pill px-3 py-1 shadow-sm text-white ${order.status === 'confirmed' ? 'bg-success' : order.status === 'rejected' ? 'bg-danger' : order.status === 'waiting' ? 'bg-warning text-dark' : 'bg-secondary'}`}
                                                        style={{ width: '120px', cursor: 'pointer', appearance: 'none', textAlign: 'center' }}
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    >
                                                        <option value="pending" className="bg-white text-dark">Pending</option>
                                                        <option value="waiting" className="bg-white text-dark">Wait</option>
                                                        <option value="confirmed" className="bg-white text-dark">Confirm</option>
                                                        <option value="rejected" className="bg-white text-dark">Reject</option>
                                                    </select>
                                                </td>
                                                <td className="fw-700 text-primary">₹{order.total_amount}</td>
                                                <td className="text-end pe-3 small text-muted">
                                                    {new Date(order.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <ChatBot isAdmin />
            </div>

            <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .border-bottom-sm { border-bottom: 1px solid #f0f0f0; }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
