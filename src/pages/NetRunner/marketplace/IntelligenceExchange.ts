/**
 * IntelligenceExchange.ts
 * 
 * This module defines the Intelligence Exchange Marketplace where Intel Reports
 * can be traded as commodities.
 */

import { v4 as uuidv4 } from 'uuid';
import { IntelReport, ClassificationLevel, VerificationLevel } from '../models/IntelReport';
import { IntelType } from '../tools/NetRunnerPowerTools';
import { marketplaceDB } from './MarketplaceDatabaseService';

// Market listing status
export type ListingStatus = 
  | 'active'          // Currently listed and available
  | 'pending'         // Pending review or approval
  | 'sold'            // Sold but not yet delivered
  | 'completed'       // Transaction completed
  | 'cancelled'       // Listing cancelled
  | 'expired';        // Listing expired

// Pricing model
export type PricingModel = 
  | 'fixed'           // Fixed price
  | 'auction'         // Auction-based
  | 'tiered'          // Tiered pricing
  | 'subscription';   // Subscription-based

// Intel Report listing on the marketplace
export interface IntelListingEntry {
  id: string;
  intelReportId: string;
  title: string;
  summary: string;
  previewContent?: string;
  classification: ClassificationLevel;
  verificationLevel: VerificationLevel;
  intelTypes: IntelType[];
  createdAt: string;           // ISO date string
  listedAt: string;            // ISO date string
  expiresAt?: string;          // ISO date string
  price: number;
  pricingModel: PricingModel;
  sellerId: string;
  sellerName: string;
  sellerRating: number;        // 0-5 rating
  status: ListingStatus;
  views: number;
  favorites: number;
  tags: string[];
  categories: string[];
}

// Marketplace transaction
export interface IntelTransaction {
  id: string;
  listingId: string;
  intelReportId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;           // ISO date string
  completedAt?: string;        // ISO date string
  transferMethod: 'direct' | 'escrow';
  escrowId?: string;
  notes?: string;
}

// Market metrics
export interface MarketMetrics {
  totalListings: number;
  activeListings: number;
  completedTransactions: number;
  disputedTransactions: number;
  totalVolume: number;         // Total trading volume
  averagePrice: number;
  topCategories: Array<{category: string, count: number}>;
  topSellers: Array<{sellerId: string, sellerName: string, volume: number}>;
  recentTransactions: number;  // Last 24 hours
  updateTime: string;          // ISO date string
}

// Marketplace filter
export interface MarketFilter {
  intelTypes?: IntelType[];
  minVerification?: VerificationLevel;
  maxClassification?: ClassificationLevel;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  tags?: string[];
  categories?: string[];
  sortBy?: 'price' | 'date' | 'rating' | 'popularity';
  sortDirection?: 'asc' | 'desc';
}

// Sample marketplace listings
export const sampleListings: IntelListingEntry[] = [
  {
    id: uuidv4(),
    intelReportId: uuidv4(),
    title: 'Critical Infrastructure Vulnerability Report',
    summary: 'Comprehensive analysis of vulnerabilities in energy sector SCADA systems',
    classification: 'CONFIDENTIAL',
    verificationLevel: 'CONFIRMED',
    intelTypes: ['vulnerability', 'infrastructure'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    listedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    price: 750,
    pricingModel: 'fixed',
    sellerId: 'agent-007',
    sellerName: 'CyberSentinel',
    sellerRating: 4.8,
    status: 'active',
    views: 127,
    favorites: 15,
    tags: ['energy', 'scada', 'vulnerabilities', 'critical-infrastructure'],
    categories: ['infrastructure', 'vulnerability-assessment']
  },
  {
    id: uuidv4(),
    intelReportId: uuidv4(),
    title: 'Emerging Threat Actor Profile: BlackMirror Group',
    summary: 'Detailed profile of newly identified APT group targeting financial institutions',
    classification: 'SECRET',
    verificationLevel: 'MULTI_SOURCE',
    intelTypes: ['threat', 'identity'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    listedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1200,
    pricingModel: 'fixed',
    sellerId: 'shadow-intel',
    sellerName: 'ShadowIntel',
    sellerRating: 4.5,
    status: 'active',
    views: 85,
    favorites: 21,
    tags: ['apt', 'threat-actor', 'financial', 'banking'],
    categories: ['threat-intelligence', 'actor-profile']
  },
  {
    id: uuidv4(),
    intelReportId: uuidv4(),
    title: 'Social Engineering Campaign Analysis: Operation PhishNet',
    summary: 'Analysis of sophisticated phishing campaign targeting government agencies',
    classification: 'CONFIDENTIAL',
    verificationLevel: 'CONFIRMED',
    intelTypes: ['social', 'threat'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    listedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    price: 550,
    pricingModel: 'fixed',
    sellerId: 'threat-watcher',
    sellerName: 'ThreatWatcher',
    sellerRating: 4.2,
    status: 'active',
    views: 64,
    favorites: 9,
    tags: ['phishing', 'social-engineering', 'government', 'campaign'],
    categories: ['threat-intelligence', 'campaign-analysis']
  },
  {
    id: uuidv4(),
    intelReportId: uuidv4(),
    title: 'Digital Currency Laundering Networks',
    summary: 'Mapping of cryptocurrency laundering networks connected to ransomware operations',
    classification: 'TOP_SECRET',
    verificationLevel: 'VALIDATED',
    intelTypes: ['financial', 'network'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    listedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1800,
    pricingModel: 'fixed',
    sellerId: 'crypto-tracker',
    sellerName: 'CryptoTracker',
    sellerRating: 4.9,
    status: 'active',
    views: 112,
    favorites: 32,
    tags: ['cryptocurrency', 'ransomware', 'money-laundering', 'blockchain'],
    categories: ['financial-intelligence', 'criminal-networks']
  },
  {
    id: uuidv4(),
    intelReportId: uuidv4(),
    title: 'Dark Web Forum Intelligence: DeepShadow',
    summary: 'Intelligence gathered from exclusive dark web forum focused on zero-day exploits',
    classification: 'SECRET',
    verificationLevel: 'SINGLE_SOURCE',
    intelTypes: ['darkweb', 'vulnerability'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    listedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    price: 950,
    pricingModel: 'fixed',
    sellerId: 'dark-observer',
    sellerName: 'DarkObserver',
    sellerRating: 4.6,
    status: 'active',
    views: 73,
    favorites: 17,
    tags: ['dark-web', 'forum', 'zero-day', 'exploits'],
    categories: ['dark-web-intelligence', 'vulnerability-research']
  }
];

// Function to get current market metrics
export function getCurrentMarketMetrics(): MarketMetrics {
  const allListings = marketplaceDB.searchListings({});
  const activeListings = allListings.filter(l => l.status === 'active');
  
  return {
    totalListings: allListings.length,
    activeListings: activeListings.length,
    completedTransactions: 127,
    disputedTransactions: 3,
    totalVolume: 156750,
    averagePrice: allListings.length > 0 ? allListings.reduce((sum, l) => sum + l.price, 0) / allListings.length : 0,
    topCategories: [
      { category: 'threat-intelligence', count: 45 },
      { category: 'vulnerability-assessment', count: 38 },
      { category: 'dark-web-intelligence', count: 22 }
    ],
    topSellers: [
      { sellerId: 'crypto-tracker', sellerName: 'CryptoTracker', volume: 42500 },
      { sellerId: 'shadow-intel', sellerName: 'ShadowIntel', volume: 38750 },
      { sellerId: 'threat-watcher', sellerName: 'ThreatWatcher', volume: 25200 }
    ],
    recentTransactions: 8,
    updateTime: new Date().toISOString()
  };
}

// Initial market metrics (for backwards compatibility)
export const initialMarketMetrics: MarketMetrics = getCurrentMarketMetrics();

// Function to create a marketplace listing from an Intel Report
export const createMarketListing = (
  intelReport: IntelReport,
  price: number,
  sellerId: string,
  sellerName: string,
  sellerRating: number,
  pricingModel: PricingModel = 'fixed',
  expiresInDays: number = 30
): IntelListingEntry => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
  
  return {
    id: uuidv4(),
    intelReportId: intelReport.id,
    title: intelReport.title,
    summary: intelReport.summary,
    previewContent: intelReport.content.length > 0 ? intelReport.content[0].content.substring(0, 200) + '...' : undefined,
    classification: intelReport.classification,
    verificationLevel: intelReport.verificationLevel,
    intelTypes: intelReport.intelTypes,
    createdAt: intelReport.createdAt,
    listedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    price,
    pricingModel,
    sellerId,
    sellerName,
    sellerRating,
    status: 'active',
    views: 0,
    favorites: 0,
    tags: intelReport.tags,
    categories: intelReport.categories
  };
};

// Function to create a transaction when a listing is purchased
export const createTransaction = (
  listing: IntelListingEntry,
  buyerId: string,
  transferMethod: 'direct' | 'escrow' = 'direct'
): IntelTransaction => {
  return {
    id: uuidv4(),
    listingId: listing.id,
    intelReportId: listing.intelReportId,
    buyerId,
    sellerId: listing.sellerId,
    price: listing.price,
    status: 'pending',
    createdAt: new Date().toISOString(),
    transferMethod
  };
};

// Filter marketplace listings
export const filterListings = (
  listings: IntelListingEntry[],
  filter: MarketFilter
): IntelListingEntry[] => {
  return listings.filter(listing => {
    // Filter by intel types
    if (filter.intelTypes && filter.intelTypes.length > 0) {
      if (!filter.intelTypes.some(type => listing.intelTypes.includes(type))) {
        return false;
      }
    }
    
    // Filter by verification level
    if (filter.minVerification) {
      const verificationLevels: VerificationLevel[] = ['UNVERIFIED', 'SINGLE_SOURCE', 'MULTI_SOURCE', 'CONFIRMED', 'VALIDATED'];
      const minIndex = verificationLevels.indexOf(filter.minVerification);
      const listingIndex = verificationLevels.indexOf(listing.verificationLevel);
      if (listingIndex < minIndex) {
        return false;
      }
    }
    
    // Filter by classification level
    if (filter.maxClassification) {
      const classificationLevels: ClassificationLevel[] = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET', 'COSMIC'];
      const maxIndex = classificationLevels.indexOf(filter.maxClassification);
      const listingIndex = classificationLevels.indexOf(listing.classification);
      if (listingIndex > maxIndex) {
        return false;
      }
    }
    
    // Filter by price range
    if (filter.minPrice !== undefined && listing.price < filter.minPrice) {
      return false;
    }
    if (filter.maxPrice !== undefined && listing.price > filter.maxPrice) {
      return false;
    }
    
    // Filter by seller
    if (filter.sellerId && listing.sellerId !== filter.sellerId) {
      return false;
    }
    
    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      if (!filter.tags.some(tag => listing.tags.includes(tag))) {
        return false;
      }
    }
    
    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.some(category => listing.categories.includes(category))) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by specified criteria
    if (filter.sortBy === 'price') {
      return filter.sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
    } else if (filter.sortBy === 'date') {
      return filter.sortDirection === 'asc' 
        ? new Date(a.listedAt).getTime() - new Date(b.listedAt).getTime()
        : new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
    } else if (filter.sortBy === 'rating') {
      return filter.sortDirection === 'asc' ? a.sellerRating - b.sellerRating : b.sellerRating - a.sellerRating;
    } else if (filter.sortBy === 'popularity') {
      const aPopularity = a.views + (a.favorites * 3);
      const bPopularity = b.views + (b.favorites * 3);
      return filter.sortDirection === 'asc' ? aPopularity - bPopularity : bPopularity - aPopularity;
    }
    
    // Default sort by date, newest first
    return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
  });
};

// Initialize marketplace database with sample data
export function initializeMarketplaceData(): void {
  // Check if data is already initialized
  const existingListings = marketplaceDB.searchListings({});
  if (existingListings.length > 0) {
    return; // Data already exists
  }

  // Add sample listings to the database
  sampleListings.forEach(listing => {
    marketplaceDB.createListing(listing);
  });

  console.log(`Initialized marketplace database with ${sampleListings.length} sample listings`);
}

// Auto-initialize on module load
initializeMarketplaceData();
