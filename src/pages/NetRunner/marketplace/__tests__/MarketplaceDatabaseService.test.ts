/**
 * MarketplaceDatabaseService.test.ts
 * 
 * Test suite for the MarketplaceDatabaseService.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceDB, UserProfile } from '../MarketplaceDatabaseService';
import { IntelListingEntry, IntelTransaction } from '../IntelligenceExchange';
import { TokenizedIntel } from '../TokenizationService';
import { IntelType } from '../../tools/NetRunnerPowerTools';

describe('MarketplaceDatabaseService', () => {
  // Use the singleton instance but clear it before each test
  beforeEach(() => {
    // Clear all data before each test
    marketplaceDB.clearAllData();
  });

  describe('Listing Operations', () => {
    const mockListing: IntelListingEntry = {
      id: 'test-listing-1',
      intelReportId: 'report-1',
      title: 'Test Intelligence Report',
      summary: 'A test intelligence report',
      classification: 'CONFIDENTIAL',
      verificationLevel: 'CONFIRMED',
      intelTypes: ['network'],
      createdAt: '2024-01-01T00:00:00Z',
      listedAt: '2024-01-01T01:00:00Z',
      price: 1000,
      pricingModel: 'fixed',
      sellerId: 'seller-1',
      sellerName: 'Test Seller',
      sellerRating: 4.5,
      status: 'active',
      views: 0,
      favorites: 0,
      tags: ['network', 'security'],
      categories: ['cybersec']
    };

    it('should create a listing successfully', () => {
      const result = marketplaceDB.createListing(mockListing);
      expect(result).toBe(true);

      const retrieved = marketplaceDB.getListing(mockListing.id);
      expect(retrieved).toEqual(mockListing);
    });

    it('should update a listing successfully', () => {
      marketplaceDB.createListing(mockListing);
      
      const updateResult = marketplaceDB.updateListing(mockListing.id, {
        price: 1500,
        status: 'sold'
      });
      
      expect(updateResult).toBe(true);
      
      const updated = marketplaceDB.getListing(mockListing.id);
      expect(updated?.price).toBe(1500);
      expect(updated?.status).toBe('sold');
    });

    it('should delete a listing successfully', () => {
      marketplaceDB.createListing(mockListing);
      
      const deleteResult = marketplaceDB.deleteListing(mockListing.id);
      expect(deleteResult).toBe(true);
      
      const retrieved = marketplaceDB.getListing(mockListing.id);
      expect(retrieved).toBeNull();
    });

    it('should search listings with filters', () => {
      const listing1 = { ...mockListing, id: 'listing-1', price: 500 };
      const listing2 = { ...mockListing, id: 'listing-2', price: 1500 };
      
      marketplaceDB.createListing(listing1);
      marketplaceDB.createListing(listing2);
      
      // Search by price range
      const results = marketplaceDB.searchListings({
        priceRange: { min: 400, max: 1000 }
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('listing-1');
    });

    it('should increment view count correctly', () => {
      marketplaceDB.createListing(mockListing);
      
      const result1 = marketplaceDB.incrementViews(mockListing.id, 'user-1');
      const result2 = marketplaceDB.incrementViews(mockListing.id, 'user-2');
      const result3 = marketplaceDB.incrementViews(mockListing.id, 'user-1'); // Duplicate view
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      
      const updated = marketplaceDB.getListing(mockListing.id);
      expect(updated?.views).toBe(2); // Only unique views counted
    });
  });

  describe('Transaction Operations', () => {
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

    it('should create a transaction successfully', () => {
      const result = marketplaceDB.createTransaction(mockTransaction);
      expect(result).toBe(true);

      const retrieved = marketplaceDB.getTransaction(mockTransaction.id);
      expect(retrieved).toEqual(mockTransaction);
    });

    it('should update a transaction successfully', () => {
      marketplaceDB.createTransaction(mockTransaction);
      
      const updateResult = marketplaceDB.updateTransaction(mockTransaction.id, {
        status: 'completed',
        completedAt: '2024-01-01T01:00:00Z'
      });
      
      expect(updateResult).toBe(true);
      
      const updated = marketplaceDB.getTransaction(mockTransaction.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBe('2024-01-01T01:00:00Z');
    });

    it('should get user transactions correctly', () => {
      const tx1 = { ...mockTransaction, id: 'tx-1', buyerId: 'user-1' };
      const tx2 = { ...mockTransaction, id: 'tx-2', sellerId: 'user-1' };
      const tx3 = { ...mockTransaction, id: 'tx-3', buyerId: 'user-2' };
      
      marketplaceDB.createTransaction(tx1);
      marketplaceDB.createTransaction(tx2);
      marketplaceDB.createTransaction(tx3);
      
      const buyerTx = marketplaceDB.getUserTransactions('user-1', 'buyer');
      const sellerTx = marketplaceDB.getUserTransactions('user-1', 'seller');
      const allTx = marketplaceDB.getUserTransactions('user-1');
      
      expect(buyerTx).toHaveLength(1);
      expect(sellerTx).toHaveLength(1);
      expect(allTx).toHaveLength(2);
    });
  });

  describe('Tokenized Assets Operations', () => {
    const mockAsset: TokenizedIntel = {
      tokenId: 'token-1',
      intelReportId: 'report-1',
      contractAddress: 'solana:0xabcd1234',
      blockchain: 'solana',
      metadataURI: 'ipfs://QmHash123',
      metadata: {
        name: 'Test Intel Token',
        description: 'A tokenized intelligence report',
        attributes: [
          { trait_type: 'Classification', value: 'CONFIDENTIAL' }
        ]
      },
      mintedAt: '2024-01-01T00:00:00Z',
      mintedBy: 'user-1',
      owner: 'user-1',
      transactionHistory: []
    };

    it('should create a tokenized asset successfully', () => {
      const result = marketplaceDB.createTokenizedAsset(mockAsset);
      expect(result).toBe(true);

      const retrieved = marketplaceDB.getTokenizedAsset(mockAsset.tokenId);
      expect(retrieved).toEqual(mockAsset);
    });

    it('should update a tokenized asset successfully', () => {
      marketplaceDB.createTokenizedAsset(mockAsset);
      
      const updateResult = marketplaceDB.updateTokenizedAsset(mockAsset.tokenId, {
        owner: 'user-2'
      });
      
      expect(updateResult).toBe(true);
      
      const updated = marketplaceDB.getTokenizedAsset(mockAsset.tokenId);
      expect(updated?.owner).toBe('user-2');
    });

    it('should get user tokenized assets correctly', () => {
      const asset1 = { ...mockAsset, tokenId: 'token-1', owner: 'user-1' };
      const asset2 = { ...mockAsset, tokenId: 'token-2', owner: 'user-1' };
      const asset3 = { ...mockAsset, tokenId: 'token-3', owner: 'user-2' };
      
      marketplaceDB.createTokenizedAsset(asset1);
      marketplaceDB.createTokenizedAsset(asset2);
      marketplaceDB.createTokenizedAsset(asset3);
      
      const userAssets = marketplaceDB.getUserTokenizedAssets('user-1');
      expect(userAssets).toHaveLength(2);
    });
  });

  describe('User Profile Operations', () => {
    const mockProfile: UserProfile = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      walletAddress: 'wallet-123',
      rating: 4.5,
      totalSales: 10,
      totalPurchases: 5,
      joinedAt: '2024-01-01T00:00:00Z',
      isVerified: true,
      reputation: 1000
    };

    it('should create a user profile successfully', () => {
      const result = marketplaceDB.createUserProfile(mockProfile);
      expect(result).toBe(true);

      const retrieved = marketplaceDB.getUserProfile(mockProfile.id);
      expect(retrieved).toEqual(mockProfile);
    });

    it('should update a user profile successfully', () => {
      marketplaceDB.createUserProfile(mockProfile);
      
      const updateResult = marketplaceDB.updateUserProfile(mockProfile.id, {
        rating: 4.8,
        totalSales: 15
      });
      
      expect(updateResult).toBe(true);
      
      const updated = marketplaceDB.getUserProfile(mockProfile.id);
      expect(updated?.rating).toBe(4.8);
      expect(updated?.totalSales).toBe(15);
    });
  });

  describe('Statistics and Analytics', () => {
    beforeEach(() => {
      // Set up test data
      const listing = {
        id: 'listing-1',
        intelReportId: 'report-1',
        title: 'Test Intel',
        summary: 'Test summary',
        classification: 'CONFIDENTIAL' as const,
        verificationLevel: 'CONFIRMED' as const,
        intelTypes: ['network'] as IntelType[],
        createdAt: '2024-01-01T00:00:00Z',
        listedAt: '2024-01-01T01:00:00Z',
        price: 1000,
        pricingModel: 'fixed' as const,
        sellerId: 'seller-1',
        sellerName: 'Test Seller',
        sellerRating: 4.5,
        status: 'active' as const,
        views: 5,
        favorites: 2,
        tags: ['test'],
        categories: ['cyber']
      };
      
      const transaction = {
        id: 'tx-1',
        listingId: 'listing-1',
        intelReportId: 'report-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        price: 1000,
        status: 'completed' as const,
        createdAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T01:00:00Z',
        transferMethod: 'direct' as const
      };
      
      marketplaceDB.createListing(listing);
      marketplaceDB.createTransaction(transaction);
    });

    it('should generate marketplace statistics correctly', () => {
      const stats = marketplaceDB.getMarketplaceStats();
      
      expect(stats.totalListings).toBe(1);
      expect(stats.activeListings).toBe(1);
      expect(stats.totalTransactions).toBe(1);
      expect(stats.completedTransactions).toBe(1);
      expect(stats.totalVolume).toBe(1000);
      expect(stats.averagePrice).toBe(1000);
    });
  });
});
