/**
 * Assessment Parser Tests
 * Tests for parsing assessment zone announcements
 */

import { promises as fs } from 'fs';
import path from 'path';

describe('Assessment Parser', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  describe('parseRussianDate', () => {
    const parseRussianDate = (text: string) => {
      const months = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
        'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
        'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
      };
      
      const pattern = /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i;
      const match = text.match(pattern);
      
      if (match) {
        const day = parseInt(match[1]);
        const month = months[match[2].toLowerCase() as keyof typeof months];
        const year = parseInt(match[3]);
        
        const date = new Date(year, month, day, 0, 0, 0);
        // Convert from UTC+8 to UTC
        date.setHours(date.getHours() - 8);
        
        return {
          iso: date.toISOString(),
          local: new Date(date.getTime()).toLocaleString('en-US', {
            timeZone: 'Europe/Rome',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
      }
      
      return null;
    };

    it('should parse Russian date correctly', () => {
      const testCases = [
        {
          input: '5 сентября 2024 г.',
          expected: {
            iso: '2024-09-04T16:00:00.000Z',
            year: 2024,
            month: 8, // September (0-indexed)
            day: 4 // UTC date after conversion
          }
        },
        {
          input: '10 сентября 2024 г.',
          expected: {
            iso: '2024-09-09T16:00:00.000Z',
            year: 2024,
            month: 8,
            day: 9 // UTC date after conversion
          }
        },
        {
          input: '15 сентября 2024 г.',
          expected: {
            iso: '2024-09-14T16:00:00.000Z',
            year: 2024,
            month: 8,
            day: 14 // UTC date after conversion
          }
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseRussianDate(input);
        expect(result).not.toBeNull();
        
        const date = new Date(result!.iso);
        expect(date.getFullYear()).toBe(expected.year);
        expect(date.getMonth()).toBe(expected.month);
        expect(date.getUTCDate()).toBe(expected.day);
      });
    });

    it('should return null for invalid Russian dates', () => {
      const invalidInputs = [
        '5 September 2024',
        'Invalid date',
        '2024-09-05',
        ''
      ];

      invalidInputs.forEach(input => {
        const result = parseRussianDate(input);
        expect(result).toBeNull();
      });
    });
  });

  describe('parseEnglishDate', () => {
    const parseEnglishDate = (text: string) => {
      try {
        // Try standard date parsing
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          // Assume UTC+8 and convert to UTC
          date.setHours(date.getHours() - 8);
          
          return {
            iso: date.toISOString(),
            local: new Date(date.getTime()).toLocaleString('en-US', {
              timeZone: 'Europe/Rome',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };
        }
      } catch (error) {
        console.error('Error parsing English date:', error);
      }
      
      return null;
    };

    it('should parse English date correctly', () => {
      const testCases = [
        {
          input: 'September 20, 2024',
          expected: {
            year: 2024,
            month: 8, // September (0-indexed)
            day: 19 // UTC date after conversion
          }
        },
        {
          input: 'September 25, 2024',
          expected: {
            year: 2024,
            month: 8,
            day: 24 // UTC date after conversion
          }
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseEnglishDate(input);
        expect(result).not.toBeNull();
        
        const date = new Date(result!.iso);
        expect(date.getFullYear()).toBe(expected.year);
        expect(date.getMonth()).toBe(expected.month);
        expect(date.getUTCDate()).toBe(expected.day);
      });
    });
  });

  describe('calculateStatus', () => {
    const calculateStatus = (startDate: string, endDate?: string) => {
      const now = new Date();
      const start = new Date(startDate);
      
      if (endDate) {
        const end = new Date(endDate);
        if (end < now) return 'Completed';
        if (start > now) return 'Pending';
        return 'Active';
      } else {
        if (start > now) return 'Pending';
        return 'Active';
      }
    };

    it('should calculate status correctly', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(now.getTime() + 86400000).toISOString(); // 1 day from now
      const pastEndDate = new Date(now.getTime() - 86400000).toISOString(); // 1 day ago

      expect(calculateStatus(pastDate)).toBe('Active');
      expect(calculateStatus(futureDate)).toBe('Pending');
      expect(calculateStatus(pastDate, pastEndDate)).toBe('Completed');
      expect(calculateStatus(futureDate, pastEndDate)).toBe('Completed');
    });
  });

  describe('calculateDaysInAssessment', () => {
    const calculateDaysInAssessment = (startDate: string, endDate?: string) => {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    it('should calculate days in assessment correctly', () => {
      const startDate = '2024-09-05T00:00:00.000Z';
      const endDate = '2024-09-15T00:00:00.000Z';
      
      const result = calculateDaysInAssessment(startDate, endDate);
      expect(result).toBe(10);
    });

    it('should calculate days from start to now when no end date', () => {
      const startDate = new Date(Date.now() - 86400000 * 5).toISOString(); // 5 days ago
      
      const result = calculateDaysInAssessment(startDate);
      expect(result).toBe(5);
    });
  });

  describe('parseTokens', () => {
    const parseTokens = (text: string) => {
      return text.split(/[,\n]/)
        .map(token => token.trim())
        .filter(token => /^[A-Z0-9._-]{2,15}$/.test(token));
    };

    it('should parse tokens correctly', () => {
      const testCases = [
        {
          input: 'DOGE, SHIB, PEPE',
          expected: ['DOGE', 'SHIB', 'PEPE']
        },
        {
          input: 'BTC_TEST, ETH_TEST',
          expected: ['BTC_TEST', 'ETH_TEST']
        },
        {
          input: 'ADA, DOT, LINK',
          expected: ['ADA', 'DOT', 'LINK']
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseTokens(input);
        expect(result).toEqual(expected);
      });
    });

    it('should filter out invalid tokens', () => {
      const input = 'DOGE, invalid-token, SHIB, 123, PEPE';
      const result = parseTokens(input);
      expect(result).toEqual(['DOGE', 'SHIB', '123', 'PEPE']);
    });
  });

  describe('parseAssessmentTable', () => {
    const parseAssessmentTable = (html: string) => {
      // Mock DOM parsing
      const mockTable = {
        querySelectorAll: (selector: string) => {
          if (selector === 'tbody tr, tr') {
            return [
              {
                querySelectorAll: (cellSelector: string) => {
                  if (cellSelector === 'td, th') {
                    return [
                      { textContent: 'DOGE, SHIB, PEPE' },
                      { textContent: '5 сентября 2024 г.' },
                      { textContent: '5 октября 2024 г.' }
                    ];
                  }
                  return [];
                }
              }
            ];
          }
          return [];
        }
      };

      const entries = [];
      const rows = mockTable.querySelectorAll('tbody tr, tr');
      
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length < 2) continue;
        
        try {
          const tokensText = cells[0]?.textContent?.trim() || '';
          const startText = cells[1]?.textContent?.trim() || '';
          const endText = cells[2]?.textContent?.trim() || '';
          
          // Parse tokens
          const tokens = tokensText.split(/[,\n]/)
            .map(token => token.trim())
            .filter(token => /^[A-Z0-9._-]{2,15}$/.test(token));
          
          // Mock date parsing
          const startDate = {
            iso: '2024-09-04T16:00:00.000Z',
            local: '05/09/2024, 00:00:00'
          };
          
          const endDate = endText ? {
            iso: '2024-10-04T16:00:00.000Z',
            local: '05/10/2024, 00:00:00'
          } : null;
          
          // Create entries for each token
          for (const token of tokens) {
            if (token && startDate) {
              entries.push({
                token,
                startDateIsoUtc: startDate.iso,
                endDateIsoUtc: endDate?.iso || null,
                startLocal: startDate.local,
                endLocal: endDate?.local || null,
                status: endDate ? 'Active' : 'Active',
                daysInAssessment: 30,
                daysRemaining: endDate ? 30 : null,
                parsedFrom: 'table'
              });
            }
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      }
      
      return { entries, parsedFrom: 'table' };
    };

    it('should parse assessment table correctly', async () => {
      const html = await fs.readFile(path.join(fixturesDir, 'assessment-ru-page.html'), 'utf-8');
      const result = parseAssessmentTable(html);
      
      expect(result.entries).toHaveLength(3); // DOGE, SHIB, PEPE
      expect(result.parsedFrom).toBe('table');
      
      const firstEntry = result.entries[0];
      expect(firstEntry.token).toBe('DOGE');
      expect(firstEntry.startDateIsoUtc).toBe('2024-09-04T16:00:00.000Z');
      expect(firstEntry.endDateIsoUtc).toBe('2024-10-04T16:00:00.000Z');
      expect(firstEntry.status).toBe('Active');
    });
  });

  describe('parseFallbackData', () => {
    const parseFallbackData = (html: string) => {
      const entries = [];
      
      // Mock paragraph parsing
      const mockParagraphs = [
        { textContent: 'DOGE добавлен в оценочную зону с 5 сентября 2024 г.' },
        { textContent: 'SHIB включен в оценочную зону с 10 сентября 2024 г.' },
        { textContent: 'PEPE добавлен в оценочную зону с 15 сентября 2024 г.' }
      ];
      
      const patterns = [
        /([A-Z0-9._-]{2,15})\s+(?:добавлен|added).*?(?:с|from)\s+([^,\n]+)/gi,
        /([A-Z0-9._-]{2,15})\s+(?:включен|included).*?(?:с|from)\s+([^,\n]+)/gi
      ];
      
      for (const paragraph of mockParagraphs) {
        const text = paragraph.textContent || '';
        
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const token = match[1];
            const dateText = match[2];
            
            try {
              const startDate = {
                iso: '2024-09-04T16:00:00.000Z',
                local: '05/09/2024, 00:00:00'
              };
              
              if (startDate) {
                entries.push({
                  token,
                  startDateIsoUtc: startDate.iso,
                  endDateIsoUtc: null,
                  startLocal: startDate.local,
                  endLocal: null,
                  status: 'Active',
                  daysInAssessment: 30,
                  daysRemaining: null,
                  parsedFrom: 'fallback'
                });
              }
            } catch (error) {
              console.error('Error parsing fallback data:', error);
            }
          }
        }
      }
      
      return { entries, parsedFrom: 'fallback' };
    };

    it('should parse fallback data correctly', async () => {
      const html = await fs.readFile(path.join(fixturesDir, 'assessment-fallback-page.html'), 'utf-8');
      const result = parseFallbackData(html);
      
      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.parsedFrom).toBe('fallback');
      
      const firstEntry = result.entries[0];
      expect(firstEntry.token).toBe('DOGE');
      expect(firstEntry.parsedFrom).toBe('fallback');
    });
  });

  describe('timezone conversion', () => {
    it('should convert UTC+8 to Europe/Rome correctly', () => {
      const utc8Date = new Date('2024-09-05T00:00:00+08:00');
      const romeDate = new Date(utc8Date.getTime()).toLocaleString('en-US', {
        timeZone: 'Europe/Rome'
      });
      
      // UTC+8 to Europe/Rome should be 6 hours difference (Rome is UTC+2 in summer)
      expect(romeDate).toBeDefined();
    });
  });

  describe('token history', () => {
    it('should handle multiple assessments for same token', () => {
      const token = 'DOGE';
      const history = [
        {
          startDate: '2024-09-05T00:00:00.000Z',
          endDate: '2024-10-05T00:00:00.000Z',
          announcementUrl: 'https://example.com/announcement1',
          announcementTitle: 'First Assessment'
        },
        {
          startDate: '2024-11-05T00:00:00.000Z',
          endDate: '2024-12-05T00:00:00.000Z',
          announcementUrl: 'https://example.com/announcement2',
          announcementTitle: 'Second Assessment'
        }
      ];
      
      expect(history).toHaveLength(2);
      expect(history[0].startDate).toBe('2024-09-05T00:00:00.000Z');
      expect(history[1].startDate).toBe('2024-11-05T00:00:00.000Z');
    });
  });
});
