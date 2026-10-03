'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CUSTOMER');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.users) {
          setUsers(data.users);
        }
      })
      .catch((err) => console.error('Failed to load users:', err));
    return () => {
      ignore = true;
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'ALL') return true;
    return (u.role || '').toUpperCase() === roleFilter;
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      setToastMessage('Please complete all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsInviteOpen(false);
        setToastMessage(`User created: ${inviteEmail} as ${inviteRole}!`);
        setInviteName('');
        setInviteEmail('');
        loadUsers();
      } else {
        setToastMessage(data.error || 'Failed to create user.');
      }
    } catch {
      setToastMessage('Network error creating user.');
    }
  };

  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditOpen(false);
        setToastMessage(`Updated role for ${selectedUser.name} to ${newRole}!`);
        loadUsers();
      } else {
        setToastMessage(data.error || 'Failed to update role.');
      }
    } catch {
      setToastMessage('Network error updating user role.');
    }
  };

  const columns = [
    {
      header: 'User & Email',
      key: 'name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
            {(val || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-on-surface block">{val}</span>
            <span className="text-[11px] text-on-surface-variant font-mono">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      key: 'role',
      align: 'center',
      sortable: true,
      render: (val) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            val === 'Administrator'
              ? 'bg-primary/10 text-primary border-primary/20'
              : val === 'Agent'
              ? 'bg-secondary/10 text-secondary border-secondary/20'
              : 'bg-tertiary/10 text-tertiary border-tertiary/20'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Company / Organization',
      key: 'company',
      sortable: true,
      render: (val) => <span className="font-medium text-on-surface">{val}</span>,
    },
    {
      header: 'Joined Date',
      key: 'joinedDate',
      sortable: true,
      render: (val) => <span className="font-mono text-on-surface-variant">{val}</span>,
    },
    {
      header: 'Account Status',
      key: 'status',
      align: 'center',
      render: (_, row) => (
        <StatusBadge
          label={row.statusLabel}
          variant={row.statusVariant}
        />
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedUser(row);
            setIsEditOpen(true);
          }}
        >
          Edit Role
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            User Role & Access Management
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Configure RBAC permissions, invite enterprise shippers, and manage dispatch staff access.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsInviteOpen(true)}
          icon={<Icon name="person_add" size={18} />}
        >
          Invite New User
        </Button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Users' },
          { id: 'CUSTOMER', label: 'Customers' },
          { id: 'AGENT', label: 'Agents' },
          { id: 'ADMINISTRATOR', label: 'Administrators' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              roleFilter === tab.id
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Search users by name, email, company..."
        pageSize={8}
      />

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Platform User"
        subtitle="Send an access link with assigned operational permissions."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInvite}>
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            icon="person"
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            icon="mail"
            required
          />
          <Select
            label="System Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            icon="shield"
            options={['Customer', 'Agent', 'Administrator']}
          />
        </form>
      </Modal>

      {/* Edit Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Role: ${selectedUser.name}`}
          subtitle={`Current Role: ${selectedUser.role}`}
          maxWidth="max-w-md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-on-surface-variant">
              Select new role permission level for {selectedUser.email}:
            </p>
            <div className="flex flex-col gap-2">
              {['Customer', 'Agent', 'Administrator'].map((r) => (
                <button
                  key={r}
                  onClick={() => handleUpdateRole(r)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                    selectedUser.role === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span>{r}</span>
                  {selectedUser.role === r && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
