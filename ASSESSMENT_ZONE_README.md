# Assessment Zone Monitor

Новая функциональность для мониторинга оценочной зоны MEXC.

## Описание

Assessment Zone Monitor автоматически отслеживает объявления о добавлении токенов в оценочную зону MEXC и уведомляет пользователей о новых записях и завершенных оценках.

## Функциональность

### 1. Сервис-парсер (Node.js)
- **Модуль**: `src/assessmentWatcher.ts`
- **Функция**: `watchAssessmentZone()`
- **Частота проверки**: каждые 10 минут (настраивается через `ASSESS_WATCH_INTERVAL_MINUTES`)
- **Источник данных**: https://www.mexc.com/ru-RU/announcements/search?query=оценочную+зону&limit=50&page=1
- **Парсинг**: использует `node-fetch` и `cheerio`, с fallback на `puppeteer` для динамического контента
- **Хранение**: данные сохраняются в `data/assessmentData.json`

### 2. Интерфейс пользователя
- **Вкладка**: "Assessment Zone" в основном приложении
- **Компонент**: `AssessmentTable` с фильтрами и поиском
- **Фильтры**:
  - Статус (все, активные, выведенные)
  - Поиск по названию токена
  - Диапазон дат начала/окончания
- **Сортировка**: по всем колонкам
- **Колонки**:
  - Токен
  - Дата начала
  - Дата окончания (может быть пусто)
  - Дней в оценке
  - Ссылка на объявление

### 3. Уведомления
- **Toast уведомления** для новых записей и завершенных оценок
- **Индикатор статуса** Assessment watcher в системном статусе
- **Автоматическое обновление** данных

## Установка и настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env` на основе `env.example`:
```bash
cp env.example .env
```

Настройте параметры:
```env
# Частота проверки (в минутах)
ASSESS_WATCH_INTERVAL_MINUTES=10

# MEXC API (если необходимо)
MEXC_API_KEY=your_api_key
MEXC_API_SECRET=your_api_secret
```

### 3. Запуск приложения
```bash
# Разработка
npm run dev

# Сборка
npm run build

# Предварительный просмотр
npm run preview
```

## Структура данных

### AssessmentEntry
```typescript
interface AssessmentEntry {
  token: string;           // Название токена (например, "DOGE")
  startDate: string;       // Дата добавления в зону (YYYY-MM-DD)
  endDate?: string;        // Дата вывода из зоны (если завершено)
  url: string;            // Ссылка на объявление
  status: 'active' | 'completed';  // Статус оценки
  duration?: number;       // Количество дней в оценке
  isNew?: boolean;         // Флаг новой записи
  lastUpdated: string;     // Время последнего обновления
}
```

### AssessmentData
```typescript
interface AssessmentData {
  entries: AssessmentEntry[];  // Массив записей
  lastCheck: string;           // Время последней проверки
  lastError?: string;          // Последняя ошибка (если есть)
}
```

## API

### Основные функции
```typescript
// Запуск мониторинга
startAssessmentWatcher(): Promise<void>

// Остановка мониторинга
stopAssessmentWatcher(): void

// Получение данных
getAssessmentData(): Promise<AssessmentData>

// Принудительное обновление
refreshAssessmentData(): Promise<void>

// Статус watcher'а
getWatcherStatus(): { isRunning: boolean; lastCheck?: string; lastError?: string }
```

### События
```typescript
// Новое объявление
assessmentEmitter.on('newAssessmentEntry', (entry: AssessmentEntry) => {
  // Обработка нового токена в оценочной зоне
});

// Завершение оценки
assessmentEmitter.on('assessmentCompleted', (entry: AssessmentEntry) => {
  // Обработка вывода токена из оценочной зоны
});

// Ошибка
assessmentEmitter.on('assessmentError', (error: Error) => {
  // Обработка ошибок
});
```

## Тестирование

### Запуск тестов
```bash
# Все тесты
npm test

# Тесты в режиме наблюдения
npm run test:watch

# Тесты с покрытием
npm run test:coverage

# Конкретный тест
npm test -- tests/assessmentWatcher.simple.test.ts
```

### Покрытие тестами
- Парсинг текста объявлений
- Извлечение дат завершения
- Расчет продолжительности
- Конфигурация

## Критерии приемки

✅ **Сервис-парсер**:
- [x] Модуль `assessmentWatcher.ts` создан
- [x] Функция `watchAssessmentZone()` реализована
- [x] HTTP-запросы к MEXC с парсингом HTML
- [x] Fallback на Puppeteer для динамического контента
- [x] Хранение в `assessmentData.json`
- [x] EventEmitter для уведомлений

✅ **Интерфейс**:
- [x] Вкладка "Assessment Zone" добавлена
- [x] Компонент `AssessmentTable` с фильтрами
- [x] Поиск, сортировка, фильтрация работают
- [x] Ссылки открываются в новой вкладке
- [x] Кнопка Refresh и индикатор времени

✅ **Статус и уведомления**:
- [x] Индикатор статуса Assessment watcher
- [x] Toast уведомления для новых записей
- [x] Toast уведомления для завершенных оценок

✅ **Тесты и конфигурация**:
- [x] Настройка частоты через переменные окружения
- [x] Unit-тесты для функций парсинга
- [x] Обработка ошибок

## Использование

1. **Запустите приложение**: `npm run dev`
2. **Перейдите на вкладку "Assessment Zone"**
3. **Настройте фильтры** для поиска нужных токенов
4. **Используйте кнопку Refresh** для принудительного обновления
5. **Следите за уведомлениями** о новых токенах и завершенных оценках

## Устранение неполадок

### Watcher не запускается
- Проверьте переменные окружения
- Убедитесь, что папка `data` существует
- Проверьте логи в консоли

### Нет данных
- Проверьте интернет-соединение
- Убедитесь, что MEXC доступен
- Попробуйте принудительное обновление

### Ошибки парсинга
- Проверьте, что структура страницы MEXC не изменилась
- Обновите селекторы в коде при необходимости

## Разработка

### Добавление новых функций
1. Обновите типы в `assessmentWatcher.ts`
2. Добавьте логику в соответствующие функции
3. Обновите интерфейс в `AssessmentTable.tsx`
4. Добавьте тесты в `tests/`
5. Обновите документацию

### Отладка
- Используйте `console.log` в `assessmentWatcher.ts`
- Проверьте файл `data/assessmentData.json`
- Мониторьте события через `assessmentEmitter`
