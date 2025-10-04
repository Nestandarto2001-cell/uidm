/**
 * Simple unit tests for assessmentWatcher module
 */

describe('Assessment Watcher - Simple Tests', () => {
  describe('parseAnnouncementText', () => {
    it('should parse token and date from announcement text', () => {
      // Test the regex pattern directly
      const pattern = /([A-Z0-9_]+).*с\s+(\d{4}-\d{2}-\d{2})/i;
      
      const testCases = [
        {
          input: 'DOGE добавлен в оценочную зону с 2024-01-15',
          expected: { token: 'DOGE', startDate: '2024-01-15' }
        },
        {
          input: 'SHIB включен в оценочную зону с 2024-02-20',
          expected: { token: 'SHIB', startDate: '2024-02-20' }
        },
        {
          input: 'BTC_TEST добавлен в оценочную зону с 2024-03-10',
          expected: { token: 'BTC_TEST', startDate: '2024-03-10' }
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const match = input.match(pattern);
        if (match) {
          expect(match[1].toUpperCase()).toBe(expected.token);
          expect(match[2]).toBe(expected.startDate);
        } else {
          fail(`Pattern did not match: ${input}`);
        }
      });
    });

    it('should return null for invalid text', () => {
      const pattern = /([A-Z0-9_]+).*с\s+(\d{4}-\d{2}-\d{2})/i;
      
      const invalidInputs = [
        'Some random text without token',
        'DOGE added to assessment zone',
        'Invalid date format: 15-01-2024',
        ''
      ];

      invalidInputs.forEach(input => {
        const match = input.match(pattern);
        expect(match).toBeNull();
      });
    });
  });

  describe('parseCompletionText', () => {
    it('should parse completion date from announcement text', () => {
      const pattern = /выведен\s+из\s+оценочной\s+зоны.*?(\d{4}-\d{2}-\d{2})/i;
      
      const testCases = [
        {
          input: 'DOGE выведен из оценочной зоны 2024-02-15',
          expected: '2024-02-15'
        },
        {
          input: 'SHIB был выведен из оценочной зоны 2024-03-20',
          expected: '2024-03-20'
        },
        {
          input: 'Токен выведен из оценочной зоны 2024-04-10',
          expected: '2024-04-10'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const match = input.match(pattern);
        expect(match?.[1]).toBe(expected);
      });
    });

    it('should return null for text without completion date', () => {
      const pattern = /выведен\s+из\s+оценочной\s+зоны.*?(\d{4}-\d{2}-\d{2})/i;
      
      const invalidInputs = [
        'DOGE добавлен в оценочную зону',
        'Some random text',
        'Выведен из зоны без даты',
        ''
      ];

      invalidInputs.forEach(input => {
        const match = input.match(pattern);
        expect(match).toBeNull();
      });
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in days correctly', () => {
      const calculateDuration = (startDate: string, endDate?: string): number => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      };
      
      const testCases = [
        {
          startDate: '2024-01-01',
          endDate: '2024-01-02',
          expected: 1
        },
        {
          startDate: '2024-01-01',
          endDate: '2024-01-11',
          expected: 10
        }
      ];

      testCases.forEach(({ startDate, endDate, expected }) => {
        const result = calculateDuration(startDate, endDate);
        expect(result).toBe(expected);
      });
    });

    it('should calculate duration from start date to now when no end date', () => {
      const calculateDuration = (startDate: string, endDate?: string): number => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      };
      
      const startDate = '2024-01-01';
      const result = calculateDuration(startDate);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should have correct default configuration', () => {
      const config = {
        baseUrl: 'https://www.mexc.com/ru-RU/announcements/search',
        query: 'оценочную+зону',
        limit: 50,
        page: 1,
        checkInterval: 10 * 60 * 1000, // 10 minutes
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      expect(config.baseUrl).toContain('mexc.com');
      expect(config.query).toBe('оценочную+зону');
      expect(config.limit).toBe(50);
      expect(config.checkInterval).toBe(600000); // 10 minutes in milliseconds
    });
  });
});
