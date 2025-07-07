# Remaining Backend Security Work - Action Plan

**Date**: June 26, 2025  
**Status**: Follow-up to successful authentication implementation  
**Priority**: P0 - Complete within 1-2 hours  

## 🎯 Objective

Complete the security implementation across ALL backend API handlers to match the authentication standard achieved in `list_investigations`.

## 📋 API Handlers Requiring Security Updates

### Critical Handlers (Missing Authentication & User Context)

1. **`get_investigation()`** 
   - **Status**: ❌ No authentication  
   - **Current**: Direct database access
   - **Needed**: User context + permission check + access control

2. **`update_investigation()`**
   - **Status**: ❌ No authentication
   - **Current**: Direct database update
   - **Needed**: User context + ownership check + input validation

3. **`delete_investigation()`** 
   - **Status**: ❌ No authentication
   - **Current**: Direct database delete
   - **Needed**: User context + ownership check + admin permission

4. **`create_investigation()`**
   - **Status**: ⚠️ Partial (no permission check)
   - **Current**: Creates without user validation
   - **Needed**: Permission check for "create_investigation"

5. **`list_tasks()`**
   - **Status**: ❌ No authentication
   - **Current**: Lists all tasks
   - **Needed**: User context + investigation access check

6. **`create_task()`**
   - **Status**: ❌ No authentication  
   - **Current**: Creates task without validation
   - **Needed**: User context + investigation ownership + input validation

7. **`list_evidence()`**
   - **Status**: ❌ No authentication
   - **Current**: Lists all evidence  
   - **Needed**: User context + investigation access check

8. **`create_evidence()`**
   - **Status**: ❌ Not implemented (returns 501)
   - **Current**: Placeholder
   - **Needed**: Full implementation with security

9. **`list_activities()`**
   - **Status**: ❌ No authentication
   - **Current**: Lists all activities
   - **Needed**: User context + investigation access check

10. **`get_status()`**
    - **Status**: ❌ Uses hardcoded user
    - **Current**: `let user_id = "system";`
    - **Needed**: Use authenticated user context

## 🔧 Implementation Template

### Standard Security Pattern (Based on Working `list_investigations`)

```rust
async fn secure_handler(
    State(service): State<Arc<InvestigationService>>,
    // Other parameters...
    req: Request,
) -> Result<Json<ApiResponse<T>>, StatusCode> {
    // 1. Extract authenticated user context
    let user_context = get_user_context(&req)?;
    
    // 2. Check specific permission
    if !user_context.permissions.contains(&"required_permission".to_string()) {
        warn!("User {} lacks permission for operation", user_context.user_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // 3. Validate input (if applicable)
    // validation logic here
    
    // 4. Perform operation with user context
    match service.operation_with_user_context(&user_context, params).await {
        Ok(result) => {
            info!("User {} performed operation successfully", user_context.user_id);
            Ok(Json(ApiResponse::success(result)))
        }
        Err(e) => {
            error!("Operation failed for user {}: {}", user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
```

## 🔐 Required Permissions Matrix

| Handler | Required Permission | Additional Checks |
|---------|-------------------|------------------|
| `get_investigation` | `read_investigation` | Investigation access |
| `update_investigation` | `update_investigation` | Investigation ownership |
| `delete_investigation` | `delete_investigation` | Investigation ownership |
| `create_investigation` | `create_investigation` | None |
| `list_tasks` | `read_investigation` | Investigation access |
| `create_task` | `create_task` | Investigation access |
| `list_evidence` | `read_investigation` | Investigation access |
| `create_evidence` | `create_evidence` | Investigation access |
| `list_activities` | `read_investigation` | Investigation access |
| `get_status` | `read_investigation` | Global statistics |

## 🔍 Input Validation Requirements

### Missing Validation Structs
```rust
#[derive(Deserialize, Validate)]
pub struct ValidatedUpdateInvestigationRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: Option<String>,
    
    #[validate(length(max = 5000))]
    pub description: Option<String>,
    
    pub priority: Option<Priority>,
    
    pub status: Option<InvestigationStatus>,
}

#[derive(Deserialize, Validate)]
pub struct ValidatedCreateTaskRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: String,
    
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    
    pub priority: Priority,
    
    pub assigned_to: Option<String>,
}

#[derive(Deserialize, Validate)]
pub struct ValidatedCreateEvidenceRequest {
    #[validate(length(min = 1, max = 100))]
    pub evidence_type: String,
    
    #[validate(length(min = 1, max = 200))]
    pub source: String,
    
    #[validate(length(max = 10485760))] // 10MB limit
    pub content: String,
    
    #[validate(regex = "^[a-fA-F0-9]{64}$")]
    pub hash: Option<String>,
}
```

## 📝 Implementation Steps

### Step 1: Update Handler Function Signatures (15 min)
- Add `req: Request` parameter to all handlers
- Import `get_user_context` in each handler

### Step 2: Add Permission Checks (30 min)  
- Implement permission validation for each handler
- Add appropriate error logging

### Step 3: Update Service Calls (30 min)
- Pass user context to service layer methods
- Update service methods to accept user context

### Step 4: Add Input Validation (15 min)
- Create validation structs for missing request types
- Apply validation to request deserialization

### Step 5: Test Each Handler (30 min)
- Create test cases for each permission scenario
- Verify proper error responses

## 🧪 Testing Strategy

### Test Cases Per Handler
1. **No Authorization Header** → 401 Unauthorized
2. **Invalid JWT Token** → 401 Unauthorized  
3. **Valid Token, Wrong Permission** → 403 Forbidden
4. **Valid Token, Correct Permission** → 200 OK
5. **Investigation Access Control** → Verify user isolation

### Integration Test Script
```bash
# Test each endpoint with different auth scenarios
# Verify proper error codes and responses
# Confirm user isolation works correctly
```

## ⏱️ Time Estimate

- **Handler Updates**: 1 hour
- **Validation Structs**: 15 minutes  
- **Testing**: 30 minutes
- **Documentation**: 15 minutes

**Total: ~2 hours**

## 🎯 Success Criteria

1. ✅ All handlers extract and validate user context
2. ✅ All handlers check appropriate permissions  
3. ✅ All handlers use user context in database operations
4. ✅ All handlers return proper HTTP status codes
5. ✅ Input validation applied to all request types
6. ✅ User isolation verified through testing

---

**Next Action**: Begin implementing these updates systematically, starting with `get_investigation()` as it's the most commonly used endpoint.
