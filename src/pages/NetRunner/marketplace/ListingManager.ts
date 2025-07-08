/**
 * ListingManager.ts
 * 
 * This module provides functionality for managing Intelligence Exchange marexport function export function deleteListing(listingId: string): boolean {
  return marketplaceDB.deleteListing(listingId);
}geListingStatus(
  listingId: string,
  status: ListingStatus
): boolean {
  return marketplaceDB.updateListing(listingId, { status });
}e listings,
 * including creating, updating, and deleting listings.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  IntelListingEntry, 
  ListingStatus, 
  PricingModel
} from './IntelligenceExchange';
import { IntelReport } from '../models/IntelReport';
import { marketplaceDB } from './MarketplaceDatabaseService';

// Current user info (would normally come from auth system)
const currentUser = {
  id: 'current-user-id',
  name: 'NetRunner',
  rating: 4.3
};

/**
 * Create a new marketplace listing from an intelligence report
 */
export function createListing(
  report: IntelReport,
  listingData: {
    price: number;
    pricingModel: PricingModel;
    summary?: string;
    previewContent?: string;
    expiresAt?: string;
    tags?: string[];
    categories?: string[];
  }
): IntelListingEntry {
  const now = new Date().toISOString();
  
  // Create the listing
  const listing: IntelListingEntry = {
    id: uuidv4(),
    intelReportId: report.id,
    title: report.title,
    summary: listingData.summary || report.summary,
    previewContent: listingData.previewContent,
    classification: report.classification,
    verificationLevel: report.verificationLevel,
    intelTypes: report.intelTypes,
    createdAt: report.createdAt,
    listedAt: now,
    expiresAt: listingData.expiresAt,
    price: listingData.price,
    pricingModel: listingData.pricingModel,
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    sellerRating: currentUser.rating,
    status: 'active',
    views: 0,
    favorites: 0,
    tags: listingData.tags || report.tags,
    categories: listingData.categories || []
  };
  
  // Save listing to database
  const saveResult = marketplaceDB.createListing(listing);
  
  if (!saveResult) {
    throw new Error('Failed to create listing in database');
  }
  
  return listing;
}

/**
 * Update an existing marketplace listing
 */
export function updateListing(
  listingId: string,
  listingData: Partial<IntelListingEntry>
): IntelListingEntry | null {
  // Get existing listing from database
  const existingListing = marketplaceDB.getListing(listingId);
  
  if (!existingListing) {
    return null;
  }
  
  // Update the listing in database
  const updateResult = marketplaceDB.updateListing(listingId, listingData);
  
  if (!updateResult) {
    return null;
  }
  
  // Return updated listing
  return marketplaceDB.getListing(listingId);
}

/**
 * Change the status of a listing
 */
export function changeListingStatus(
  listingId: string,
  status: ListingStatus
): boolean {
  return marketplaceDB.updateListing(listingId, { status });
}

/**
 * Delete a listing from the marketplace
 */
export function deleteListing(listingId: string): boolean {
  return marketplaceDB.deleteListing(listingId);
}

/**
 * Get a user's active listings
 */
export function getUserListings(userId: string = currentUser.id): IntelListingEntry[] {
  // Get all listings and filter by user ID
  const allListings = marketplaceDB.searchListings({});
  return allListings.filter(listing => listing.sellerId === userId);
}

/**
 * Get a listing by ID
 */
export function getListingById(listingId: string): IntelListingEntry | null {
  return marketplaceDB.getListing(listingId);
}
