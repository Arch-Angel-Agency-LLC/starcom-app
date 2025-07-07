import React, { useState } from 'react'
import { DecentralizedIntelReport } from '../../lib/gun-db'
import styles from './DecentralizedIntelDetail.module.css'

interface DecentralizedIntelDetailProps {
  report: DecentralizedIntelReport
  onClose: () => void
  onReview?: (reportId: string, rating: number, comments: string) => Promise<void>
  onVerify?: (reportId: string) => Promise<void>
}

export default function DecentralizedIntelDetail({
  report,
  onClose,
  onReview,
  onVerify
}: DecentralizedIntelDetailProps) {
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'reviews' | 'evidence'>('content')

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString(undefined, {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Submit a review
  const handleSubmitReview = async () => {
    if (!onReview) return
    
    if (!reviewComment.trim()) {
      setReviewError('Review comment is required')
      return
    }
    
    setIsSubmittingReview(true)
    setReviewError(null)
    
    try {
      await onReview(report.id, reviewRating, reviewComment)
      setReviewComment('')
      setReviewRating(5)
    } catch (error) {
      console.error('Failed to submit review:', error)
      setReviewError('Failed to submit review. Please try again.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Verify report authenticity
  const handleVerify = async () => {
    if (!onVerify) return
    
    try {
      await onVerify(report.id)
    } catch (error) {
      console.error('Failed to verify report:', error)
    }
  }

  // Open IPFS evidence
  const openIPFSLink = (ipfsHash: string) => {
    // Try multiple IPFS gateways for better reliability
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ]
    
    // Open in new tab
    window.open(gateways[0] + ipfsHash, '_blank')
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className={styles.classification}>
            {report.classification}
          </div>
          <h2 className={styles.title}>{report.title}</h2>
          <div className={styles.metadata}>
            <span className={styles.author}>
              By: {report.author.username}
            </span>
            <span className={styles.timestamp}>
              {formatTimestamp(report.timestamp)}
            </span>
          </div>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Report Content
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'evidence' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence ({report.evidence.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({report.reviews.length})
          </button>
        </div>

        <div className={styles.contentWrapper}>
          {activeTab === 'content' && (
            <div className={styles.content}>
              <div className={styles.reportContent}>
                {report.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              
              {report.tags.length > 0 && (
                <div className={styles.tags}>
                  {report.tags.map(tag => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {report.location && (
                <div className={styles.locationInfo}>
                  <h3>Location Information</h3>
                  <p>
                    {report.location.name || 'Unnamed Location'} 
                    ({report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)})
                  </p>
                </div>
              )}
              
              {report.crossReferences.length > 0 && (
                <div className={styles.crossReferences}>
                  <h3>Cross References</h3>
                  <ul className={styles.refList}>
                    {report.crossReferences.map(ref => (
                      <li key={ref} className={styles.refItem}>
                        Report ID: {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className={styles.verificationInfo}>
                <h3>Verification</h3>
                <div className={styles.signatureInfo}>
                  <span className={styles.signatureLabel}>Signature:</span>
                  <code className={styles.signature}>
                    {report.signature.slice(0, 20)}...{report.signature.slice(-20)}
                  </code>
                </div>
                {onVerify && (
                  <button 
                    className={styles.verifyButton}
                    onClick={handleVerify}
                  >
                    Verify Authenticity
                  </button>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'evidence' && (
            <div className={styles.evidenceTab}>
              <h3>Attached Evidence</h3>
              {report.evidence.length === 0 ? (
                <p className={styles.noContent}>No evidence attached to this report.</p>
              ) : (
                <div className={styles.evidenceList}>
                  {report.evidence.map((ev, index) => (
                    <div key={index} className={styles.evidenceItem}>
                      <div className={styles.evidenceHeader}>
                        <span className={styles.evidenceNumber}>Evidence #{index + 1}</span>
                        <button 
                          className={styles.viewButton}
                          onClick={() => openIPFSLink(ev.ipfsHash)}
                        >
                          View on IPFS
                        </button>
                      </div>
                      <p className={styles.evidenceDescription}>{ev.description}</p>
                      <div className={styles.ipfsInfo}>
                        <span className={styles.ipfsLabel}>IPFS Hash:</span>
                        <code className={styles.ipfsHash}>{ev.ipfsHash}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className={styles.reviewsTab}>
              <h3>Peer Reviews</h3>
              
              {report.reviews.length === 0 ? (
                <p className={styles.noContent}>No reviews yet. Be the first to review this intel.</p>
              ) : (
                <div className={styles.reviewsList}>
                  {report.reviews.map((review, index) => (
                    <div key={index} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={`${styles.star} ${i < review.rating ? styles.filledStar : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className={styles.reviewTimestamp}>
                          {formatTimestamp(review.timestamp)}
                        </span>
                      </div>
                      <p className={styles.reviewerAddress}>
                        Reviewer: {review.reviewerAddress.slice(0, 6)}...{review.reviewerAddress.slice(-4)}
                      </p>
                      <p className={styles.reviewComment}>{review.comments}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {onReview && (
                <div className={styles.addReview}>
                  <h4>Add Your Review</h4>
                  
                  <div className={styles.ratingSelect}>
                    <span className={styles.ratingLabel}>Rating:</span>
                    <div className={styles.starRating}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`${styles.starButton} ${i < reviewRating ? styles.selectedStar : ''}`}
                          onClick={() => setReviewRating(i + 1)}
                          aria-label={`${i + 1} stars`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <textarea
                    className={styles.reviewTextarea}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your assessment of this intelligence..."
                    rows={4}
                  />
                  
                  {reviewError && (
                    <p className={styles.reviewError}>{reviewError}</p>
                  )}
                  
                  <button
                    className={styles.submitReviewButton}
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// AI-NOTE: This component provides detailed view of decentralized intel reports
// - Displays content, evidence, reviews
// - Supports verification and review functionality
// - Works with IPFS for evidence retrieval
// - Fully decentralized, no server dependencies
