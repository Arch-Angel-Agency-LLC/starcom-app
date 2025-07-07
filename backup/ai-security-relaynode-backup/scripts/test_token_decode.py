#!/usr/bin/env python3
"""
Test JWT token decoding to verify it's properly formatted
"""

import jwt
import time
from datetime import datetime

def decode_token(token, secret):
    """Decode and verify a JWT token"""
    try:
        # Decode the token
        decoded = jwt.decode(
            token, 
            secret, 
            algorithms=['HS256'],
            issuer='ai-security-relaynode'
        )
        print("✅ Token decoded successfully!")
        print(f"Claims: {decoded}")
        
        # Check expiration
        exp = decoded.get('exp', 0)
        now = int(time.time())
        if exp > now:
            print(f"✅ Token is valid until: {datetime.fromtimestamp(exp)}")
        else:
            print(f"❌ Token expired at: {datetime.fromtimestamp(exp)}")
            
        return decoded
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired")
        return None
    except jwt.InvalidSignatureError:
        print("❌ Invalid token signature")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        return None

if __name__ == "__main__":
    # Test with the generated token
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbImNyZWF0ZV9pbnZlc3RpZ2F0aW9uIiwicmVhZF9pbnZlc3RpZ2F0aW9uIiwidXBkYXRlX2ludmVzdGlnYXRpb24iLCJkZWxldGVfaW52ZXN0aWdhdGlvbiIsImNyZWF0ZV90YXNrcyIsInJlYWRfdGFza3MiLCJ1cGRhdGVfdGFza3MiLCJkZWxldGVfdGFza3MiLCJjcmVhdGVfZXZpZGVuY2UiLCJyZWFkX2V2aWRlbmNlIiwidXBkYXRlX2V2aWRlbmNlIiwiZGVsZXRlX2V2aWRlbmNlIiwicmVhZF9hY3Rpdml0aWVzIiwicmVhZF9zdGF0dXMiLCJtYW5hZ2VfdXNlcnMiLCJ2aWV3X2F1ZGl0X2xvZ3MiLCJhZG1pbiJdLCJleHAiOjE3NTEwOTA5OTksImlhdCI6MTc1MTA2MjE5OSwiaXNzIjoiYWktc2VjdXJpdHktcmVsYXlub2RlIn0.S539BulJxyn7YLx67I48hQNrrgUE4LiY_VPyjZBy50I"
    secret = 'your-secret-key-change-in-production'
    
    print("Testing token decoding...")
    decode_token(token, secret)
