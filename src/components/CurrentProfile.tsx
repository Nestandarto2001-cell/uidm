import React, { useState } from 'react';
import { useProfilesStore } from '../stores/profilesStore';

export const CurrentProfile: React.FC = React.memo(() => {
  const { items: profiles, activeId: activeProfileId } = useProfilesStore();
  const [isEditing, setIsEditing] = useState(false);

  const currentProfile = profiles.find(p => p.id === activeProfileId);

  const handleEditClick = () => {
    if (currentProfile) {
      // Открываем модальное окно редактирования профиля
      const event = new CustomEvent('openProfileModal', { 
        detail: { profile: currentProfile, mode: 'edit' } 
      });
      window.dispatchEvent(event);
      
      // Также отправляем событие для открытия модального окна
      const createEvent = new CustomEvent('openCreateModal');
      window.dispatchEvent(createEvent);
    }
  };

  if (!currentProfile) {
    return (
      <div className="p-4 bg-slate-800/60 border border-slate-600/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-slate-200 font-medium">Профиль не выбран</h3>
            <p className="text-slate-400 text-sm">Выберите профиль для торговли</p>
          </div>
          <button
            onClick={() => {
              const createEvent = new CustomEvent('openCreateModal');
              window.dispatchEvent(createEvent);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Создать профиль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800/60 border border-slate-600/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-200 font-medium">Текущий профиль</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-slate-300">{currentProfile.name}</span>
            <span className="text-slate-400 text-sm">
              UID: {currentProfile.uid || 'Не указан'}
            </span>
            {currentProfile.apiKey && (
              <span className="text-green-400 text-xs">API: ✓</span>
            )}
          </div>
        </div>
        <button
          onClick={handleEditClick}
          className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium transition-colors"
          title="Редактировать профиль"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Изменить</span>
        </button>
      </div>
    </div>
  );
});
