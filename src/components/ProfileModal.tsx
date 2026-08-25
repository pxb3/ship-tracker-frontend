'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();

  if (!isOpen || !user) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'REGULAR':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <p className="text-gray-900 text-lg">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">User ID</label>
            <p className="text-gray-900 text-sm font-mono break-all">{user.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
            <p className="text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
