# URGENT: API Handler Security Implementation Plan

**Date**: June 26, 2025  
**Priority**: P0 - EMERGENCY  
**Timeline**: Complete within 2-3 hours  
**Status**: 10 out of 11 API handlers are UNPROTECTED

## 🚨 Critical Situation

Despite having a working authentication framework, **90% of API handlers bypass security entirely**. This creates a false sense of security while leaving the system completely vulnerable.

## 📋 Handler-by-Handler Security Implementation

### 1. `get_investigation()` - CRITICAL ❌
**Current Code**: No authentication
```rust
async fn get_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    match service.get_investigation(&id).await {
```

**Required Fix**:
```rust
async fn get_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    req: Request,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    // Add authentication
    let user_context = get_user_context(&req)?;
    
    // Add permission check
    if !user_context.permissions.contains(&"read_investigation".to_string()) {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Add input validation
    validate_investigation_id(&id)?;
    
    // Add access control check
    match service.get_investigation_with_access_check(&user_context.user_id, &id).await {
```

### 2. `update_investigation()` - CRITICAL ❌
**Current Code**: No authentication, no ownership check
```rust
async fn update_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateInvestigationRequest>,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    match service.get_investigation(&id).await {
```

**Required Fix**:
```rust
async fn update_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateInvestigationRequest>,
    http_req: Request,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    // Add authentication
    let user_context = get_user_context(&http_req)?;
    
    // Add permission check
    if !user_context.permissions.contains(&"update_investigation".to_string()) {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Add input validation
    validate_investigation_id(&id)?;
    req.validate().map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Add ownership check
    if !service.user_owns_investigation(&user_context.user_id, &id).await? {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Perform update with user context
    match service.update_investigation_with_context(&user_context, &id, req).await {
```

### 3. `delete_investigation()` - CRITICAL ❌
**Current Code**: No authentication
```rust
async fn delete_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    match service.delete_investigation(&id).await {
```

**Required Fix**:
```rust
async fn delete_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    req: Request,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    // Add authentication
    let user_context = get_user_context(&req)?;
    
    // Add permission check (requires admin or ownership)
    if !user_context.permissions.contains(&"delete_investigation".to_string()) {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Add input validation
    validate_investigation_id(&id)?;
    
    // Add ownership or admin check
    if !service.user_can_delete_investigation(&user_context, &id).await? {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Perform deletion with audit logging
    match service.delete_investigation_with_context(&user_context, &id).await {
```

### 4. `create_investigation()` - NEEDS PERMISSION CHECK ⚠️
**Current Code**: Missing permission validation
**Fix**: Add permission check for "create_investigation"

### 5. `list_tasks()` - CRITICAL ❌
**Current Code**: No authentication
**Fix**: Add user context + investigation access check

### 6. `create_task()` - CRITICAL ❌  
**Current Code**: No authentication
**Fix**: Add user context + investigation ownership + input validation

### 7. `list_evidence()` - CRITICAL ❌
**Current Code**: No authentication
**Fix**: Add user context + investigation access check

### 8. `create_evidence()` - BROKEN ❌
**Current Code**: Returns 501 (not implemented)
**Fix**: Complete implementation + full security

### 9. `list_activities()` - CRITICAL ❌
**Current Code**: No authentication
**Fix**: Add user context + access control

### 10. `get_status()` - HARDCODED USER ❌
**Current Code**: `let user_id = "system";`
**Fix**: Use real user context from authentication

## 🔧 Implementation Pattern

### Standard Security Pattern for All Handlers:
```rust
async fn secure_handler_pattern(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    req: Request,
    // Additional parameters as needed
) -> Result<Json<ApiResponse<T>>, StatusCode> {
    // 1. AUTHENTICATION - Extract user context
    let user_context = get_user_context(&req)?;
    
    // 2. AUTHORIZATION - Check permissions
    if !user_context.permissions.contains(&"required_permission".to_string()) {
        warn!("User {} lacks permission for action", user_context.user_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // 3. INPUT VALIDATION - Validate all inputs
    validate_investigation_id(&id)?;
    // Additional validation as needed
    
    // 4. RESOURCE ACCESS CONTROL - Check ownership/access
    if !service.user_can_access_resource(&user_context.user_id, &id).await? {
        return Err(StatusCode::FORBIDDEN);
    }
    
    // 5. OPERATION WITH CONTEXT - Perform actual operation
    match service.operation_with_user_context(&user_context, &id).await {
        Ok(result) => {
            info!("Operation successful for user {}", user_context.user_id);
            Ok(Json(ApiResponse::success(result)))
        },
        Err(e) => {
            error!("Operation failed for user {}: {}", user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
```

## 🕐 Implementation Timeline

### Hour 1: Critical Read Operations
- [ ] Secure `get_investigation()` (15 min)
- [ ] Secure `list_tasks()` (15 min)  
- [ ] Secure `list_evidence()` (15 min)
- [ ] Secure `list_activities()` (15 min)

### Hour 2: Critical Write Operations  
- [ ] Secure `update_investigation()` (20 min)
- [ ] Secure `delete_investigation()` (20 min)
- [ ] Secure `create_task()` (20 min)

### Hour 3: Remaining Items
- [ ] Implement `create_evidence()` (30 min)
- [ ] Fix `get_status()` (15 min)
- [ ] Add permission check to `create_investigation()` (15 min)

## 🧪 Testing Plan

### Authentication Tests
```bash
# Test each handler requires authentication
curl http://127.0.0.1:8081/api/v1/investigations/123
curl http://127.0.0.1:8081/api/v1/investigations/123/tasks  
curl http://127.0.0.1:8081/api/v1/investigations/123/evidence
# All should return HTTP 401

# Test with valid token
curl -H "Authorization: Bearer <token>" http://127.0.0.1:8081/api/v1/investigations/123
# Should return HTTP 200 or 403 (not 401)
```

### Authorization Tests
```bash
# Test permission enforcement
curl -H "Authorization: Bearer <viewer-token>" -X DELETE http://127.0.0.1:8081/api/v1/investigations/123
# Should return HTTP 403

# Test ownership enforcement  
curl -H "Authorization: Bearer <user-a-token>" http://127.0.0.1:8081/api/v1/investigations/user-b-investigation
# Should return HTTP 403
```

## 📊 Success Criteria

### Phase 1 Complete When:
- [ ] All 11 handlers require authentication
- [ ] All handlers check appropriate permissions
- [ ] All handlers validate input parameters
- [ ] All handlers respect resource access control
- [ ] All handlers use user context for operations

### Testing Complete When:
- [ ] Unauthenticated requests return HTTP 401 for all handlers
- [ ] Unauthorized requests return HTTP 403 for all handlers  
- [ ] Authorized requests return HTTP 200 for all handlers
- [ ] Invalid input returns HTTP 400 for all handlers
- [ ] Resource access is properly controlled

### Production Ready When:
- [ ] All API handlers secure
- [ ] Full test suite passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Deployment procedures updated

---

**IMMEDIATE ACTION REQUIRED**: Start implementing security for the 10 unprotected handlers immediately. Each handler that remains unprotected represents a critical security vulnerability that bypasses the entire authentication system.
