import { describe, it, expect } from 'vitest';
import { 
  IntelReportData, 
  IntelReportFormData, 
  IntelReportTransformer 
} from '../src/models/IntelReportData';

describe('IntelReportData Models', () => {
  describe('IntelReportData interface', () => {
    it('should accept all required fields', () => {
      const report: IntelReportData = {
        title: 'Test Report',
        content: 'Test content',
        tags: ['TEST'],
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: Date.now(),
        author: 'test-author-address',
      };

      expect(report.title).toBe('Test Report');
      expect(report.content).toBe('Test content');
      expect(report.tags).toEqual(['TEST']);
      expect(report.latitude).toBe(37.7749);
      expect(report.longitude).toBe(-122.4194);
      expect(typeof report.timestamp).toBe('number');
      expect(report.author).toBe('test-author-address');
    });

    it('should accept optional fields', () => {
      const report: IntelReportData = {
        id: 'test-id',
        title: 'Test Report',
        content: 'Test content',
        tags: ['TEST'],
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: Date.now(),
        author: 'test-author-address',
        pubkey: 'test-pubkey',
        signature: 'test-signature',
        subtitle: 'Test subtitle',
        date: '2024-01-01T00:00:00.000Z',
        categories: ['Category1'],
        metaDescription: 'Test meta description',
      };

      expect(report.id).toBe('test-id');
      expect(report.pubkey).toBe('test-pubkey');
      expect(report.signature).toBe('test-signature');
      expect(report.subtitle).toBe('Test subtitle');
      expect(report.date).toBe('2024-01-01T00:00:00.000Z');
      expect(report.categories).toEqual(['Category1']);
      expect(report.metaDescription).toBe('Test meta description');
    });
  });

  describe('IntelReportFormData interface', () => {
    it('should represent form data structure correctly', () => {
      const formData: IntelReportFormData = {
        title: 'Form Test Report',
        subtitle: 'Form subtitle',
        content: 'Form content',
        tags: 'TEST,FORM,UI',
        categories: 'Category1,Category2',
        lat: '37.7749',
        long: '-122.4194',
        date: '2024-01-01T00:00:00.000Z',
        author: 'form-author-address',
        metaDescription: 'Form meta description',
      };

      expect(formData.title).toBe('Form Test Report');
      expect(formData.subtitle).toBe('Form subtitle');
      expect(formData.content).toBe('Form content');
      expect(formData.tags).toBe('TEST,FORM,UI');
      expect(formData.categories).toBe('Category1,Category2');
      expect(formData.lat).toBe('37.7749');
      expect(formData.long).toBe('-122.4194');
      expect(formData.date).toBe('2024-01-01T00:00:00.000Z');
      expect(formData.author).toBe('form-author-address');
      expect(formData.metaDescription).toBe('Form meta description');
    });
  });

  describe('IntelReportTransformer', () => {
    describe('formToBlockchain', () => {
      it('should convert form data to blockchain data correctly', () => {
        const formData: IntelReportFormData = {
          title: 'Form Test Report',
          subtitle: 'Form subtitle',
          content: 'Form content',
          tags: 'TEST,FORM,UI',
          categories: 'Category1,Category2',
          lat: '37.7749',
          long: '-122.4194',
          date: '2024-01-01T00:00:00.000Z',
          author: 'form-author-address',
          metaDescription: 'Form meta description',
        };

        const result = IntelReportTransformer.formToBlockchain(formData);

        expect(result.title).toBe('Form Test Report');
        expect(result.content).toBe('Form content');
        expect(result.tags).toEqual(['TEST', 'FORM', 'UI']);
        expect(result.latitude).toBe(37.7749);
        expect(result.longitude).toBe(-122.4194);
        expect(result.timestamp).toBeGreaterThan(0);
        expect(result.author).toBe('form-author-address');
      });

      it('should handle empty tags', () => {
        const formData: IntelReportFormData = {
          title: 'Test Report',
          subtitle: '',
          content: 'Test content',
          tags: '',
          categories: '',
          lat: '0',
          long: '0',
          date: '2024-01-01T00:00:00.000Z',
          author: 'test-author',
          metaDescription: '',
        };

        const result = IntelReportTransformer.formToBlockchain(formData);

        expect(result.tags).toEqual([]);
      });

      it('should trim whitespace from tags', () => {
        const formData: IntelReportFormData = {
          title: 'Test Report',
          subtitle: '',
          content: 'Test content',
          tags: ' TEST , FORM , UI ',
          categories: ' Category1 , Category2 ',
          lat: '0',
          long: '0',
          date: '2024-01-01T00:00:00.000Z',
          author: 'test-author',
          metaDescription: '',
        };

        const result = IntelReportTransformer.formToBlockchain(formData);

        expect(result.tags).toEqual(['TEST', 'FORM', 'UI']);
      });
    });

    describe('blockchainToData', () => {
      it('should convert blockchain data to unified data correctly', () => {
        const blockchainData = {
          title: 'Blockchain Test Report',
          content: 'Blockchain content',
          tags: ['BLOCKCHAIN', 'TEST'],
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
          author: 'blockchain-author',
        };

        const result = IntelReportTransformer.blockchainToData(
          blockchainData,
          'test-pubkey',
          'test-signature'
        );

        expect(result.title).toBe('Blockchain Test Report');
        expect(result.content).toBe('Blockchain content');
        expect(result.tags).toEqual(['BLOCKCHAIN', 'TEST']);
        expect(result.latitude).toBe(37.7749);
        expect(result.longitude).toBe(-122.4194);
        expect(result.timestamp).toBe(1640995200000);
        expect(result.author).toBe('blockchain-author');
        expect(result.pubkey).toBe('test-pubkey');
        expect(result.signature).toBe('test-signature');
        expect(result.date).toBe('2022-01-01');
        expect(result.metaDescription).toBe('Blockchain content...');
      });

      it('should handle missing optional parameters', () => {
        const blockchainData = {
          title: 'Test Report',
          content: 'Test content',
          tags: ['TEST'],
          latitude: 0,
          longitude: 0,
          timestamp: Date.now(),
          author: 'test-author',
        };

        const result = IntelReportTransformer.blockchainToData(blockchainData);

        expect(result.title).toBe('Test Report');
        expect(result.content).toBe('Test content');
        expect(result.tags).toEqual(['TEST']);
        expect(result.pubkey).toBeUndefined();
        expect(result.signature).toBeUndefined();
      });
    });

    describe('dataToOverlayMarker', () => {
      it('should convert unified data to overlay marker correctly', () => {
        const reportData: IntelReportData = {
          id: 'test-id',
          title: 'Test Report',
          content: 'Test content',
          tags: ['TEST', 'OVERLAY'],
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: 1640995200000,
          author: 'test-author',
          pubkey: 'test-pubkey',
          signature: 'test-signature',
        };

        const result = IntelReportTransformer.dataToOverlayMarker(reportData);

        expect(result.pubkey).toBe('test-pubkey');
        expect(result.title).toBe('Test Report');
        expect(result.content).toBe('Test content');
        expect(result.tags).toEqual(['TEST', 'OVERLAY']);
        expect(result.latitude).toBe(37.7749);
        expect(result.longitude).toBe(-122.4194);
        expect(result.timestamp).toBe(1640995200000);
        expect(result.author).toBe('test-author');
      });

      it('should handle missing pubkey', () => {
        const reportData: IntelReportData = {
          title: 'Test Report',
          content: 'Test content',
          tags: ['TEST'],
          latitude: 0,
          longitude: 0,
          timestamp: Date.now(),
          author: 'test-author',
        };

        const result = IntelReportTransformer.dataToOverlayMarker(reportData);

        expect(result.pubkey).toBe('');
      });
    });

    describe('validate', () => {
      it('should validate complete intel report data', () => {
        const reportData: IntelReportData = {
          title: 'Valid Report',
          content: 'Valid content',
          tags: ['VALID'],
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: Date.now(),
          author: 'valid-author',
        };

        const result = IntelReportTransformer.validate(reportData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should identify missing required fields', () => {
        const incompleteData: Partial<IntelReportData> = {
          title: '',
          content: '',
          tags: [],
          author: '',
        };

        const result = IntelReportTransformer.validate(incompleteData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Title is required');
        expect(result.errors).toContain('Content is required');
        expect(result.errors).toContain('At least one tag is required');
        expect(result.errors).toContain('Valid latitude is required');
        expect(result.errors).toContain('Valid longitude is required');
        expect(result.errors).toContain('Author is required');
      });

      it('should handle invalid numeric values', () => {
        const invalidData: Partial<IntelReportData> = {
          title: 'Valid Title',
          content: 'Valid content',
          tags: ['VALID'],
          latitude: NaN,
          longitude: NaN,
          author: 'valid-author',
        };

        const result = IntelReportTransformer.validate(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Valid latitude is required');
        expect(result.errors).toContain('Valid longitude is required');
      });
    });
  });
});
