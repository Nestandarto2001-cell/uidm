import React, { useState } from 'react';
import { useProfilesStore } from '../stores/profilesStore';

export const ProfilesBar: React.FC = React.memo(() => {
  const { items: profiles, activeId, openCreateModal, setActive, update, delete: deleteProfile } = useProfilesStore();
  
  const currentProfile = profiles.find(p => p.id === activeId);
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  const truncateUid = (uid: string) => {
    if (uid.length <= 8) return uid;
    return `${uid.slice(0, 4)}…${uid.slice(-4)}`;
  };

  const hasApiCredentials = (profile: any) => {
    return !!(profile.apiKey && profile.apiSecret);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-600/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300">Профили пользователей</h3>
        <button
          onClick={openCreateModal}
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          + Новый профиль
        </button>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center gap-2 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer min-w-0 flex-shrink-0 border border-slate-600/30"
            onClick={() => setActive(profile.id)}
            onMouseEnter={() => setHoveredProfile(profile.id)}
            onMouseLeave={() => setHoveredProfile(null)}
          >
            {/* Статус индикатор */}
            <div className={`w-2 h-2 ${
              currentProfile?.id === profile.id ? 'bg-green-500' : 'bg-slate-500'
            }`} />
            
            {/* Информация профиля */}
            <div className="text-slate-200 min-w-0">
              <div className="truncate">
                UID: {profile.uid ? truncateUid(profile.uid) : '—'}
              </div>
              <div className="text-slate-400">
                API: {hasApiCredentials(profile) ? '✓' : '✗'}
              </div>
            </div>
            
            {/* API бэйдж */}
            {!hasApiCredentials(profile) && (
              <div className="px-1 py-0.5 bg-red-600 text-white text-xs">
                Not Connected
              </div>
            )}
            
            {/* Кнопки действий (только при hover) */}
            {hoveredProfile === profile.id && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Открываем модальное окно редактирования профиля
                    const event = new CustomEvent('openProfileModal', { 
                      detail: { profile, mode: 'edit' } 
                    });
                    window.dispatchEvent(event);
                    
                    // Также отправляем событие для открытия модального окна
                    const createEvent = new CustomEvent('openCreateModal');
                    window.dispatchEvent(createEvent);
                  }}
                  className="text-slate-400 hover:text-blue-400 transition-colors p-1"
                  title="Редактировать профиль"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProfile(profile.id);
                  }}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
        
        {profiles.length === 0 && (
          <div className="text-slate-400 text-xs">
            Нет профилей. Создайте новый профиль.
          </div>
        )}
      </div>
    </div>
  );
});