import { useState, useEffect, useCallback } from 'react'
import { gun, DecentralizedIntelReport } from '../lib/gun-db'
import { useWallet } from '@solana/wallet-adapter-react'

export function useDecentralizedIntel(teamId?: string) {
  const { publicKey, signMessage } = useWallet()
  const walletAddress = publicKey?.toString()
  
  const [reports, setReports] = useState<DecentralizedIntelReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Submit intel report
  const submitReport = useCallback(async (
    reportData: Omit<DecentralizedIntelReport, 'id' | 'author' | 'timestamp' | 'signature' | 'reviews'>
  ) => {
    if (!walletAddress || !signMessage) {
      setError('Wallet not connected or does not support signing')
      return
    }

    try {
      setError(null)
      
      // Create report
      const report: Omit<DecentralizedIntelReport, 'signature'> = {
        ...reportData,
        id: `${Date.now()}-${Math.random()}`,
        author: {
          address: walletAddress,
          username: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
        },
        timestamp: Date.now(),
        reviews: []
      }

      // Create message to sign
      const messageToSign = JSON.stringify({
        title: report.title,
        content: report.content,
        timestamp: report.timestamp,
        author: report.author.address
      })
      
      // Sign the report for authenticity
      const encoder = new TextEncoder()
      const data = encoder.encode(messageToSign)
      
      let signature: string
      try {
        const signedMessage = await signMessage(data)
        signature = Array.from(signedMessage).map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (err) {
        console.error('Failed to sign message:', err)
        signature = 'unsigned-' + Date.now() // Fallback for demo
      }

      const finalReport: DecentralizedIntelReport = {
        ...report,
        signature
      }

      // Store in Gun.js
      const channelId = teamId ? `team-intel-${teamId}` : 'global-intel'
      gun.get('starcom-intel')
        .get(channelId)
        .get(finalReport.id)
        .put(finalReport)

      // Store cross-references
      for (const refId of finalReport.crossReferences) {
        gun.get('starcom-intel-refs')
          .get(refId)
          .get(finalReport.id)
          .put(true)
      }

      return finalReport
    } catch (error) {
      console.error('Failed to submit report:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit report')
      throw error
    }
  }, [walletAddress, signMessage, teamId])

  // Add review to report
  const reviewReport = useCallback(async (
    reportId: string,
    rating: number,
    comments: string
  ) => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      
      const review = {
        reviewerAddress: walletAddress,
        rating,
        comments,
        timestamp: Date.now()
      }

      const channelId = teamId ? `team-intel-${teamId}` : 'global-intel'
      gun.get('starcom-intel')
        .get(channelId)
        .get(reportId)
        .get('reviews')
        .set(review)
    } catch (error) {
      console.error('Failed to submit review:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit review')
      throw error
    }
  }, [walletAddress, teamId])

  // Cross-reference reports
  const crossReference = useCallback(async (reportId: string, relatedReportIds: string[]) => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      
      const channelId = teamId ? `team-intel-${teamId}` : 'global-intel'
      
      // Get current report
      const reportRef = gun.get('starcom-intel').get(channelId).get(reportId)
      
      // This is a simplified approach - in production you'd want to handle concurrent updates
      reportRef.once((currentReport: unknown) => {
        if (currentReport && typeof currentReport === 'object' && 'crossReferences' in currentReport) {
          const report = currentReport as DecentralizedIntelReport
          const updatedRefs = Array.from(new Set([
            ...(report.crossReferences || []),
            ...relatedReportIds
          ]))

          reportRef.get('crossReferences').put(updatedRefs)
        }
      })

      // Update related reports to reference back
      for (const relatedId of relatedReportIds) {
        const relatedRef = gun.get('starcom-intel').get(channelId).get(relatedId)
        relatedRef.once((relatedReport: unknown) => {
          if (relatedReport && typeof relatedReport === 'object' && 'crossReferences' in relatedReport) {
            const report = relatedReport as DecentralizedIntelReport
            const relatedRefs = Array.from(new Set([
              ...(report.crossReferences || []),
              reportId
            ]))
            relatedRef.get('crossReferences').put(relatedRefs)
          }
        })
      }

    } catch (error) {
      console.error('Failed to cross-reference reports:', error)
      setError(error instanceof Error ? error.message : 'Failed to cross-reference reports')
      throw error
    }
  }, [walletAddress, teamId])

  // Load intel reports
  useEffect(() => {
    if (!walletAddress) return

    setLoading(true)
    setError(null)
    
    const reportsMap = new Map<string, DecentralizedIntelReport>()
    const channelId = teamId ? `team-intel-${teamId}` : 'global-intel'

    // Subscribe to reports
    gun.get('starcom-intel')
      .get(channelId)
      .map()
      .on((data: unknown) => {
        if (data && typeof data === 'object' && 'id' in data) {
          const report = data as DecentralizedIntelReport
          if (report.id && report.author && report.title && report.content) {
            // Subscribe to reviews for this report
            gun.get('starcom-intel')
              .get(channelId)
              .get(report.id)
              .get('reviews')
              .map()
              .on((review: unknown) => {
                if (review && typeof review === 'object' && 'reviewerAddress' in review) {
                  const reviewData = review as DecentralizedIntelReport['reviews'][0]
                  const currentReport = reportsMap.get(report.id)
                  if (currentReport) {
                    const updatedReport = {
                      ...currentReport,
                      reviews: [
                        ...currentReport.reviews.filter(r => 
                          r.reviewerAddress !== reviewData.reviewerAddress
                        ), 
                        reviewData
                      ]
                    }
                    reportsMap.set(report.id, updatedReport)
                    setReports(Array.from(reportsMap.values()).sort((a, b) => b.timestamp - a.timestamp))
                  }
                }
              })

            reportsMap.set(report.id, report)
            setReports(Array.from(reportsMap.values()).sort((a, b) => b.timestamp - a.timestamp))
          }
        }
      })

    setLoading(false)

    return () => {
      // Gun.js automatically handles cleanup
    }
  }, [walletAddress, teamId])

  // Verify report signature (basic verification)
  const verifyReport = useCallback(async (report: DecentralizedIntelReport): Promise<boolean> => {
    try {
      // In a real implementation, you'd verify the signature against the public key
      // For now, we'll just check if signature exists and looks valid
      return report.signature && report.signature.length > 10 && !report.signature.startsWith('unsigned-')
    } catch (error) {
      console.error('Failed to verify signature:', error)
      return false
    }
  }, [])

  return {
    reports,
    loading,
    error,
    submitReport,
    reviewReport,
    crossReference,
    verifyReport
  }
}

// AI-NOTE: This hook provides decentralized intel report functionality
// - Gun.js for persistent storage and real-time sync
// - Wallet signatures for authenticity
// - IPFS for evidence file storage (handled in UI components)
// - Cross-referencing system for related reports
