import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { realTimeTeamService } from '../../services/RealTimeTeamService';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
  investigations: string[];
  createdAt: string;
}

interface DiscoverableTeam extends Team {
  isPublic: boolean;
  memberCount: number;
  recentActivity: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userRole, setUserRole] = useState<'intern' | 'analyst' | 'lead' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [discoverableTeams, setDiscoverableTeams] = useState<DiscoverableTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentStep === 1) {
      loadDiscoverableTeams();
    }
  }, [currentStep]);

  const loadDiscoverableTeams = async () => {
    try {
      // Create mock discoverable teams for demo
      const mockDiscoverableTeams: DiscoverableTeam[] = [
        {
          id: 'alpha-squad',
          name: 'Alpha Squadron',
          description: 'Elite threat hunting and malware analysis specialists',
          members: ['alice-lead', 'bob-analyst'],
          investigations: ['inv-001', 'inv-002'],
          createdAt: new Date().toISOString(),
          isPublic: true,
          memberCount: 8,
          recentActivity: '12 minutes ago'
        },
        {
          id: 'beta-research',
          name: 'Beta Research Division', 
          description: 'Advanced persistent threat research and attribution',
          members: ['charlie-lead'],
          investigations: ['inv-003'],
          createdAt: new Date().toISOString(),
          isPublic: true,
          memberCount: 5,
          recentActivity: '35 minutes ago'
        },
        {
          id: 'gamma-response',
          name: 'Gamma Incident Response',
          description: 'Rapid incident response and digital forensics',
          members: ['diana-lead', 'eve-analyst'],
          investigations: ['inv-004', 'inv-005'],
          createdAt: new Date().toISOString(),
          isPublic: true,
          memberCount: 12,
          recentActivity: '3 minutes ago'
        }
      ];
      setDiscoverableTeams(mockDiscoverableTeams);
    } catch (error) {
      console.error('Failed to load discoverable teams:', error);
      setError('Failed to load available teams');
    }
  };

  const handleRoleSelection = (role: 'intern' | 'analyst' | 'lead') => {
    setUserRole(role);
    setCurrentStep(1);
  };

  const handleJoinWithInvite = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate team join via invite code
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // For demo purposes, check if it's a valid-looking invite code
      if (inviteCode.length < 6) {
        throw new Error('Invalid invite code');
      }

      // Navigate to teams page
      navigate('/teams');
      onDismiss();
    } catch {
      setError('Invalid invite code. Please check with your team lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPublicTeam = async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      await realTimeTeamService.joinTeam(teamId, { role: 'CYBER_ANALYST' });
      navigate(`/teams/${teamId}`);
      onDismiss();
    } catch {
      setError('Failed to join team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    navigate('/teams');
    onDismiss();
  };

  const handleSkipOnboarding = () => {
    navigate('/teams');
    onDismiss();
  };

  const steps = [
    // Step 0: Role Selection
    {
      title: "Welcome to STARCOM",
      subtitle: "Secure Threat Analysis & Response Command",
      content: (
        <div className={styles.roleSelection}>
          <p className={styles.subtitle}>
            Choose your role to get started with cyber investigation teams
          </p>
          <div className={styles.roleButtons}>
            <button 
              className={styles.roleButton}
              onClick={() => handleRoleSelection('intern')}
            >
              <div className={styles.roleIcon}>🎓</div>
              <div className={styles.roleInfo}>
                <h3>Intern / New Analyst</h3>
                <p>New to cyber investigations, looking to join a team and learn</p>
              </div>
            </button>
            <button 
              className={styles.roleButton}
              onClick={() => handleRoleSelection('analyst')}
            >
              <div className={styles.roleIcon}>🔍</div>
              <div className={styles.roleInfo}>
                <h3>Cyber Analyst</h3>
                <p>Experienced investigator, ready to collaborate on cases</p>
              </div>
            </button>
            <button 
              className={styles.roleButton}
              onClick={() => handleRoleSelection('lead')}
            >
              <div className={styles.roleIcon}>�</div>
              <div className={styles.roleInfo}>
                <h3>Team Lead</h3>
                <p>Ready to create and manage investigation teams</p>
              </div>
            </button>
          </div>
        </div>
      )
    },
    // Step 1: Team Discovery
    {
      title: userRole === 'lead' ? 'Create Your Team' : 'Join a Team',
      subtitle: userRole === 'lead' ? 'Set up your investigation team' : 'Find your team and get access to group chat',
      content: (
        <div className={styles.teamDiscovery}>
          {userRole === 'lead' ? (
            <div className={styles.createTeamPrompt}>
              <p>As a team lead, you can create new investigation teams and invite members.</p>
              <button 
                className={styles.primaryButton}
                onClick={handleCreateTeam}
              >
                Go to Team Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className={styles.joinOptions}>
                <div className={styles.joinSection}>
                  <h3>🎫 Have an invite code?</h3>
                  <p>If your team lead gave you an invite code, enter it here to join and access team chat:</p>
                  <div className={styles.inviteForm}>
                    <input
                      type="text"
                      placeholder="Enter invite code (e.g., ALPHA-2024-X7K9)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className={styles.inviteInput}
                    />
                    <button 
                      className={styles.joinButton}
                      onClick={handleJoinWithInvite}
                      disabled={loading}
                    >
                      {loading ? 'Joining...' : 'Join Team'}
                    </button>
                  </div>
                </div>

                <div className={styles.divider}>OR</div>

                <div className={styles.joinSection}>
                  <h3>🌐 Browse Active Teams</h3>
                  <p>Join an active investigation team and get immediate access to their chat:</p>
                  <div className={styles.teamList}>
                    {discoverableTeams.slice(0, 3).map((team) => (
                      <div key={team.id} className={styles.teamCard}>
                        <div className={styles.teamInfo}>
                          <h4>{team.name}</h4>
                          <p>{team.description}</p>
                          <div className={styles.teamMeta}>
                            <span>👥 {team.memberCount} members</span>
                            <span>💬 Active {team.recentActivity}</span>
                          </div>
                        </div>
                        <button 
                          className={styles.joinTeamButton}
                          onClick={() => handleJoinPublicTeam(team.id)}
                          disabled={loading}
                        >
                          Join & Chat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.skipOption}>
            <button 
              className={styles.skipButton}
              onClick={handleSkipOnboarding}
            >
              Browse all teams instead
            </button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={styles.welcomeOverlay}>
      <div className={styles.welcomeModal}>
        <div className={styles.header}>
          <button 
            className={styles.closeButton}
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <h2 className={styles.title}>{steps[currentStep].title}</h2>
          <p className={styles.subtitle}>{steps[currentStep].subtitle}</p>
          
          {steps[currentStep].content}
        </div>
        
        <div className={styles.navigation}>
          <div className={styles.stepIndicators}>
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`${styles.stepDot} ${index === currentStep ? styles.active : ''}`}
              />
            ))}
          </div>
          
          <div className={styles.navButtons}>
            {currentStep > 0 && (
              <button 
                className={styles.navButton}
                onClick={handlePrevious}
              >
                Previous
              </button>
            )}
            
            <button 
              className={styles.navButton}
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
