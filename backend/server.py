from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    challenge_start_date: Optional[datetime] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    tech_stack: List[str]
    deployed_link: Optional[str] = None
    github_link: Optional[str] = None
    status: str = "planning"  # planning, in-progress, completed, paused
    month: int  # 1, 2, or 3 for the three months
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    deployed_link: Optional[str] = None
    github_link: Optional[str] = None
    month: int

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    deployed_link: Optional[str] = None
    github_link: Optional[str] = None
    status: Optional[str] = None

# Authentication helpers
async def get_current_user(request: Request) -> Optional[User]:
    # Check session_token from cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find user by session_token
    user_data = await db.users.find_one({"session_token": session_token})
    if not user_data:
        return None
    
    user = User(**user_data)
    
    # Check if session is expired
    if user.expires_at < datetime.now(timezone.utc):
        # Delete expired session
        await db.users.delete_one({"id": user.id})
        return None
    
    return user

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# Helper functions for MongoDB datetime serialization
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') or key == 'expires_at' or key == 'challenge_start_date':
                if isinstance(value, str):
                    item[key] = datetime.fromisoformat(value)
    return item

# Health check route
@api_router.get("/")
async def root():
    return {"message": "90-Day Lock-In Challenge API", "status": "healthy"}

# Authentication routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth service to get user data
    auth_service_url = os.environ.get('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data')
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                auth_service_url,
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        except Exception:
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data["email"]})
    
    if existing_user:
        # Update session token and expiry
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.users.update_one(
            {"email": user_data["email"]},
            {"$set": {
                "session_token": user_data["session_token"],
                "expires_at": expires_at.isoformat()
            }}
        )
        user = User(**existing_user)
        user.session_token = user_data["session_token"]
        user.expires_at = expires_at
    else:
        # Create new user with challenge start date
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        challenge_start_date = datetime.now(timezone.utc)
        
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data["picture"],
            session_token=user_data["session_token"],
            expires_at=expires_at,
            challenge_start_date=challenge_start_date
        )
        
        user_dict = prepare_for_mongo(user.model_dump())
        await db.users.insert_one(user_dict)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=user_data["session_token"],
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "challenge_start_date": user.challenge_start_date
    }

@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(require_auth)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "challenge_start_date": user.challenge_start_date
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    user = await get_current_user(request)
    if user:
        # Delete session from database
        await db.users.delete_one({"id": user.id})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}

# Project routes
@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, user: User = Depends(require_auth)):
    project = Project(
        user_id=user.id,
        **project_data.model_dump()
    )
    
    project_dict = prepare_for_mongo(project.model_dump())
    await db.projects.insert_one(project_dict)
    
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_user_projects(user: User = Depends(require_auth)):
    projects = await db.projects.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        parse_from_mongo(project)
    
    return [Project(**project) for project in projects]

@api_router.get("/projects/explore", response_model=List[dict])
async def get_all_projects():
    # Get all projects with user info for explore page
    pipeline = [
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "id",
                "as": "user"
            }
        },
        {
            "$unwind": "$user"
        },
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "title": 1,
                "description": 1,
                "tech_stack": 1,
                "deployed_link": 1,
                "github_link": 1,
                "status": 1,
                "month": 1,
                "created_at": 1,
                "creator_name": "$user.name",
                "creator_picture": "$user.picture"
            }
        },
        {"$sort": {"created_at": -1}}
    ]
    
    projects = await db.projects.aggregate(pipeline).to_list(1000)
    
    for project in projects:
        parse_from_mongo(project)
    
    return projects

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate, user: User = Depends(require_auth)):
    # Find project and verify ownership
    project_data = await db.projects.find_one({"id": project_id, "user_id": user.id})
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": update_dict}
    )
    
    # Return updated project
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    parse_from_mongo(updated_project)
    
    return Project(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(require_auth)):
    result = await db.projects.delete_one({"id": project_id, "user_id": user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted successfully"}

# Dashboard route
@api_router.get("/dashboard")
async def get_dashboard_data(user: User = Depends(require_auth)):
    # Calculate days since challenge started
    days_elapsed = 0
    if user.challenge_start_date:
        days_elapsed = (datetime.now(timezone.utc) - user.challenge_start_date).days
    
    # Get user's projects
    projects = await db.projects.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        parse_from_mongo(project)
    
    # Calculate project stats by month
    month_stats = {}
    for i in range(1, 4):
        month_projects = [p for p in projects if p.get("month") == i]
        completed = len([p for p in month_projects if p.get("status") == "completed"])
        in_progress = len([p for p in month_projects if p.get("status") == "in-progress"])
        total = len(month_projects)
        
        month_stats[f"month_{i}"] = {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "planning": total - completed - in_progress
        }
    
    return {
        "days_elapsed": days_elapsed,
        "days_remaining": max(0, 90 - days_elapsed),
        "challenge_progress": min(100, (days_elapsed / 90) * 100),
        "projects": projects,
        "month_stats": month_stats,
        "total_projects": len(projects)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
