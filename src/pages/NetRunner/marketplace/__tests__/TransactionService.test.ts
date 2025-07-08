/**
 * TransactionService.test.ts
 * 
 * Test suite for the TransactionService.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  purchaseListing, 
  getUserTransactions, 
  getTransactionDetails, 
  cancelTransaction, 
  disputeTransaction, 
  getUserMarketStats 
} from '../TransactionService';
import { marketplaceDB } from '../MarketplaceDatabaseService';
import { IntelListingEntry, IntelTransaction } from '../IntelligenceExchange';
import { IntelType } from '../../tools/NetRunnerPowerTools';
import * as TokenizationService from '../TokenizationService';

// Mock the processTransaction function
vi.mock('../TokenizationService', () => ({
  processTransaction: vi.fn()
}));

describe('TransactionService', () => {
  beforeEach(() => {
    // Clear all data before each test
    marketplaceDB.clearAllData();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('purchaseListing', () => {
    const mockListing: IntelListingEntry = {
      id: 'listing-1',
      intelReportId: 'report-1',
      title: 'Test Intelligence Report',
      summary: 'A test intelligence report',
      classification: 'CONFIDENTIAL',
      verificationLevel: 'CONFIRMED',
      intelTypes: ['network'] as IntelType[],
      createdAt: '2024-01-01T00:00:00Z',
      listedAt: '2024-01-01T01:00:00Z',
      price: 1000,
      pricingModel: 'fixed',
      sellerId: 'seller-1',
      sellerName: 'Test Seller',
      sellerRating: 4.5,
      status: 'active',
      views: 10,
      favorites: 2,
      tags: ['network', 'security'],
      categories: ['cybersec']
    };

    it('should successfully purchase an active listing', async () => {
      // Set up listing in database
      marketplaceDB.createListing(mockListing);

      // Mock successful blockchain transaction
      vi.mocked(TokenizationService.processTransaction).mockResolvedValue({
        success: true,
        transactionId: 'blockchain-tx-123'
      });

      const result = await purchaseListing(mockListing);

      expect(result.success).toBe(true);
      expect(result.transaction?.status).toBe('completed');
      expect(result.transactionId).toBe('blockchain-tx-123');
      
      // Check that listing status was updated
      const updatedListing = marketplaceDB.getListing(mockListing.id);
      expect(updatedListing?.status).toBe('sold');
    });

    it('should fail when listing is not active', async () => {
      const inactiveListing = { ...mockListing, status: 'sold' as const };

      const result = await purchaseListing(inactiveListing);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available for purchase');
    });

    it('should handle blockchain transaction failure', async () => {
      // Set up listing in database
      marketplaceDB.createListing(mockListing);

      // Mock failed blockchain transaction
      vi.mocked(TokenizationService.processTransaction).mockResolvedValue({
        success: false,
        error: 'Insufficient funds'
      });

      const result = await purchaseListing(mockListing);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
      
      // Check that transaction was marked as cancelled
      const transactions = marketplaceDB.getUserTransactions('current-user-id');
      expect(transactions[0]?.status).toBe('cancelled');
    });

    it('should handle processing errors', async () => {
      // Set up listing in database
      marketplaceDB.createListing(mockListing);

      // Mock blockchain transaction error
      vi.mocked(TokenizationService.processTransaction).mockRejectedValue(
        new Error('Network error')
      );

      const result = await purchaseListing(mockListing);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      
      // Check that transaction was marked as cancelled
      const transactions = marketplaceDB.getUserTransactions('current-user-id');
      expect(transactions[0]?.status).toBe('cancelled');
    });
  });

  describe('getUserTransactions', () => {
    beforeEach(() => {
      // Set up test transactions
      const tx1: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'current-user-id',
        sellerId: 'seller-1',
        price: 1000,
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      const tx2: IntelTransaction = {
        id: 'tx-2',
        listingId: 'listing-2',
        intelReportId: 'report-2',
        buyerId: 'buyer-1',
        sellerId: 'current-user-id',
        price: 500,
        status: 'completed',
        createdAt: '2024-01-02T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(tx1);
      marketplaceDB.createTransaction(tx2);
    });

    it('should get all user transactions by default', () => {
      const transactions = getUserTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should filter by buying transactions', () => {
      const transactions = getUserTransactions('current-user-id', 'buying');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].buyerId).toBe('current-user-id');
    });

    it('should filter by selling transactions', () => {
      const transactions = getUserTransactions('current-user-id', 'selling');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].sellerId).toBe('current-user-id');
    });

    it('should sort transactions by newest first', () => {
      const transactions = getUserTransactions();
      expect(new Date(transactions[0].createdAt).getTime())
        .toBeGreaterThan(new Date(transactions[1].createdAt).getTime());
    });
  });

  describe('getTransactionDetails', () => {
    it('should return transaction details when found', () => {
      const mockTransaction: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(mockTransaction);

      const result = getTransactionDetails('tx-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should return null when transaction not found', () => {
      const result = getTransactionDetails('non-existent-tx');
      expect(result).toBeNull();
    });
  });

  describe('cancelTransaction', () => {
    it('should successfully cancel a pending transaction', async () => {
      const mockTransaction: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(mockTransaction);

      const result = await cancelTransaction('tx-1');
      expect(result).toBe(true);

      const updated = marketplaceDB.getTransaction('tx-1');
      expect(updated?.status).toBe('cancelled');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should fail to cancel non-existent transaction', async () => {
      const result = await cancelTransaction('non-existent-tx');
      expect(result).toBe(false);
    });

    it('should fail to cancel non-pending transaction', async () => {
      const mockTransaction: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(mockTransaction);

      const result = await cancelTransaction('tx-1');
      expect(result).toBe(false);
    });
  });

  describe('disputeTransaction', () => {
    it('should successfully dispute a completed transaction', async () => {
      const mockTransaction: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(mockTransaction);

      const result = await disputeTransaction('tx-1', 'Received incorrect data');
      expect(result).toBe(true);

      const updated = marketplaceDB.getTransaction('tx-1');
      expect(updated?.status).toBe('disputed');
    });

    it('should fail to dispute non-existent transaction', async () => {
      const result = await disputeTransaction('non-existent-tx', 'Test reason');
      expect(result).toBe(false);
    });

    it('should fail to dispute non-completed transaction', async () => {
      const mockTransaction: IntelTransaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        transferMethod: 'direct'
      };

      marketplaceDB.createTransaction(mockTransaction);

      const result = await disputeTransaction('tx-1', 'Test reason');
      expect(result).toBe(false);
    });
  });

  describe('getUserMarketStats', () => {
    beforeEach(() => {
      // Set up test data
      const purchases = [
        {
          id: 'tx-1',
          listingId: 'listing-1',
          intelReportId: 'report-1',
          buyerId: 'current-user-id',
          sellerId: 'seller-1',
          price: 1000,
          status: 'completed' as const,
          createdAt: '2024-01-01T00:00:00Z',
          transferMethod: 'direct' as const
        },
        {
          id: 'tx-2',
          listingId: 'listing-2',
          intelReportId: 'report-2',
          buyerId: 'current-user-id',
          sellerId: 'seller-2',
          price: 500,
          status: 'completed' as const,
          createdAt: '2024-01-02T00:00:00Z',
          transferMethod: 'direct' as const
        }
      ];

      const sales = [
        {
          id: 'tx-3',
          listingId: 'listing-3',
          intelReportId: 'report-3',
          buyerId: 'buyer-1',
          sellerId: 'current-user-id',
          price: 2000,
          status: 'completed' as const,
          createdAt: '2024-01-03T00:00:00Z',
          transferMethod: 'direct' as const
        }
      ];

      [...purchases, ...sales].forEach(tx => marketplaceDB.createTransaction(tx));

      // Add some active listings
      const activeListing = {
        id: 'listing-4',
        intelReportId: 'report-4',
        title: 'Active Listing',
        summary: 'Test summary',
        classification: 'CONFIDENTIAL' as const,
        verificationLevel: 'CONFIRMED' as const,
        intelTypes: ['network'] as IntelType[],
        createdAt: '2024-01-01T00:00:00Z',
        listedAt: '2024-01-01T01:00:00Z',
        price: 1000,
        pricingModel: 'fixed' as const,
        sellerId: 'current-user-id',
        sellerName: 'Test Seller',
        sellerRating: 4.5,
        status: 'active' as const,
        views: 10,
        favorites: 2,
        tags: ['test'],
        categories: ['cyber']
      };

      marketplaceDB.createListing(activeListing);
    });

    it('should calculate user market statistics correctly', () => {
      const stats = getUserMarketStats();
      
      expect(stats.totalPurchases).toBe(2);
      expect(stats.totalSales).toBe(1);
      expect(stats.totalSpent).toBe(1500);
      expect(stats.totalEarned).toBe(2000);
      expect(stats.activeSales).toBe(1);
      expect(stats.recentTransactions).toHaveLength(3);
    });
  });
});
