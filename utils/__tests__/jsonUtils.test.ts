import { describe, it, expect, vi } from 'vitest'
import { extractJson } from '../jsonUtils'

// Mock console.warn to avoid noise in test output
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('jsonUtils', () => {
  describe('extractJson', () => {
    it('should return null for empty or null input', () => {
      expect(extractJson('')).toBeNull()
      expect(extractJson(null as any)).toBeNull()
    })

    it('should extract JSON from markdown code blocks', () => {
      const text = `
        Here's some JSON:
        \`\`\`json
        {"name": "test", "value": 123}
        \`\`\`
        More text here.
      `
      
      const result = extractJson(text)
      expect(result).toBe('{"name": "test", "value": 123}')
      expect(() => JSON.parse(result!)).not.toThrow()
    })

    it('should handle invalid JSON in markdown blocks gracefully', () => {
      const text = `
        \`\`\`json
        {invalid json}
        \`\`\`
      `
      
      // Should continue to try other extraction methods
      expect(extractJson(text)).toBeNull()
    })

    it('should extract valid JSON objects from text', () => {
      const text = 'Some text before {"key": "value", "number": 42} and after'
      
      const result = extractJson(text)
      expect(result).toBe('{"key": "value", "number": 42}')
      expect(() => JSON.parse(result!)).not.toThrow()
    })

    it('should extract valid JSON arrays from text', () => {
      const text = 'Some text before [{"item": 1}, {"item": 2}] and after'
      
      const result = extractJson(text)
      expect(result).toBe('[{"item": 1}, {"item": 2}]')
      expect(() => JSON.parse(result!)).not.toThrow()
    })

    it('should handle nested JSON structures', () => {
      const text = 'Text {"outer": {"inner": {"deep": "value"}}, "array": [1, 2, 3]} more text'
      
      const result = extractJson(text)
      expect(result).toBe('{"outer": {"inner": {"deep": "value"}}, "array": [1, 2, 3]}')
      expect(() => JSON.parse(result!)).not.toThrow()
    })

    it('should return null when no JSON structure is found', () => {
      const text = 'This is just plain text with no JSON structure'
      
      expect(extractJson(text)).toBeNull()
    })

    it('should handle malformed JSON gracefully', () => {
      const text = 'Text {malformed: json, missing: "quotes"} more text'
      
      expect(extractJson(text)).toBeNull()
    })

    it('should find the first valid JSON structure', () => {
      const text = 'Invalid text but valid {"good": "json"} here'
      
      const result = extractJson(text)
      expect(result).toBe('{"good": "json"}')
    })

    it('should handle JSON with string literals containing brackets', () => {
      const text = 'Text {"message": "This contains {brackets} in string"} end'
      
      const result = extractJson(text)
      expect(result).toBe('{"message": "This contains {brackets} in string"}')
      expect(() => JSON.parse(result!)).not.toThrow()
    })

    it('should handle empty JSON objects and arrays', () => {
      expect(extractJson('Text {} end')).toBe('{}')
      expect(extractJson('Text [] end')).toBe('[]')
    })

    it('should prioritize markdown JSON over inline JSON', () => {
      const text = `
        Inline {"inline": "json"} here
        \`\`\`json
        {"markdown": "json"}
        \`\`\`
      `
      
      const result = extractJson(text)
      expect(result).toBe('{"markdown": "json"}')
    })
  })
})
