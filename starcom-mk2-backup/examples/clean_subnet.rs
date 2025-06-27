use anyhow::Result;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::net::SocketAddr;
use serde::{Serialize, Deserialize};

/// Clean Subnet implementation - ONLY handles membership and internal topology
/// No gateway logic, no external protocol concerns
pub struct Subnet {
    subnet_id: String,
    members: Arc<RwLock<HashMap<String, Member>>>,
    internal_topology: NetworkTopology,
    shared_resources: Arc<RwLock<HashMap<String, SharedResource>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub public_key: String,
    pub node_address: SocketAddr,
    pub role: MemberRole,
    pub joined_at: u64,
    pub last_seen: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemberRole {
    Leader,    // Can approve new members
    Member,    // Full access to subnet resources
    Observer,  // Read-only access
}

#[derive(Debug, Clone)]
pub enum NetworkTopology {
    Mesh,      // All nodes connected to all nodes
    Star,      // All nodes connected to leader
    Ring,      // Nodes connected in a ring
}

#[derive(Debug, Clone)]
pub struct SharedResource {
    resource_id: String,
    resource_type: ResourceType,
    data: Vec<u8>,
    shared_with: Vec<String>, // member public keys
    created_at: u64,
}

#[derive(Debug, Clone)]
pub enum ResourceType {
    IntelligenceReport,
    Document,
    Dataset,
    Configuration,
}

impl Subnet {
    pub fn new(subnet_id: String, topology: NetworkTopology) -> Self {
        Self {
            subnet_id,
            members: Arc::new(RwLock::new(HashMap::new())),
            internal_topology: topology,
            shared_resources: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add a member to this subnet (internal membership only)
    pub async fn add_member(&self, public_key: String, node_address: SocketAddr, role: MemberRole) -> Result<()> {
        let member = Member {
            public_key: public_key.clone(),
            node_address,
            role,
            joined_at: crate::utils::now_timestamp(),
            last_seen: crate::utils::now_timestamp(),
        };

        let mut members = self.members.write().unwrap();
        members.insert(public_key.clone(), member);
        
        tracing::info!("👥 Member {} joined subnet {}", public_key, self.subnet_id);
        Ok(())
    }

    /// Remove a member from this subnet
    pub async fn remove_member(&self, public_key: &str) -> Result<()> {
        let mut members = self.members.write().unwrap();
        if members.remove(public_key).is_some() {
            tracing::info!("👥 Member {} left subnet {}", public_key, self.subnet_id);
        }
        Ok(())
    }

    /// Discover peers within this subnet
    pub async fn discover_peers(&self) -> Vec<Member> {
        let members = self.members.read().unwrap();
        members.values().cloned().collect()
    }

    /// Share a resource with specific members within this subnet
    pub async fn share_resource(&self, resource: SharedResource, target_members: &[String]) -> Result<()> {
        // Verify all target members are actually in this subnet
        let members = self.members.read().unwrap();
        for target in target_members {
            if !members.contains_key(target) {
                return Err(anyhow::anyhow!("Member {} not in subnet {}", target, self.subnet_id));
            }
        }

        let mut resources = self.shared_resources.write().unwrap();
        resources.insert(resource.resource_id.clone(), resource);
        
        tracing::info!("📦 Resource shared with {} members in subnet {}", target_members.len(), self.subnet_id);
        Ok(())
    }

    /// Get all resources shared with a specific member
    pub async fn get_member_resources(&self, member_public_key: &str) -> Vec<SharedResource> {
        let resources = self.shared_resources.read().unwrap();
        resources.values()
            .filter(|resource| resource.shared_with.contains(&member_public_key.to_string()))
            .cloned()
            .collect()
    }

    /// Get subnet status (internal info only)
    pub async fn get_status(&self) -> SubnetStatus {
        let members = self.members.read().unwrap();
        let resources = self.shared_resources.read().unwrap();
        
        SubnetStatus {
            subnet_id: self.subnet_id.clone(),
            member_count: members.len(),
            resource_count: resources.len(),
            topology: format!("{:?}", self.internal_topology),
            is_healthy: true, // TODO: Add health checks
        }
    }

    // NOTE: What this subnet does NOT do:
    // - Handle external protocol translation (that's Gateway)
    // - Manage access control to external networks (that's Gateway)
    // - Route messages between different subnets (that's Gateway)
    // - Enforce security policies on external requests (that's Gateway)
    // - Coordinate bridges to other networks (that's Gateway)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetStatus {
    pub subnet_id: String,
    pub member_count: usize,
    pub resource_count: usize,
    pub topology: String,
    pub is_healthy: bool,
}

mod utils {
    pub fn now_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}
