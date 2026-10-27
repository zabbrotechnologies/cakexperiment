import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { User, Enrollment } from '../../types';
import { Users, Search, CheckCircle, Ban, BookOpen, Shield } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [search, setSearch] = useState('');
  const enrollments = storageService.getEnrollments();
  const orders = storageService.getOrders();

  const handleToggleStatus = (u: User) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    storageService.updateUserStatus(u.id, nextStatus);
    setUsers(storageService.getUsers());
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Student & Account Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Registered demo student accounts, enrolled licenses, and access states
        </p>
      </div>

      {/* Search Input */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '340px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.6rem 0.55rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>User Profile</th>
                <th style={{ padding: '1rem' }}>Platform Role</th>
                <th style={{ padding: '1rem' }}>Joined Date</th>
                <th style={{ padding: '1rem' }}>Enrolled Courses</th>
                <th style={{ padding: '1rem' }}>Account Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const userEnrollments = enrollments.filter(e => e.userId === u.id);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-berry' : 'badge-blush'}`} style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--color-plum)', fontWeight: 600 }}>
                      {userEnrollments.length} Masterclasses
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: u.status === 'active' ? '#E8F5E9' : '#FFEBEE', color: u.status === 'active' ? '#2E7D32' : '#C62828', textTransform: 'capitalize' }}>
                        {u.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
