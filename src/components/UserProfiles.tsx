import React, { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  name: string;
  uid: string;
  apiKey: string;
  apiSecret: string;
  rememberData: boolean;
  isActive: boolean;
}

interface UserProfilesProps {
  onProfileSelect: (profile: UserProfile) => void;
  onApiCredentials: (key: string, secret: string) => void;
}

export const UserProfiles: React.FC<UserProfilesProps> = ({ onProfileSelect, onApiCredentials }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState<Omit<UserProfile, 'id'>>({
    name: '',
    uid: '',
    apiKey: '',
    apiSecret: '',
    rememberData: true,
    isActive: false
  });

  // Загружаем профили из localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem('mexc_profiles');
    if (savedProfiles) {
      const parsedProfiles = JSON.parse(savedProfiles);
      setProfiles(parsedProfiles);
      const active = parsedProfiles.find((p: UserProfile) => p.isActive);
      if (active) {
        setActiveProfile(active);
        onProfileSelect(active);
        if (active.apiKey && active.apiSecret) {
          onApiCredentials(active.apiKey, active.apiSecret);
        }
      }
    }
  }, []);

  // Сохраняем профили в localStorage
  const saveProfiles = (updatedProfiles: UserProfile[]) => {
    localStorage.setItem('mexc_profiles', JSON.stringify(updatedProfiles));
    setProfiles(updatedProfiles);
  };

  // Добавление нового профиля
  const handleAddProfile = () => {
    if (!newProfile.name.trim()) return;

    const profile: UserProfile = {
      ...newProfile,
      id: Date.now().toString()
    };

    const updatedProfiles = [...profiles, profile];
    saveProfiles(updatedProfiles);
    setNewProfile({
      name: '',
      uid: '',
      apiKey: '',
      apiSecret: '',
      rememberData: true,
      isActive: false
    });
    setShowAddForm(false);
  };

  // Выбор активного профиля
  const handleSelectProfile = (profile: UserProfile) => {
    // Деактивируем все профили
    const updatedProfiles = profiles.map(p => ({ ...p, isActive: false }));
    
    // Активируем выбранный
    const updatedProfile = { ...profile, isActive: true };
    const finalProfiles = updatedProfiles.map(p => 
      p.id === profile.id ? updatedProfile : p
    );
    
    saveProfiles(finalProfiles);
    setActiveProfile(updatedProfile);
    onProfileSelect(updatedProfile);
    
    if (updatedProfile.apiKey && updatedProfile.apiSecret) {
      onApiCredentials(updatedProfile.apiKey, updatedProfile.apiSecret);
    }
  };

  // Обновление профиля
  const handleUpdateProfile = (profileId: string, updates: Partial<UserProfile>) => {
    const updatedProfiles = profiles.map(p => 
      p.id === profileId ? { ...p, ...updates } : p
    );
    saveProfiles(updatedProfiles);
    
    if (activeProfile?.id === profileId) {
      const updated = { ...activeProfile, ...updates };
      setActiveProfile(updated);
      onProfileSelect(updated);
    }
  };

  // Удаление профиля
  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    saveProfiles(updatedProfiles);
    
    if (activeProfile?.id === profileId) {
      setActiveProfile(null);
      onProfileSelect(null as any);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Профили пользователей</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        >
          {showAddForm ? 'Отмена' : '+ Новый профиль'}
        </button>
      </div>

      {/* Список профилей */}
      <div className="space-y-2 mb-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              profile.isActive
                ? 'bg-blue-900/30 border-blue-600/50'
                : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700'
            }`}
            onClick={() => handleSelectProfile(profile)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{profile.name}</span>
                  {profile.isActive && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Активен</span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  UID: {profile.uid || 'Не указан'} | API: {profile.apiKey ? '✓' : '✗'}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Редактирование профиля
                    setNewProfile({
                      name: profile.name,
                      uid: profile.uid,
                      apiKey: profile.apiKey,
                      apiSecret: profile.apiSecret,
                      rememberData: profile.rememberData,
                      isActive: false
                    });
                    setShowAddForm(true);
                  }}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-white font-medium mb-3">
            {profiles.find(p => p.name === newProfile.name) ? 'Редактировать профиль' : 'Новый профиль'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Имя профиля</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Мой профиль"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">MEXC UID</label>
              <input
                type="text"
                value={newProfile.uid}
                onChange={(e) => setNewProfile({ ...newProfile, uid: e.target.value })}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">API Key</label>
              <input
                type="text"
                value={newProfile.apiKey}
                onChange={(e) => setNewProfile({ ...newProfile, apiKey: e.target.value })}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ваш API ключ"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">API Secret</label>
              <input
                type="password"
                value={newProfile.apiSecret}
                onChange={(e) => setNewProfile({ ...newProfile, apiSecret: e.target.value })}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ваш API секрет"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProfile.rememberData}
                onChange={(e) => setNewProfile({ ...newProfile, rememberData: e.target.checked })}
                className="mr-2"
              />
              <span className="text-white text-sm">Запоминать данные</span>
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleAddProfile}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Сохранить
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {profiles.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Нет сохраненных профилей</p>
          <p className="text-sm">Создайте первый профиль для начала работы</p>
        </div>
      )}
    </div>
  );
};
