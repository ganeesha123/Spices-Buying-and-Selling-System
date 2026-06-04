import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function OrderFunction() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/buyer/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load orders');
        setOrders(data.orders || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.role === 'buyer') fetchOrders();
  }, [user]);

  if (user && user.role !== 'buyer') {
    return <div className="p-4 text-sm text-red-600">Only buyers can view orders here.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-3">
        {orders.map(o => (
          <li key={o._id} className="border rounded p-3">
            <div className="font-medium">{o.orderNumber}</div>
            <div className="text-sm text-gray-600">Status: {o.status}</div>
            <div className="text-sm">Total: {o.totalAmount}</div>
          </li>
        ))}
        {!loading && !error && orders.length === 0 && (
          <li className="text-gray-500">No orders yet.</li>
        )}
      </ul>
    </div>
  );
}


