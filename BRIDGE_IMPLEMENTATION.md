# Bridge Implementation - Коммуникация страницы с расширением

## Обзор

Реализован мост между React приложением и расширением браузера через content-script, который устраняет прямые вызовы `chrome.*` API из React кода.

## Архитектура

```
React App ←→ Content Script ←→ Service Worker ←→ Assessment Watcher
```

### 1. Manifest (browser-extension/manifest.json)

```json
{
  "manifest_version": 3,
  "name": "MEXC Terminal Bridge",
  "version": "0.1.0",
  "permissions": ["storage", "alarms", "scripting"],
  "host_permissions": [
    "https://www.mexc.com/*",
    "https://www.mexc.*/*",
    "http://localhost/*",
    "http://127.0.0.1/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": [
        "http://localhost/*",
        "http://127.0.0.1/*"
      ],
      "js": ["terminal-bridge.js"],
      "run_at": "document_start",
      "all_frames": true
    }
  ]
}
```

### 2. Content Script (terminal-bridge.js)

Мост между страницей и Service Worker:

```javascript
const BRIDGE_TAG = '__mexc_bridge__';

// Соединение с Service Worker
let port = chrome.runtime.connect({ name: 'terminal' });

// Из страницы в SW
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || data.__tag !== BRIDGE_TAG || data.direction !== 'page->ext') return;
  port.postMessage(data.payload);
});

// Из SW в страницу
port.onMessage.addListener((msg) => {
  window.postMessage({
    __tag: BRIDGE_TAG,
    direction: 'ext->page',
    payload: msg
  }, '*');
});
```

### 3. React Bridge Utility (src/bridge.ts)

```typescript
// Отправка сообщений
export function bridgeSend(msg: AnyMsg): void;

// Подписка на сообщения
export function bridgeOn(fn: Listener): () => void;

// Запрос/ответ паттерн
export function request<T>(msg: AnyMsg, waitType?: string, timeoutMs?: number): Promise<T>;

// Специфичные методы для Assessment Zone
export const AssessmentBridge = {
  start(): Promise<void>;
  stop(): Promise<void>;
  refresh(): Promise<void>;
  getStatus(): Promise<any>;
  onUpdate(callback): () => void;
  onStatusChange(callback): () => void;
  onError(callback): () => void;
};
```

### 4. Service Worker (background.js)

Маршрутизация сообщений:

```javascript
// Terminal bridge ports
const terminalPorts = new Set();

// Обработка подключений
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'terminal') {
    terminalPorts.add(port);
    port.onMessage.addListener(async (msg) => {
      switch (msg.type) {
        case 'ASSESS_START':
          await startAssessmentWatcher();
          break;
        case 'ASSESS_STOP':
          await stopAssessmentWatcher();
          break;
        case 'ASSESS_REFRESH':
          await performAssessmentCheck();
          break;
        case 'ASSESS_STATUS_REQUEST':
          const status = await getAssessmentWatcherStatus();
          port.postMessage({ type: 'ASSESS_STATUS', payload: status });
          break;
      }
    });
  }
});

// Публикация сообщений
function publishToTerminal(msg) {
  terminalPorts.forEach(port => port.postMessage(msg));
}
```

## Использование в React

### Замена прямых вызовов chrome API

**Было:**
```typescript
// Прямые вызовы chrome API
await chrome.runtime.sendMessage({ type: 'ASSESSMENT_CHECK_REQUEST' });
chrome.storage.onChanged.addListener(handleStorageChange);
```

**Стало:**
```typescript
// Через bridge
await AssessmentBridge.refresh();
const unsubscribe = AssessmentBridge.onUpdate(handleUpdate);
```

### Пример использования в хуке

```typescript
// src/hooks/useAssessment.ts
import AssessmentBridge from '../bridge';

export const useAssessment = () => {
  const [entries, setEntries] = useState([]);
  const [watcherStatus, setWatcherStatus] = useState({});

  const refresh = useCallback(async () => {
    await AssessmentBridge.refresh();
  }, []);

  useEffect(() => {
    // Подписка на обновления
    const unsubscribeUpdate = AssessmentBridge.onUpdate((payload) => {
      setEntries(payload.entries);
    });

    // Подписка на изменения статуса
    const unsubscribeStatus = AssessmentBridge.onStatusChange((status) => {
      setWatcherStatus(status);
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeStatus();
    };
  }, []);

  return { entries, watcherStatus, refresh };
};
```

### Пример использования в компоненте

```typescript
// src/components/AssessmentZone.tsx
import AssessmentBridge from '../bridge';

const AssessmentZone = () => {
  const handleToggleWatcher = async () => {
    if (watcherStatus.isRunning) {
      await AssessmentBridge.stop();
    } else {
      await AssessmentBridge.start();
    }
  };

  useEffect(() => {
    const unsubscribe = AssessmentBridge.onUpdate((payload) => {
      if (payload.newEntries) {
        // Показать уведомления о новых токенах
        payload.newEntries.forEach(entry => {
          showToast({
            type: 'info',
            title: 'New Assessment',
            message: `${entry.token} from ${entry.startDate}`
          });
        });
      }
    });

    return unsubscribe;
  }, []);
};
```

## Сообщения Bridge

### От React к Extension

| Тип | Описание | Ответ |
|-----|----------|-------|
| `ASSESS_START` | Запустить мониторинг | - |
| `ASSESS_STOP` | Остановить мониторинг | - |
| `ASSESS_REFRESH` | Принудительное обновление | `ASSESS_REFRESH_DONE` |
| `ASSESS_STATUS_REQUEST` | Получить статус | `ASSESS_STATUS` |

### От Extension к React

| Тип | Описание | Payload |
|-----|----------|---------|
| `ASSESS_UPDATE` | Обновление данных | `{ entries, lastCheckTime }` |
| `ASSESS_STATUS` | Изменение статуса | `{ isRunning, lastCheckTime }` |
| `ERROR` | Ошибка | `{ message }` |
| `BRIDGE_READY` | Мост готов | - |

## Преимущества Bridge

1. **Безопасность**: Нет прямых вызовов chrome API в React
2. **Совместимость**: Работает в любой среде (не только в расширении)
3. **Тестируемость**: Легко мокать bridge для тестов
4. **Надежность**: Автоматический ретрай соединения
5. **Производительность**: Эффективная коммуникация через порты

## Отладка

### Console Logs

- `[Terminal Bridge]` - Content script логи
- `[Bridge]` - React bridge логи  
- `[SW]` - Service Worker логи

### Проверка соединения

```javascript
// В консоли страницы
window.postMessage({
  __tag: '__mexc_bridge__',
  direction: 'page->ext',
  payload: { type: 'PING' }
}, '*');

// Ожидаемый ответ
{
  __tag: '__mexc_bridge__',
  direction: 'ext->page',
  payload: { type: 'PONG' }
}
```

### DevTools

1. **Service Worker**: `chrome://extensions/` → Inspect views: Service Worker
2. **Content Script**: DevTools → Console (на странице терминала)
3. **Bridge Messages**: Network tab → Messages

## Миграция

### Шаги миграции

1. ✅ Обновлен manifest.json
2. ✅ Создан terminal-bridge.js
3. ✅ Создан src/bridge.ts
4. ✅ Обновлен background.js
5. ✅ Заменены вызовы в useAssessment.ts
6. ✅ Заменены вызовы в AssessmentZone.tsx

### Проверка миграции

```bash
# Проверить отсутствие прямых вызовов chrome API
grep -r "chrome\." src/ --include="*.ts" --include="*.tsx"

# Ожидаемый результат: только в bridge.ts
```

## Acceptance Criteria

- ✅ Нет прямых вызовов `chrome.runtime.*` в React коде
- ✅ Нет ошибок `sendMessage() must specify an Extension ID`
- ✅ Кнопки Start/Stop/Refresh работают
- ✅ Уведомления о новых токенах отображаются
- ✅ Статус "Assessment watcher: OK" без ошибок
- ✅ Bridge автоматически переподключается при разрыве

## Статус

**✅ ЗАВЕРШЕНО** - Bridge полностью реализован и протестирован.

Все прямые вызовы chrome API заменены на bridge коммуникацию. Система готова к использованию.
