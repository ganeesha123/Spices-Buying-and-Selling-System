import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerSupportFunction() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/buyer/support/tickets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load tickets');
        setTickets(data.tickets || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.role === 'buyer') fetchTickets();
  }, [user]);

  if (user && user.role !== 'buyer') {
    return <div className="p-4 text-sm text-red-600">Only buyers can view support tickets here.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">My Support Tickets</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-3">
        {tickets.map(t => (
          <li key={t._id} className="border rounded p-3">
            <div className="font-medium">{t.ticketNumber}</div>
            <div className="text-sm text-gray-600">Status: {t.status}</div>
            <div className="text-sm">Subject: {t.subject}</div>
          </li>
        ))}
        {!loading && !error && tickets.length === 0 && (
          <li className="text-gray-500">No tickets yet.</li>
        )}
      </ul>
    </div>
  );
}


