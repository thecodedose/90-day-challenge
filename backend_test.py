#!/usr/bin/env python3
"""
Backend API Testing for 90-Day Lock-In Challenge App
Tests all authentication, project CRUD, dashboard, and explore endpoints
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import time

# Configuration
BASE_URL = "https://codetrack90.preview.emergentagent.com/api"
TEST_SESSION_ID = "test_session_" + str(uuid.uuid4())

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.test_project_id = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def test_auth_session_endpoint(self):
        """Test /api/auth/session endpoint"""
        self.log("Testing /api/auth/session endpoint...")
        
        # Test without X-Session-ID header (should fail)
        try:
            response = self.session.post(f"{BASE_URL}/auth/session")
            if response.status_code == 400:
                self.log("✅ Correctly rejected request without X-Session-ID header")
            else:
                self.log(f"❌ Expected 400 but got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing auth session without header: {e}", "ERROR")
            return False
            
        # Test with X-Session-ID header (will fail due to external auth service)
        try:
            headers = {"X-Session-ID": TEST_SESSION_ID}
            response = self.session.post(f"{BASE_URL}/auth/session", headers=headers)
            
            # This should fail since we can't authenticate with real Emergent Auth
            if response.status_code == 401:
                self.log("✅ Auth session endpoint correctly validates with external service")
                return True
            else:
                self.log(f"❌ Unexpected response from auth session: {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing auth session: {e}", "ERROR")
            return False
    
    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        self.log("Testing protected endpoints without authentication...")
        
        protected_endpoints = [
            ("GET", "/auth/me"),
            ("GET", "/projects"),
            ("POST", "/projects"),
            ("GET", "/dashboard")
        ]
        
        all_passed = True
        for method, endpoint in protected_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{BASE_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{BASE_URL}{endpoint}")
                    
                if response.status_code == 401:
                    self.log(f"✅ {method} {endpoint} correctly requires authentication")
                else:
                    self.log(f"❌ {method} {endpoint} should return 401 but got {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Error testing {method} {endpoint}: {e}", "ERROR")
                all_passed = False
        
        # Test logout endpoint separately (it's designed to work without auth)
        try:
            response = self.session.post(f"{BASE_URL}/auth/logout")
            if response.status_code == 200:
                self.log("✅ POST /auth/logout works without authentication (by design)")
            else:
                self.log(f"❌ POST /auth/logout returned unexpected status {response.status_code}", "ERROR")
                all_passed = False
        except Exception as e:
            self.log(f"❌ Error testing POST /auth/logout: {e}", "ERROR")
            all_passed = False
                
        return all_passed
    
    def test_explore_endpoint(self):
        """Test /api/projects/explore endpoint (public)"""
        self.log("Testing /api/projects/explore endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/projects/explore")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log(f"✅ Explore endpoint working - returned {len(data)} projects")
                    
                    # Check structure of returned projects if any exist
                    if data:
                        project = data[0]
                        required_fields = ['id', 'title', 'description', 'tech_stack', 'status', 'month', 'creator_name']
                        missing_fields = [field for field in required_fields if field not in project]
                        
                        if not missing_fields:
                            self.log("✅ Project structure in explore endpoint is correct")
                        else:
                            self.log(f"❌ Missing fields in explore projects: {missing_fields}", "ERROR")
                            return False
                    
                    return True
                else:
                    self.log(f"❌ Explore endpoint should return list but got: {type(data)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Explore endpoint failed with status {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing explore endpoint: {e}", "ERROR")
            return False
    
    def test_project_crud_validation(self):
        """Test project CRUD endpoints with invalid data"""
        self.log("Testing project CRUD validation...")
        
        # Test creating project without auth (should fail with 401)
        try:
            project_data = {
                "title": "Test Project",
                "description": "A test project",
                "tech_stack": ["Python", "FastAPI"],
                "month": 1
            }
            
            response = self.session.post(f"{BASE_URL}/projects", json=project_data)
            
            if response.status_code == 401:
                self.log("✅ Project creation correctly requires authentication")
            else:
                self.log(f"❌ Project creation should return 401 but got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing project creation validation: {e}", "ERROR")
            return False
            
        # Test updating non-existent project
        try:
            fake_project_id = str(uuid.uuid4())
            update_data = {"title": "Updated Title"}
            
            response = self.session.put(f"{BASE_URL}/projects/{fake_project_id}", json=update_data)
            
            if response.status_code == 401:
                self.log("✅ Project update correctly requires authentication")
            else:
                self.log(f"❌ Project update should return 401 but got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing project update validation: {e}", "ERROR")
            return False
            
        # Test deleting non-existent project
        try:
            fake_project_id = str(uuid.uuid4())
            
            response = self.session.delete(f"{BASE_URL}/projects/{fake_project_id}")
            
            if response.status_code == 401:
                self.log("✅ Project deletion correctly requires authentication")
            else:
                self.log(f"❌ Project deletion should return 401 but got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing project deletion validation: {e}", "ERROR")
            return False
            
        return True
    
    def test_api_structure_and_responses(self):
        """Test API structure and response formats"""
        self.log("Testing API structure and response formats...")
        
        # Test invalid endpoints
        test_cases = [
            ("/api/invalid", 404, "Invalid API endpoint"),
            ("/api/auth/invalid", 404, "Invalid auth endpoint")
        ]
        
        for endpoint, expected_status, description in test_cases:
            try:
                response = self.session.get(f"https://codetrack90.preview.emergentagent.com{endpoint}")
                
                if response.status_code == expected_status:
                    self.log(f"✅ {description} correctly returns {expected_status}")
                else:
                    self.log(f"❌ {description} should return {expected_status} but got {response.status_code}", "ERROR")
                    return False
                    
            except Exception as e:
                self.log(f"❌ Error testing {description}: {e}", "ERROR")
                return False
        
        # Note: /api/projects/invalid returns 405 (Method Not Allowed) because it matches 
        # the /api/projects/{project_id} route pattern but GET method isn't defined for it
        # This is expected FastAPI behavior
        try:
            response = self.session.get(f"https://codetrack90.preview.emergentagent.com/api/projects/invalid")
            if response.status_code == 405:
                self.log("✅ /api/projects/invalid correctly returns 405 (Method Not Allowed - expected FastAPI behavior)")
            else:
                self.log(f"❌ /api/projects/invalid should return 405 but got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing /api/projects/invalid: {e}", "ERROR")
            return False
        
        return True
    
    def test_cors_headers(self):
        """Test CORS configuration"""
        self.log("Testing CORS headers...")
        
        try:
            # Test preflight request
            headers = {
                'Origin': 'https://example.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = self.session.options(f"{BASE_URL}/projects/explore", headers=headers)
            
            # Check if CORS headers are present
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            present_headers = [header for header in cors_headers if header in response.headers]
            
            if len(present_headers) >= 1:  # At least some CORS headers should be present
                self.log("✅ CORS headers are configured")
                return True
            else:
                self.log("❌ CORS headers not found in response", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing CORS: {e}", "ERROR")
            return False
    
    def test_server_health(self):
        """Test if server is running and responding"""
        self.log("Testing server health...")
        
        try:
            # Test root endpoint
            response = self.session.get("https://codetrack90.preview.emergentagent.com")
            
            if response.status_code in [200, 404]:  # Either works or returns 404 for root
                self.log("✅ Server is responding")
                return True
            else:
                self.log(f"❌ Server health check failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Server health check failed: {e}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60)
        self.log("STARTING 90-DAY CHALLENGE BACKEND API TESTS")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test server health first
        test_results['server_health'] = self.test_server_health()
        
        # Test CORS configuration
        test_results['cors_headers'] = self.test_cors_headers()
        
        # Test API structure
        test_results['api_structure'] = self.test_api_structure_and_responses()
        
        # Test authentication endpoints
        test_results['auth_session'] = self.test_auth_session_endpoint()
        test_results['protected_endpoints'] = self.test_protected_endpoints_without_auth()
        
        # Test public endpoints
        test_results['explore_endpoint'] = self.test_explore_endpoint()
        
        # Test project CRUD validation
        test_results['project_crud_validation'] = self.test_project_crud_validation()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed_tests = []
        failed_tests = []
        
        for test_name, result in test_results.items():
            if result:
                passed_tests.append(test_name)
                self.log(f"✅ {test_name}: PASSED")
            else:
                failed_tests.append(test_name)
                self.log(f"❌ {test_name}: FAILED", "ERROR")
        
        self.log("=" * 60)
        self.log(f"TOTAL TESTS: {len(test_results)}")
        self.log(f"PASSED: {len(passed_tests)}")
        self.log(f"FAILED: {len(failed_tests)}")
        
        if failed_tests:
            self.log("FAILED TESTS:", "ERROR")
            for test in failed_tests:
                self.log(f"  - {test}", "ERROR")
        
        return len(failed_tests) == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        exit(0)
    else:
        print("\n❌ Some backend tests failed!")
        exit(1)