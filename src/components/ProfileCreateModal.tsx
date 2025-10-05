import React, { useState, useEffect } from 'react';
import { useProfilesStore } from '../stores/profilesStore';

interface UserProfile {
  id: string;
  name: string;
  uid: string;
  apiKey: string;
  apiSecret: string;
  rememberData: boolean;
  isActive: boolean;
}

export const ProfileCreateModal: React.FC = () => {
  const { createOpen, closeCreateModal, create, update } = useProfilesStore();
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    apiKey: '',
    apiSecret: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (createOpen) {
      // Reset form when modal opens
      setFormData({
        name: '',
        uid: '',
        apiKey: '',
        apiSecret: '',
      });
      setErrors({});
      setEditMode(false);
      setEditingProfile(null);
    }
  }, [createOpen]);

  // Слушаем событие открытия модального окна для редактирования
  useEffect(() => {
    const handleOpenProfileModal = (event: CustomEvent) => {
      const { profile, mode } = event.detail;
      if (mode === 'edit' && profile) {
        setEditMode(true);
        setEditingProfile(profile);
        setFormData({
          name: profile.name,
          uid: profile.uid,
          apiKey: profile.apiKey,
          apiSecret: profile.apiSecret,
        });
        setErrors({});
        // Открываем модальное окно
        const createEvent = new CustomEvent('openCreateModal');
        window.dispatchEvent(createEvent);
      }
    };

    window.addEventListener('openProfileModal', handleOpenProfileModal as EventListener);
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal as EventListener);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Profile name is required';
    }

    // API credentials validation: both or neither
    const hasApiKey = !!formData.apiKey.trim();
    const hasApiSecret = !!formData.apiSecret.trim();
    
    if (hasApiKey !== hasApiSecret) {
      newErrors.apiKey = 'Both API Key and API Secret are required together';
      newErrors.apiSecret = 'Both API Key and API Secret are required together';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const profileData = {
      name: formData.name.trim(),
      uid: formData.uid.trim() || undefined,
      apiKey: formData.apiKey.trim() || undefined,
      apiSecret: formData.apiSecret.trim() || undefined,
    };

    if (editMode && editingProfile) {
      // Обновляем существующий профиль
      update(editingProfile.id, profileData);
    } else {
      // Создаем новый профиль
      create(profileData);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeCreateModal();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeCreateModal();
    }
  };

  if (!createOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-slate-800/60 border border-slate-600/50 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
          <h2 className="text-lg font-semibold text-slate-200">
            {editMode ? 'Редактировать профиль' : 'Создать профиль'}
          </h2>
          <button
            onClick={closeCreateModal}
            className="text-slate-400 hover:text-slate-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Profile Name */}
          <div>
            <label className="block text-slate-300 text-sm mb-1" htmlFor="profileName">
              Profile Name *
            </label>
            <input
              id="profileName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 bg-slate-700 border text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500 ${
                errors.name ? 'border-red-500' : 'border-slate-600/50'
              }`}
              placeholder="Enter profile name"
              autoFocus
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* UID */}
          <div>
            <label className="block text-slate-300 text-sm mb-1" htmlFor="profileUid">
              UID (optional)
            </label>
            <input
              id="profileUid"
              type="text"
              value={formData.uid}
              onChange={(e) => setFormData(prev => ({ ...prev, uid: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500"
              placeholder="Enter UID"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-slate-300 text-sm mb-1" htmlFor="apiKey">
              API Key
            </label>
            <input
              id="apiKey"
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              className={`w-full px-3 py-2 bg-slate-700 border text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500 ${
                errors.apiKey ? 'border-red-500' : 'border-slate-600/50'
              }`}
              placeholder="Enter API Key"
            />
            {errors.apiKey && (
              <p className="text-red-400 text-xs mt-1">{errors.apiKey}</p>
            )}
          </div>

          {/* API Secret */}
          <div>
            <label className="block text-slate-300 text-sm mb-1" htmlFor="apiSecret">
              API Secret
            </label>
            <input
              id="apiSecret"
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))}
              className={`w-full px-3 py-2 bg-slate-700 border text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500 ${
                errors.apiSecret ? 'border-red-500' : 'border-slate-600/50'
              }`}
              placeholder="Enter API Secret"
            />
            {errors.apiSecret && (
              <p className="text-red-400 text-xs mt-1">{errors.apiSecret}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={closeCreateModal}
              className="flex-1 px-4 py-2 border border-slate-600/50 text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {editMode ? 'Сохранить изменения' : 'Создать профиль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
