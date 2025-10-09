#!/usr/bin/env python3
"""
Comprehensive Project CRUD Testing
Tests create, read, update, delete operations for projects
"""

import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid

# Configuration
BASE_URL = "https://codetrack90.preview.emergentagent.com/api"

async def test_full_project_crud():
    """Test complete project CRUD operations with mock authentication"""
    
    # Load environment
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print("🧪 Testing Full Project CRUD Operations")
        print("=" * 50)
        
        # Create test user
        test_user_id = str(uuid.uuid4())
        test_token = f"test_token_{test_user_id}"
        
        test_user = {
            "id": test_user_id,
            "email": "testuser@example.com",
            "name": "Test User",
            "picture": "https://example.com/pic.jpg",
            "session_token": test_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "challenge_start_date": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(test_user)
        print(f"✅ Created test user: {test_user['email']}")
        
        headers = {"Authorization": f"Bearer {test_token}"}
        
        # Test 1: Create Project
        print("\n📝 Testing Project Creation...")
        project_data = {
            "title": "My Awesome Web App",
            "description": "A full-stack web application built during the 90-day challenge",
            "tech_stack": ["React", "Node.js", "MongoDB", "Express"],
            "deployed_link": "https://myapp.example.com",
            "github_link": "https://github.com/testuser/awesome-app",
            "month": 1
        }
        
        create_response = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
        
        if create_response.status_code == 200:
            created_project = create_response.json()
            project_id = created_project['id']
            print(f"✅ Project created successfully: {created_project['title']}")
            print(f"   Project ID: {project_id}")
            print(f"   Status: {created_project['status']}")
            print(f"   Tech Stack: {', '.join(created_project['tech_stack'])}")
        else:
            print(f"❌ Project creation failed: {create_response.status_code}")
            print(f"   Response: {create_response.text}")
            return False
        
        # Test 2: Get User Projects
        print("\n📋 Testing Get User Projects...")
        get_response = requests.get(f"{BASE_URL}/projects", headers=headers)
        
        if get_response.status_code == 200:
            projects = get_response.json()
            print(f"✅ Retrieved {len(projects)} projects")
            if projects:
                project = projects[0]
                print(f"   First project: {project['title']}")
                print(f"   Month: {project['month']}")
        else:
            print(f"❌ Get projects failed: {get_response.status_code}")
            return False
        
        # Test 3: Update Project
        print("\n✏️ Testing Project Update...")
        update_data = {
            "status": "completed",
            "description": "Updated: A full-stack web application successfully completed during the 90-day challenge"
        }
        
        update_response = requests.put(f"{BASE_URL}/projects/{project_id}", json=update_data, headers=headers)
        
        if update_response.status_code == 200:
            updated_project = update_response.json()
            print(f"✅ Project updated successfully")
            print(f"   New status: {updated_project['status']}")
            print(f"   Updated description: {updated_project['description'][:50]}...")
        else:
            print(f"❌ Project update failed: {update_response.status_code}")
            print(f"   Response: {update_response.text}")
            return False
        
        # Test 4: Test Explore API (should show our project)
        print("\n🌍 Testing Explore API...")
        explore_response = requests.get(f"{BASE_URL}/projects/explore")
        
        if explore_response.status_code == 200:
            explore_projects = explore_response.json()
            print(f"✅ Explore API returned {len(explore_projects)} projects")
            
            # Find our project in explore results
            our_project = next((p for p in explore_projects if p['id'] == project_id), None)
            if our_project:
                print(f"   Found our project in explore: {our_project['title']}")
                print(f"   Creator: {our_project['creator_name']}")
                print(f"   Status: {our_project['status']}")
            else:
                print("   Our project not found in explore results")
        else:
            print(f"❌ Explore API failed: {explore_response.status_code}")
            return False
        
        # Test 5: Test Dashboard API
        print("\n📊 Testing Dashboard API...")
        dashboard_response = requests.get(f"{BASE_URL}/dashboard", headers=headers)
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print(f"✅ Dashboard API working")
            print(f"   Days elapsed: {dashboard_data['days_elapsed']}")
            print(f"   Challenge progress: {dashboard_data['challenge_progress']:.1f}%")
            print(f"   Total projects: {dashboard_data['total_projects']}")
            
            # Check month stats
            month_1_stats = dashboard_data['month_stats']['month_1']
            print(f"   Month 1 stats: {month_1_stats['completed']} completed, {month_1_stats['in_progress']} in progress")
        else:
            print(f"❌ Dashboard API failed: {dashboard_response.status_code}")
            return False
        
        # Test 6: Create Second Project (different month)
        print("\n📝 Testing Second Project Creation...")
        project_data_2 = {
            "title": "Mobile App with React Native",
            "description": "Cross-platform mobile application",
            "tech_stack": ["React Native", "Firebase", "TypeScript"],
            "month": 2
        }
        
        create_response_2 = requests.post(f"{BASE_URL}/projects", json=project_data_2, headers=headers)
        
        if create_response_2.status_code == 200:
            created_project_2 = create_response_2.json()
            project_id_2 = created_project_2['id']
            print(f"✅ Second project created: {created_project_2['title']}")
        else:
            print(f"❌ Second project creation failed: {create_response_2.status_code}")
            return False
        
        # Test 7: Verify Dashboard Shows Both Projects
        print("\n📊 Testing Dashboard with Multiple Projects...")
        dashboard_response_2 = requests.get(f"{BASE_URL}/dashboard", headers=headers)
        
        if dashboard_response_2.status_code == 200:
            dashboard_data_2 = dashboard_response_2.json()
            print(f"✅ Dashboard shows {dashboard_data_2['total_projects']} total projects")
            
            month_1_stats = dashboard_data_2['month_stats']['month_1']
            month_2_stats = dashboard_data_2['month_stats']['month_2']
            
            print(f"   Month 1: {month_1_stats['total']} projects")
            print(f"   Month 2: {month_2_stats['total']} projects")
        else:
            print(f"❌ Dashboard API failed on second check: {dashboard_response_2.status_code}")
            return False
        
        # Test 8: Delete Project
        print("\n🗑️ Testing Project Deletion...")
        delete_response = requests.delete(f"{BASE_URL}/projects/{project_id_2}", headers=headers)
        
        if delete_response.status_code == 200:
            print(f"✅ Project deleted successfully")
            
            # Verify it's gone
            get_response_after_delete = requests.get(f"{BASE_URL}/projects", headers=headers)
            if get_response_after_delete.status_code == 200:
                remaining_projects = get_response_after_delete.json()
                print(f"   Remaining projects: {len(remaining_projects)}")
        else:
            print(f"❌ Project deletion failed: {delete_response.status_code}")
            return False
        
        # Test 9: Test Authorization (try to access other user's project)
        print("\n🔒 Testing Authorization...")
        
        # Create another user
        other_user_id = str(uuid.uuid4())
        other_token = f"other_token_{other_user_id}"
        
        other_user = {
            "id": other_user_id,
            "email": "otheruser@example.com",
            "name": "Other User",
            "picture": "https://example.com/other.jpg",
            "session_token": other_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "challenge_start_date": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(other_user)
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        # Try to update first user's project with second user's token
        unauthorized_update = requests.put(f"{BASE_URL}/projects/{project_id}", 
                                         json={"title": "Hacked!"}, 
                                         headers=other_headers)
        
        if unauthorized_update.status_code == 404:
            print("✅ Authorization working - cannot access other user's projects")
        else:
            print(f"❌ Authorization failed: {unauthorized_update.status_code}")
            return False
        
        print("\n🎉 All Project CRUD tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
        
    finally:
        # Clean up test data
        await db.users.delete_many({"email": {"$in": ["testuser@example.com", "otheruser@example.com"]}})
        await db.projects.delete_many({"user_id": {"$in": [test_user_id, other_user_id]}})
        client.close()
        print("\n🧹 Test data cleaned up")

if __name__ == "__main__":
    success = asyncio.run(test_full_project_crud())
    if success:
        print("\n✅ All CRUD operations working correctly!")
    else:
        print("\n❌ Some CRUD operations failed!")