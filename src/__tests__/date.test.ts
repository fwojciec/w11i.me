import { describe, it, expect } from 'vitest'
import { tsFromStr } from '../lib/date'

describe('Date utilities', () => {
  describe('tsFromStr', () => {
    it('should convert date string to timestamp', () => {
      const dateStr = '2024-01-15'
      const timestamp = tsFromStr(dateStr)

      expect(timestamp).toBeGreaterThan(0)
      expect(typeof timestamp).toBe('number')

      // Verify it's a valid date (use UTC to avoid timezone issues)
      const date = new Date(timestamp)
      expect(date.getUTCFullYear()).toBe(2024)
      expect(date.getUTCMonth()).toBe(0) // January (0-indexed)
      expect(date.getUTCDate()).toBe(15)
    })

    it('should handle different date formats consistently', () => {
      const dateStr1 = '2024-01-15'
      const dateStr2 = '2024-01-16'

      const ts1 = tsFromStr(dateStr1)
      const ts2 = tsFromStr(dateStr2)

      expect(ts2).toBeGreaterThan(ts1)
      expect(ts2 - ts1).toBe(24 * 60 * 60 * 1000) // 1 day in milliseconds
    })

    it('should handle edge case dates', () => {
      const edgeCases = [
        '2024-02-29', // Leap year
        '2024-12-31', // End of year
        '2024-01-01', // Start of year
      ]

      edgeCases.forEach((dateStr) => {
        const timestamp = tsFromStr(dateStr)
        expect(timestamp).toBeGreaterThan(0)
        expect(new Date(timestamp).getTime()).toBe(timestamp)
      })
    })
  })
})
