from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRole(str):
    INSTRUCTOR = "instructor"
    STUDENT = "student"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["instructor", "student"]
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DietPlan(BaseModel):
    id: str
    instructor_id: str
    student_id: str
    student_name: str
    title: str
    description: str
    meals: List[dict]  # [{meal_type: "breakfast", items: ["oats", "fruits"], calories: 300}]
    total_calories: int
    duration_days: int
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DietPlanCreate(BaseModel):
    student_id: str
    title: str
    description: str
    meals: List[dict]
    total_calories: int
    duration_days: int
    notes: Optional[str] = None

class HealthMetric(BaseModel):
    id: str
    user_id: str
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    progress_photo: Optional[str] = None  # base64 image
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class HealthMetricCreate(BaseModel):
    weight: Optional[float] = None
    height: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    progress_photo: Optional[str] = None

class WorkoutSession(BaseModel):
    id: str
    user_id: str
    workout_type: str  # "yoga", "flexibility", "strength"
    duration_minutes: int
    calories_burned: Optional[int] = None
    notes: Optional[str] = None
    completed_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutSessionCreate(BaseModel):
    workout_type: str
    duration_minutes: int
    calories_burned: Optional[int] = None
    notes: Optional[str] = None

class FlexibilityScore(BaseModel):
    id: str
    user_id: str
    pose_name: str
    score: float  # 0-100
    pose_image: Optional[str] = None  # base64 image
    feedback: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class FlexibilityScoreCreate(BaseModel):
    pose_name: str
    score: float
    pose_image: Optional[str] = None
    feedback: Optional[str] = None

class VideoSession(BaseModel):
    id: str
    instructor_id: str
    student_id: str
    room_id: str
    status: Literal["scheduled", "active", "completed", "cancelled"]
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoSessionCreate(BaseModel):
    instructor_id: str
    student_id: str
    scheduled_at: datetime

# ==================== HELPER FUNCTIONS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user_by_email(email: str):
    user = await db.users.find_one({"email": email})
    return user

def calculate_bmi(weight: float, height: float) -> float:
    """Calculate BMI from weight (kg) and height (cm)"""
    if height > 0:
        height_m = height / 100
        return round(weight / (height_m * height_m), 2)
    return 0

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    from bson import ObjectId
    user_id = str(ObjectId())
    user_dict = {
        "_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": user_data.role,
        "phone": user_data.phone,
        "avatar": None,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user_id, "role": user_data.role})
    
    return {
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role,
            "phone": user_data.phone
        },
        "token": token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await get_user_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    
    return {
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "phone": user.get("phone"),
            "avatar": user.get("avatar")
        },
        "token": token
    }

@api_router.get("/users/students")
async def get_students():
    """Get all students for instructors to assign diet plans"""
    students = await db.users.find({"role": "student"}).to_list(1000)
    return [{"id": s["_id"], "name": s["name"], "email": s["email"]} for s in students]

# ==================== DIET PLAN ROUTES ====================

@api_router.post("/diet-plans")
async def create_diet_plan(plan: DietPlanCreate, instructor_id: str):
    from bson import ObjectId
    
    # Get student name
    student = await db.users.find_one({"_id": plan.student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    plan_id = str(ObjectId())
    plan_dict = {
        "_id": plan_id,
        "instructor_id": instructor_id,
        "student_id": plan.student_id,
        "student_name": student["name"],
        "title": plan.title,
        "description": plan.description,
        "meals": plan.meals,
        "total_calories": plan.total_calories,
        "duration_days": plan.duration_days,
        "notes": plan.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.diet_plans.insert_one(plan_dict)
    plan_dict["id"] = plan_dict.pop("_id")
    return plan_dict

@api_router.get("/diet-plans/my-plans")
async def get_my_diet_plans(user_id: str, role: str):
    """Get diet plans - students see their assigned plans, instructors see all their created plans"""
    if role == "student":
        plans = await db.diet_plans.find({"student_id": user_id}).sort("created_at", -1).to_list(1000)
    else:
        plans = await db.diet_plans.find({"instructor_id": user_id}).sort("created_at", -1).to_list(1000)
    
    for plan in plans:
        plan["id"] = plan.pop("_id")
    return plans

@api_router.delete("/diet-plans/{plan_id}")
async def delete_diet_plan(plan_id: str):
    result = await db.diet_plans.delete_one({"_id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    return {"message": "Diet plan deleted"}

# ==================== HEALTH METRICS ROUTES ====================

@api_router.post("/health-metrics")
async def add_health_metric(metric: HealthMetricCreate, user_id: str):
    from bson import ObjectId
    
    # Calculate BMI if weight and height provided
    bmi = None
    if metric.weight and metric.height:
        bmi = calculate_bmi(metric.weight, metric.height)
    
    metric_id = str(ObjectId())
    metric_dict = {
        "_id": metric_id,
        "user_id": user_id,
        "weight": metric.weight,
        "height": metric.height,
        "bmi": bmi,
        "chest": metric.chest,
        "waist": metric.waist,
        "hips": metric.hips,
        "progress_photo": metric.progress_photo,
        "recorded_at": datetime.utcnow()
    }
    
    await db.health_metrics.insert_one(metric_dict)
    metric_dict["id"] = metric_dict.pop("_id")
    return metric_dict

@api_router.get("/health-metrics")
async def get_health_metrics(user_id: str):
    metrics = await db.health_metrics.find({"user_id": user_id}).sort("recorded_at", -1).to_list(1000)
    for metric in metrics:
        metric["id"] = metric.pop("_id")
    return metrics

@api_router.get("/health-metrics/latest")
async def get_latest_health_metric(user_id: str):
    metric = await db.health_metrics.find_one({"user_id": user_id}, sort=[("recorded_at", -1)])
    if metric:
        metric["id"] = metric.pop("_id")
        return metric
    return None

# ==================== WORKOUT ROUTES ====================

@api_router.post("/workouts")
async def add_workout(workout: WorkoutSessionCreate, user_id: str):
    from bson import ObjectId
    
    workout_id = str(ObjectId())
    workout_dict = {
        "_id": workout_id,
        "user_id": user_id,
        "workout_type": workout.workout_type,
        "duration_minutes": workout.duration_minutes,
        "calories_burned": workout.calories_burned,
        "notes": workout.notes,
        "completed_at": datetime.utcnow()
    }
    
    await db.workouts.insert_one(workout_dict)
    workout_dict["id"] = workout_dict.pop("_id")
    return workout_dict

@api_router.get("/workouts")
async def get_workouts(user_id: str, limit: int = 50):
    workouts = await db.workouts.find({"user_id": user_id}).sort("completed_at", -1).limit(limit).to_list(limit)
    for workout in workouts:
        workout["id"] = workout.pop("_id")
    return workouts

@api_router.get("/workouts/stats")
async def get_workout_stats(user_id: str):
    """Get workout statistics including streak"""
    workouts = await db.workouts.find({"user_id": user_id}).sort("completed_at", -1).to_list(1000)
    
    if not workouts:
        return {
            "total_workouts": 0,
            "total_minutes": 0,
            "current_streak": 0,
            "longest_streak": 0
        }
    
    total_workouts = len(workouts)
    total_minutes = sum(w["duration_minutes"] for w in workouts)
    
    # Calculate streak
    dates = [w["completed_at"].date() for w in workouts]
    unique_dates = sorted(set(dates), reverse=True)
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 1
    
    if unique_dates:
        today = datetime.utcnow().date()
        if unique_dates[0] == today or unique_dates[0] == today - timedelta(days=1):
            current_streak = 1
            for i in range(1, len(unique_dates)):
                if unique_dates[i] == unique_dates[i-1] - timedelta(days=1):
                    current_streak += 1
                    temp_streak += 1
                else:
                    break
        
        # Calculate longest streak
        temp_streak = 1
        for i in range(1, len(unique_dates)):
            if unique_dates[i] == unique_dates[i-1] - timedelta(days=1):
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)
    
    return {
        "total_workouts": total_workouts,
        "total_minutes": total_minutes,
        "current_streak": current_streak,
        "longest_streak": longest_streak
    }

# ==================== FLEXIBILITY SCORE ROUTES ====================

@api_router.post("/flexibility-scores")
async def add_flexibility_score(score: FlexibilityScoreCreate, user_id: str):
    from bson import ObjectId
    
    score_id = str(ObjectId())
    score_dict = {
        "_id": score_id,
        "user_id": user_id,
        "pose_name": score.pose_name,
        "score": score.score,
        "pose_image": score.pose_image,
        "feedback": score.feedback,
        "recorded_at": datetime.utcnow()
    }
    
    await db.flexibility_scores.insert_one(score_dict)
    score_dict["id"] = score_dict.pop("_id")
    return score_dict

@api_router.get("/flexibility-scores")
async def get_flexibility_scores(user_id: str):
    scores = await db.flexibility_scores.find({"user_id": user_id}).sort("recorded_at", -1).to_list(1000)
    for score in scores:
        score["id"] = score.pop("_id")
    return scores

@api_router.get("/flexibility-scores/average")
async def get_average_flexibility(user_id: str):
    """Get average flexibility score"""
    scores = await db.flexibility_scores.find({"user_id": user_id}).to_list(1000)
    if not scores:
        return {"average_score": 0, "total_assessments": 0}
    
    avg = sum(s["score"] for s in scores) / len(scores)
    return {
        "average_score": round(avg, 2),
        "total_assessments": len(scores)
    }

# ==================== VIDEO SESSION ROUTES ====================

@api_router.post("/video-sessions")
async def create_video_session(session: VideoSessionCreate):
    from bson import ObjectId
    import random
    import string
    
    # Generate random room ID
    room_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    session_id = str(ObjectId())
    session_dict = {
        "_id": session_id,
        "instructor_id": session.instructor_id,
        "student_id": session.student_id,
        "room_id": room_id,
        "status": "scheduled",
        "scheduled_at": session.scheduled_at,
        "started_at": None,
        "ended_at": None,
        "created_at": datetime.utcnow()
    }
    
    await db.video_sessions.insert_one(session_dict)
    session_dict["id"] = session_dict.pop("_id")
    return session_dict

@api_router.get("/video-sessions")
async def get_video_sessions(user_id: str, role: str):
    """Get video sessions for user"""
    if role == "instructor":
        sessions = await db.video_sessions.find({"instructor_id": user_id}).sort("scheduled_at", -1).to_list(1000)
    else:
        sessions = await db.video_sessions.find({"student_id": user_id}).sort("scheduled_at", -1).to_list(1000)
    
    for session in sessions:
        session["id"] = session.pop("_id")
    return sessions

@api_router.patch("/video-sessions/{session_id}/status")
async def update_session_status(session_id: str, status: str):
    """Update video session status"""
    update_data = {"status": status}
    if status == "active":
        update_data["started_at"] = datetime.utcnow()
    elif status == "completed":
        update_data["ended_at"] = datetime.utcnow()
    
    result = await db.video_sessions.update_one(
        {"_id": session_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session status updated"}

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Yoga Training API", "version": "1.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
