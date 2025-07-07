import React, { useState } from 'react'
import { DecentralizedIntelReport } from '../../lib/gun-db'
import styles from './DecentralizedIntelList.module.css'

interface DecentralizedIntelListProps {
  reports: DecentralizedIntelReport[]
  loading: boolean
  error: string | null
  onReview: (reportId: string, rating: number, comments: string) => Promise<void>
  onVerify: (report: DecentralizedIntelReport) => Promise<boolean>
}

export default function DecentralizedIntelList({
  reports,
  loading,
  error,
  onVerify
}: DecentralizedIntelListProps) {
  const [selectedReport, setSelectedReport] = useState<DecentralizedIntelReport | null>(null)
  const [verifiedReports, setVerifiedReports] = useState<Set<string>>(new Set())

  const handleVerify = async (report: DecentralizedIntelReport) => {
    const isVerified = await onVerify(report)
    if (isVerified) {
      setVerifiedReports(prev => new Set(prev).add(report.id))
    }
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'TOP_SECRET': return styles.classTopSecret
      case 'SECRET': return styles.classSecret
      case 'CONFIDENTIAL': return styles.classConfidential
      default: return styles.classUnclassified
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading decentralized intel reports...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <div className={styles.reportsList}>
        {reports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3>No intel reports yet</h3>
            <p>Submit the first intelligence report to get started. All reports are stored decentralized and cryptographically signed.</p>
          </div>
        ) : (
          reports.map((report) => {
            const avgRating = report.reviews.length > 0
              ? report.reviews.reduce((sum, r) => sum + r.rating, 0) / report.reviews.length
              : 0
            
            const isVerified = verifiedReports.has(report.id)

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={styles.reportCard}
              >
                <div className={styles.reportHeader}>
                  <div className={styles.reportTitle}>
                    <h3>{report.title}</h3>
                    {isVerified && (
                      <span className={styles.verifiedBadge}>✓ Verified</span>
                    )}
                  </div>
                  <div className={styles.reportBadges}>
                    <span className={`${styles.classificationBadge} ${getClassificationColor(report.classification)}`}>
                      {report.classification}
                    </span>
                  </div>
                </div>

                <p className={styles.reportContent}>
                  {report.content.length > 200 
                    ? report.content.slice(0, 200) + '...' 
                    : report.content
                  }
                </p>

                <div className={styles.reportMeta}>
                  <div className={styles.metaLeft}>
                    <span className={styles.author}>
                      By {report.author.username}
                    </span>
                    {avgRating > 0 && (
                      <span className={styles.rating}>
                        ⭐ {avgRating.toFixed(1)} ({report.reviews.length})
                      </span>
                    )}
                  </div>
                  <div className={styles.metaRight}>
                    {report.evidence.length > 0 && (
                      <span className={styles.evidence}>
                        📎 {report.evidence.length} evidence
                      </span>
                    )}
                    {report.crossReferences.length > 0 && (
                      <span className={styles.crossRefs}>
                        🔗 {report.crossReferences.length} linked
                      </span>
                    )}
                    <span className={styles.timestamp}>
                      {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {report.tags.length > 0 && (
                  <div className={styles.tags}>
                    {report.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                    {report.tags.length > 3 && (
                      <span className={styles.tagMore}>
                        +{report.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.reportActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVerify(report)
                    }}
                    className={styles.verifyButton}
                    disabled={isVerified}
                  >
                    {isVerified ? 'Verified' : 'Verify Signature'}
                  </button>
                  <span className={styles.signature}>
                    Sig: {report.signature.slice(0, 8)}...
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedReport && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>{selectedReport.title}</h3>
            <p>Detail view coming soon...</p>
            <button onClick={() => setSelectedReport(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

// AI-NOTE: This component displays the list of decentralized intel reports
// - Shows classification levels and verification status
// - Displays ratings and reviews from team members
// - Signature verification for authenticity
// - Evidence files stored on IPFS
