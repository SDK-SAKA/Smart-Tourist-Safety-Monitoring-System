# main.py - FastAPI Backend with MongoDB
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import motor.motor_asyncio
from pymongo.errors import DuplicateKeyError
import os
from dotenv import load_dotenv
import hashlib
import secrets

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Smart Tourist Safety API",
    description="Police Dashboard API with MongoDB Integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "tourist_safety_db")

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

# Collections
users_collection = database.get_collection("users")
tourists_collection = database.get_collection("tourists")
incidents_collection = database.get_collection("incidents")
sessions_collection = database.get_collection("sessions")

# Pydantic Models
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    department: str = Field(..., max_length=100)
    rank: str = Field(..., max_length=50)
    station_id: str = Field(..., max_length=50)
    role: str = Field(default="officer", pattern="^(officer|supervisor|admin)$")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    phone: str
    department: str
    rank: str
    station_id: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Tourist(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: str
    passport_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    nationality: str
    emergency_contact_name: str
    emergency_contact_phone: str
    location: List[float]  # [latitude, longitude]
    status: str = Field(default="safe", pattern="^(safe|alert|emergency)$")
    safety_score: int = Field(default=100, ge=0, le=100)
    last_update: datetime
    created_at: datetime

class Incident(BaseModel):
    id: str
    tourist_id: str
    tourist_name: str
    type: str
    description: str
    location: List[float]  # [latitude, longitude]
    severity: str = Field(pattern="^(low|medium|high)$")
    status: str = Field(default="active", pattern="^(active|investigating|resolved)$")
    created_at: datetime
    updated_at: datetime
    assigned_officer: Optional[str] = None

# Utility Functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_TIME_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def user_dict_to_response(user_dict: dict) -> UserResponse:
    """Convert user dict from MongoDB to UserResponse"""
    return UserResponse(
        id=str(user_dict["_id"]),
        username=user_dict["username"],
        email=user_dict["email"],
        full_name=user_dict["full_name"],
        phone=user_dict["phone"],
        department=user_dict["department"],
        rank=user_dict["rank"],
        station_id=user_dict["station_id"],
        role=user_dict["role"],
        is_active=user_dict["is_active"],
        created_at=user_dict["created_at"],
        last_login=user_dict.get("last_login")
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Create indexes on startup"""
    # Create unique indexes
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    await tourists_collection.create_index("passport_number", unique=True, sparse=True)
    await tourists_collection.create_index("aadhaar_number", unique=True, sparse=True)
    
    # Create default admin user if doesn't exist
    admin_exists = await users_collection.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = {
            "username": "admin",
            "email": "admin@police.gov.in",
            "password": hash_password("admin123"),
            "full_name": "System Administrator",
            "phone": "+91-9999999999",
            "department": "IT Department",
            "rank": "Administrator",
            "station_id": "ADMIN001",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await users_collection.insert_one(admin_user)
        print("Default admin user created: admin/admin123")

# Authentication Routes
@app.post("/api/auth/register", response_model=UserResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        # Check if username or email already exists
        existing_user = await users_collection.find_one({
            "$or": [
                {"username": user_data.username},
                {"email": user_data.email}
            ]
        })
        
        if existing_user:
            if existing_user["username"] == user_data.username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "department": user_data.department,
            "rank": user_data.rank,
            "station_id": user_data.station_id,
            "role": user_data.role,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        
        # Get created user
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        
        return user_dict_to_response(created_user)
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_user(user_credentials: UserLogin):
    """Login user and return JWT token"""
    # Find user
    user = await users_collection.find_one({"username": user_credentials.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check if user is active
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["username"]})
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_dict_to_response(updated_user)
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return user_dict_to_response(current_user)

@app.post("/api/auth/logout")
async def logout_user(current_user = Depends(get_current_user)):
    """Logout user (invalidate token - in production, maintain a blacklist)"""
    return {"message": "Successfully logged out"}

# User Management Routes
@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(current_user = Depends(get_current_user)):
    """Get all users (admin only)"""
    if current_user["role"] not in ["admin", "supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_cursor = users_collection.find({})
    users = await users_cursor.to_list(length=None)
    
    return [user_dict_to_response(user) for user in users]

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str, current_user = Depends(get_current_user)):
    """Get user by ID"""
    if current_user["role"] not in ["admin", "supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user_dict_to_response(user)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )

@app.put("/api/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user = Depends(get_current_user)):
    """Deactivate user (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User deactivated successfully"}
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )

# Dashboard Data Routes (Mock data for now - replace with real data later)
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user = Depends(get_current_user)):
    """Get dashboard statistics"""
    # Mock data - replace with actual database queries
    stats = {
        "active_tourists": 4,
        "active_incidents": 1,
        "safe_tourists": 3,
        "efirs_today": 3,
        "total_users": await users_collection.count_documents({}),
        "last_updated": datetime.utcnow()
    }
    return stats

@app.get("/api/tourists")
async def get_tourists(current_user = Depends(get_current_user)):
    """Get all tourists"""
    # Mock data for now
    mock_tourists = [
        {
            "id": "1",
            "name": "John Doe",
            "location": [28.6139, 77.2090],
            "status": "safe",
            "lastUpdate": "2 mins ago",
            "phone": "+91-9876543210",
            "safetyScore": 85
        },
        {
            "id": "2",
            "name": "Sarah Smith",
            "location": [28.6129, 77.2295],
            "status": "alert",
            "lastUpdate": "5 mins ago",
            "phone": "+91-9876543211",
            "safetyScore": 60
        },
        {
            "id": "3",
            "name": "Mike Johnson",
            "location": [28.6169, 77.2310],
            "status": "emergency",
            "lastUpdate": "1 min ago",
            "phone": "+91-9876543212",
            "safetyScore": 30
        },
        {
            "id": "4",
            "name": "Emma Wilson",
            "location": [28.6200, 77.2100],
            "status": "safe",
            "lastUpdate": "3 mins ago",
            "phone": "+91-9876543213",
            "safetyScore": 90
        }
    ]
    return mock_tourists

@app.get("/api/incidents")
async def get_incidents(current_user = Depends(get_current_user)):
    """Get all incidents"""
    # Mock data for now
    mock_incidents = [
        {
            "id": "INC001",
            "touristName": "Mike Johnson",
            "type": "Emergency Alert",
            "location": [28.6169, 77.2310],
            "timestamp": "2024-09-25 14:30",
            "status": "active",
            "severity": "high"
        },
        {
            "id": "INC002",
            "touristName": "Sarah Smith",
            "type": "Geo-fence Violation",
            "location": [28.6129, 77.2295],
            "timestamp": "2024-09-25 14:25",
            "status": "investigating",
            "severity": "medium"
        },
        {
            "id": "INC003",
            "touristName": "Alex Brown",
            "type": "Inactivity Alert",
            "location": [28.6150, 77.2200],
            "timestamp": "2024-09-25 13:45",
            "status": "resolved",
            "severity": "low"
        }
    ]
    return mock_incidents

# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database_connection": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )