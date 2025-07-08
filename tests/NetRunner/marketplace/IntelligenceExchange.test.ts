import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  IntelligenceExchange,
  ListingManager,
  TransactionService,
  TokenizationService,
  IntelListingEntry,
  IntelTransaction,
  ListingStatus,
  PricingModel
} from '../../../../src/pages/NetRunner/marketplace/IntelligenceExchange';
import { v4 as uuidv4 } from 'uuid';
import { IntelReport, ClassificationLevel, VerificationLevel } from '../../../../src/pages/NetRunner/models/IntelReport';

// Mock UUID for predictable testing
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

describe('IntelligenceExchange', () => {
  let intelligenceExchange: IntelligenceExchange;
  let listingManager: ListingManager;
  let transactionService: TransactionService;
  let tokenizationService: TokenizationService;
  
  // Sample report for testing
  const sampleReport: IntelReport = {
    id: 'report-123',
    title: 'Test Intel Report',
    summary: 'A test intelligence report',
    content: 'This is a test intelligence report with detailed content.',
    author: 'test-user',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    classification: 'unclassified' as ClassificationLevel,
    verificationLevel: 'verified' as VerificationLevel,
    sources: ['test-source-1', 'test-source-2'],
    entities: [{ id: 'entity-1', type: 'person', name: 'Test Person', identifiers: {} }],
    intelTypes: ['identity', 'social'],
    tags: ['test', 'sample'],
    attachments: [],
    metadata: {}
  };
  
  beforeEach(() => {
    // Reset services before each test
    tokenizationService = new TokenizationService();
    transactionService = new TransactionService();
    listingManager = new ListingManager();
    intelligenceExchange = new IntelligenceExchange();
  });
  
  test('should create a new listing', () => {
    const listingData = {
      intelReportId: sampleReport.id,
      title: 'Test Listing',
      summary: 'A test intelligence listing',
      previewContent: 'Preview of the intelligence report...',
      classification: sampleReport.classification,
      verificationLevel: sampleReport.verificationLevel,
      intelTypes: sampleReport.intelTypes,
      price: 100,
      pricingModel: 'fixed' as PricingModel,
      sellerId: 'seller-123',
      sellerName: 'Test Seller',
      tags: ['test', 'sample'],
      categories: ['osint', 'identity']
    };
    
    const listing = listingManager.createListing(listingData);
    
    expect(listing).toBeDefined();
    expect(listing.id).toBe('mock-uuid');
    expect(listing.intelReportId).toBe(sampleReport.id);
    expect(listing.title).toBe('Test Listing');
    expect(listing.status).toBe('active');
    expect(listing.listedAt).toBeDefined();
    expect(listing.views).toBe(0);
    expect(listing.favorites).toBe(0);
  });
  
  test('should retrieve listings by seller', () => {
    // Create multiple listings
    const seller1 = 'seller-123';
    const seller2 = 'seller-456';
    
    const listing1Data = {
      intelReportId: 'report-1',
      title: 'Listing 1',
      summary: 'Listing 1 summary',
      classification: 'unclassified' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['identity'],
      price: 100,
      pricingModel: 'fixed' as PricingModel,
      sellerId: seller1,
      sellerName: 'Seller 1',
      tags: ['test'],
      categories: ['osint']
    };
    
    const listing2Data = {
      intelReportId: 'report-2',
      title: 'Listing 2',
      summary: 'Listing 2 summary',
      classification: 'unclassified' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['social'],
      price: 200,
      pricingModel: 'fixed' as PricingModel,
      sellerId: seller1,
      sellerName: 'Seller 1',
      tags: ['test'],
      categories: ['osint']
    };
    
    const listing3Data = {
      intelReportId: 'report-3',
      title: 'Listing 3',
      summary: 'Listing 3 summary',
      classification: 'unclassified' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['network'],
      price: 300,
      pricingModel: 'fixed' as PricingModel,
      sellerId: seller2,
      sellerName: 'Seller 2',
      tags: ['test'],
      categories: ['osint']
    };
    
    listingManager.createListing(listing1Data);
    listingManager.createListing(listing2Data);
    listingManager.createListing(listing3Data);
    
    // Get listings by seller
    const seller1Listings = listingManager.getListingsBySeller(seller1);
    expect(seller1Listings).toHaveLength(2);
    expect(seller1Listings[0].title).toBe('Listing 1');
    expect(seller1Listings[1].title).toBe('Listing 2');
    
    const seller2Listings = listingManager.getListingsBySeller(seller2);
    expect(seller2Listings).toHaveLength(1);
    expect(seller2Listings[0].title).toBe('Listing 3');
  });
  
  test('should process a transaction', async () => {
    // Create a listing
    const listingData = {
      intelReportId: sampleReport.id,
      title: 'Transaction Test Listing',
      summary: 'A listing for transaction testing',
      classification: 'unclassified' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['identity'],
      price: 150,
      pricingModel: 'fixed' as PricingModel,
      sellerId: 'seller-123',
      sellerName: 'Test Seller',
      tags: ['test'],
      categories: ['osint']
    };
    
    const listing = listingManager.createListing(listingData);
    
    // Mock tokenization service
    tokenizationService.tokenizeIntel = vi.fn().mockResolvedValue({
      tokenId: 'token-123',
      ownershipProof: 'ownership-proof-123',
      transactionHash: 'tx-hash-123'
    });
    
    // Process transaction
    const transactionData = {
      listingId: listing.id,
      intelReportId: listing.intelReportId,
      buyerId: 'buyer-123',
      sellerId: listing.sellerId,
      price: listing.price
    };
    
    transactionService.tokenizationService = tokenizationService;
    const transaction = await transactionService.processTransaction(transactionData);
    
    expect(transaction).toBeDefined();
    expect(transaction.id).toBeDefined();
    expect(transaction.listingId).toBe(listing.id);
    expect(transaction.buyerId).toBe('buyer-123');
    expect(transaction.sellerId).toBe('seller-123');
    expect(transaction.price).toBe(150);
    expect(transaction.status).toBe('completed');
    expect(transaction.timestamp).toBeDefined();
    expect(transaction.tokenId).toBe('token-123');
    expect(transaction.transactionHash).toBe('tx-hash-123');
    
    // Verify tokenization was called
    expect(tokenizationService.tokenizeIntel).toHaveBeenCalledWith(listing.intelReportId, 'buyer-123');
    
    // Verify listing status was updated
    const updatedListing = listingManager.getListing(listing.id);
    expect(updatedListing?.status).toBe('completed');
  });
  
  test('should search listings by criteria', () => {
    // Create listings with different attributes
    const listing1Data = {
      intelReportId: 'report-1',
      title: 'Cyber Threat Intelligence',
      summary: 'Analysis of recent cyber threats',
      classification: 'restricted' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['threat', 'infrastructure'],
      price: 500,
      pricingModel: 'fixed' as PricingModel,
      sellerId: 'seller-1',
      sellerName: 'Security Analyst',
      tags: ['cyber', 'threat', 'security'],
      categories: ['threat-intel']
    };
    
    const listing2Data = {
      intelReportId: 'report-2',
      title: 'Financial Intelligence Report',
      summary: 'Analysis of financial transactions',
      classification: 'confidential' as ClassificationLevel,
      verificationLevel: 'verified' as VerificationLevel,
      intelTypes: ['financial'],
      price: 1000,
      pricingModel: 'tiered' as PricingModel,
      sellerId: 'seller-2',
      sellerName: 'Financial Analyst',
      tags: ['financial', 'transactions'],
      categories: ['financial-intel']
    };
    
    const listing3Data = {
      intelReportId: 'report-3',
      title: 'Social Media Analysis',
      summary: 'Analysis of social media presence',
      classification: 'unclassified' as ClassificationLevel,
      verificationLevel: 'partial' as VerificationLevel,
      intelTypes: ['social', 'identity'],
      price: 250,
      pricingModel: 'fixed' as PricingModel,
      sellerId: 'seller-3',
      sellerName: 'OSINT Specialist',
      tags: ['social', 'osint'],
      categories: ['social-intel']
    };
    
    listingManager.createListing(listing1Data);
    listingManager.createListing(listing2Data);
    listingManager.createListing(listing3Data);
    
    // Search by intel type
    const threatIntel = listingManager.searchListings({ intelTypes: ['threat'] });
    expect(threatIntel).toHaveLength(1);
    expect(threatIntel[0].title).toBe('Cyber Threat Intelligence');
    
    // Search by keyword in title
    const financialIntel = listingManager.searchListings({ keyword: 'Financial' });
    expect(financialIntel).toHaveLength(1);
    expect(financialIntel[0].title).toBe('Financial Intelligence Report');
    
    // Search by classification
    const unclassifiedIntel = listingManager.searchListings({ classification: 'unclassified' });
    expect(unclassifiedIntel).toHaveLength(1);
    expect(unclassifiedIntel[0].title).toBe('Social Media Analysis');
    
    // Search by price range
    const affordableIntel = listingManager.searchListings({ maxPrice: 300 });
    expect(affordableIntel).toHaveLength(1);
    expect(affordableIntel[0].title).toBe('Social Media Analysis');
    
    // Search by multiple criteria
    const socialIdentityIntel = listingManager.searchListings({ 
      intelTypes: ['social', 'identity'],
      maxPrice: 500 
    });
    expect(socialIdentityIntel).toHaveLength(1);
    expect(socialIdentityIntel[0].title).toBe('Social Media Analysis');
  });
});
