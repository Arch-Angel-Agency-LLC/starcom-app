use anyhow::Result;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::net::SocketAddr;
use tracing::{info, debug, warn};
use serde::{Serialize, Deserialize};

/// Clean Subnet implementation - ONLY handles team membership and internal resources
/// This replaces the coupled SubnetManager with pure subnet concerns
pub struct CleanSubnet {
    subnet_id: String,
    subnet_name: String,
    members: Arc<RwLock<HashMap<String, SubnetMember>>>,
    internal_topology: SubnetTopology,
    shared_resources: Arc<RwLock<HashMap<String, SubnetResource>>>,
    subnet_config: SubnetConfiguration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetMember {
    pub public_key: String,
    pub node_address: SocketAddr,
    pub role: SubnetRole,
    pub joined_at: u64,
    pub last_seen: u64,
    pub capabilities: Vec<String>,
    pub is_online: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubnetRole {
    Leader,     // Can approve new members and manage subnet
    Member,     // Full access to subnet resources
    Observer,   // Read-only access to non-sensitive resources
}

#[derive(Debug, Clone)]
pub enum SubnetTopology {
    Mesh,       // All members can communicate directly
    Star,       // All communication goes through leader
    Ring,       // Members form a ring topology
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetResource {
    pub resource_id: String,
    pub resource_type: ResourceType,
    pub title: String,
    pub data: Vec<u8>,
    pub shared_with: Vec<String>, // member public keys
    pub created_by: String,
    pub created_at: u64,
    pub classification: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResourceType {
    IntelligenceReport,
    Document,
    Dataset,
    Configuration,
    Evidence,
    Communication,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetConfiguration {
    pub max_members: usize,
    pub auto_approve_members: bool,
    pub resource_retention_days: u32,
    pub require_leader_approval: bool,
}

impl CleanSubnet {
    pub fn new(subnet_id: String, subnet_name: String, leader_key: String, leader_address: SocketAddr) -> Self {
        let mut members = HashMap::new();
        
        // Add the leader as the first member
        let leader = SubnetMember {
            public_key: leader_key.clone(),
            node_address: leader_address,
            role: SubnetRole::Leader,
            joined_at: crate::utils::now_timestamp(),
            last_seen: crate::utils::now_timestamp(),
            capabilities: vec!["leadership".to_string(), "member_management".to_string()],
            is_online: true,
        };
        
        members.insert(leader_key, leader);

        Self {
            subnet_id,
            subnet_name,
            members: Arc::new(RwLock::new(members)),
            internal_topology: SubnetTopology::Mesh,
            shared_resources: Arc::new(RwLock::new(HashMap::new())),
            subnet_config: SubnetConfiguration::default(),
        }
    }

    /// Add a new member to this subnet
    pub async fn add_member(&self, public_key: String, node_address: SocketAddr, role: SubnetRole) -> Result<()> {
        // Check if subnet is full
        {
            let members = self.members.read().unwrap();
            if members.len() >= self.subnet_config.max_members {
                return Err(anyhow::anyhow!("Subnet {} is full", self.subnet_id));
            }
        }

        let member = SubnetMember {
            public_key: public_key.clone(),
            node_address,
            role,
            joined_at: crate::utils::now_timestamp(),
            last_seen: crate::utils::now_timestamp(),
            capabilities: vec!["communication".to_string()],
            is_online: true,
        };

        {
            let mut members = self.members.write().unwrap();
            members.insert(public_key.clone(), member);
        }

        info!("👥 Member {} joined subnet {}", public_key, self.subnet_id);
        Ok(())
    }

    /// Remove a member from this subnet
    pub async fn remove_member(&self, public_key: &str) -> Result<()> {
        let mut members = self.members.write().unwrap();
        
        // Don't allow removing the last leader
        if let Some(member) = members.get(public_key) {
            if matches!(member.role, SubnetRole::Leader) {
                let leader_count = members.values()
                    .filter(|m| matches!(m.role, SubnetRole::Leader))
                    .count();
                
                if leader_count <= 1 {
                    return Err(anyhow::anyhow!("Cannot remove the last leader from subnet"));
                }
            }
        }

        if members.remove(public_key).is_some() {
            info!("👥 Member {} left subnet {}", public_key, self.subnet_id);
        }
        
        Ok(())
    }

    /// Get all members in this subnet
    pub async fn get_members(&self) -> Vec<SubnetMember> {
        let members = self.members.read().unwrap();
        members.values().cloned().collect()
    }

    /// Get a specific member
    pub async fn get_member(&self, public_key: &str) -> Option<SubnetMember> {
        let members = self.members.read().unwrap();
        members.get(public_key).cloned()
    }

    /// Update member last seen timestamp
    pub async fn update_member_activity(&self, public_key: &str) -> Result<()> {
        let mut members = self.members.write().unwrap();
        if let Some(member) = members.get_mut(public_key) {
            member.last_seen = crate::utils::now_timestamp();
            member.is_online = true;
        }
        Ok(())
    }

    /// Share a resource within this subnet
    pub async fn share_resource(&self, resource: SubnetResource, target_members: &[String]) -> Result<String> {
        // Verify all target members are in this subnet
        {
            let members = self.members.read().unwrap();
            for target in target_members {
                if !members.contains_key(target) {
                    return Err(anyhow::anyhow!("Member {} not in subnet {}", target, self.subnet_id));
                }
            }
        }

        let resource_id = resource.resource_id.clone();
        
        {
            let mut resources = self.shared_resources.write().unwrap();
            resources.insert(resource_id.clone(), resource);
        }

        info!("📦 Resource {} shared with {} members in subnet {}", 
              resource_id, target_members.len(), self.subnet_id);
        
        Ok(resource_id)
    }

    /// Get resources accessible to a specific member
    pub async fn get_member_resources(&self, member_public_key: &str) -> Vec<SubnetResource> {
        let resources = self.shared_resources.read().unwrap();
        resources.values()
            .filter(|resource| {
                resource.shared_with.contains(&member_public_key.to_string()) ||
                resource.created_by == member_public_key
            })
            .cloned()
            .collect()
    }

    /// Get a specific resource
    pub async fn get_resource(&self, resource_id: &str, requester_key: &str) -> Option<SubnetResource> {
        let resources = self.shared_resources.read().unwrap();
        
        if let Some(resource) = resources.get(resource_id) {
            // Check if requester has access
            if resource.shared_with.contains(&requester_key.to_string()) || 
               resource.created_by == requester_key {
                Some(resource.clone())
            } else {
                None
            }
        } else {
            None
        }
    }

    /// Clean up old resources based on retention policy
    pub async fn cleanup_old_resources(&self) -> Result<()> {
        let cutoff_time = crate::utils::now_timestamp() - 
            (self.subnet_config.resource_retention_days as u64 * 24 * 60 * 60);

        let mut resources = self.shared_resources.write().unwrap();
        let initial_count = resources.len();
        
        resources.retain(|_, resource| resource.created_at > cutoff_time);
        
        let removed_count = initial_count - resources.len();
        if removed_count > 0 {
            info!("🧹 Cleaned up {} old resources from subnet {}", removed_count, self.subnet_id);
        }
        
        Ok(())
    }

    /// Get subnet status and health
    pub async fn get_status(&self) -> SubnetStatus {
        let members = self.members.read().unwrap();
        let resources = self.shared_resources.read().unwrap();
        
        let online_members = members.values()
            .filter(|m| m.is_online)
            .count();

        let leaders = members.values()
            .filter(|m| matches!(m.role, SubnetRole::Leader))
            .count();

        SubnetStatus {
            subnet_id: self.subnet_id.clone(),
            subnet_name: self.subnet_name.clone(),
            total_members: members.len(),
            online_members,
            leader_count: leaders,
            resource_count: resources.len(),
            topology: format!("{:?}", self.internal_topology),
            is_healthy: online_members > 0 && leaders > 0,
            last_activity: members.values()
                .map(|m| m.last_seen)
                .max()
                .unwrap_or(0),
        }
    }

    /// Check if a member has a specific role
    pub async fn member_has_role(&self, public_key: &str, required_role: SubnetRole) -> bool {
        let members = self.members.read().unwrap();
        if let Some(member) = members.get(public_key) {
            match required_role {
                SubnetRole::Leader => matches!(member.role, SubnetRole::Leader),
                SubnetRole::Member => matches!(member.role, SubnetRole::Leader | SubnetRole::Member),
                SubnetRole::Observer => true, // All roles can observe
            }
        } else {
            false
        }
    }

    // NOTE: What this clean subnet does NOT do:
    // - External protocol translation (that's for Gateway)
    // - Inter-subnet routing (that's for Gateway)
    // - External access control (that's for Gateway)
    // - Bridge coordination with other subnets (that's for Gateway)
    // - Security scanning of external content (that's for Gateway)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetStatus {
    pub subnet_id: String,
    pub subnet_name: String,
    pub total_members: usize,
    pub online_members: usize,
    pub leader_count: usize,
    pub resource_count: usize,
    pub topology: String,
    pub is_healthy: bool,
    pub last_activity: u64,
}

impl Default for SubnetConfiguration {
    fn default() -> Self {
        Self {
            max_members: 50,
            auto_approve_members: false,
            resource_retention_days: 90,
            require_leader_approval: true,
        }
    }
}

impl Default for SubnetRole {
    fn default() -> Self {
        SubnetRole::Member
    }
}

// Utility module for common functions
pub mod utils {
    pub fn now_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}
