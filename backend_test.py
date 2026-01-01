#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Yoga Training App
Tests all backend endpoints with realistic data
"""

import requests
import json
import base64
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://yogaposture.preview.emergentagent.com/api"
TIMEOUT = 30

class YogaAppTester:
    def __init__(self):
        self.instructor_token = None
        self.student_token = None
        self.instructor_id = None
        self.student_id = None
        self.diet_plan_id = None
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_health_check(self):
        """Test basic health endpoint"""
        self.log("Testing health check endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                self.log("✅ Health check passed")
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Health check error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration for both instructor and student"""
        self.log("Testing user registration...")
        
        # Register instructor
        instructor_data = {
            "email": "sarah.instructor@yogaapp.com",
            "password": "YogaTeacher123!",
            "name": "Sarah Johnson",
            "role": "instructor",
            "phone": "+1-555-0123"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=instructor_data)
            if response.status_code == 200:
                data = response.json()
                self.instructor_token = data["token"]
                self.instructor_id = data["user"]["id"]
                self.log("✅ Instructor registration successful")
            else:
                self.log(f"❌ Instructor registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Instructor registration error: {str(e)}")
            return False
        
        # Register student
        student_data = {
            "email": "mike.student@yogaapp.com",
            "password": "YogaStudent456!",
            "name": "Mike Chen",
            "role": "student",
            "phone": "+1-555-0456"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=student_data)
            if response.status_code == 200:
                data = response.json()
                self.student_token = data["token"]
                self.student_id = data["user"]["id"]
                self.log("✅ Student registration successful")
                return True
            else:
                self.log(f"❌ Student registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Student registration error: {str(e)}")
            return False
    
    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        self.log("Testing duplicate email registration...")
        
        duplicate_data = {
            "email": "sarah.instructor@yogaapp.com",  # Same as instructor
            "password": "AnotherPassword123!",
            "name": "Another Sarah",
            "role": "student"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=duplicate_data)
            if response.status_code == 400:
                self.log("✅ Duplicate email registration properly rejected")
                return True
            else:
                self.log(f"❌ Duplicate email registration should have failed but got: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Duplicate registration test error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login for both users"""
        self.log("Testing user login...")
        
        # Test instructor login
        instructor_login = {
            "email": "sarah.instructor@yogaapp.com",
            "password": "YogaTeacher123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=instructor_login)
            if response.status_code == 200:
                self.log("✅ Instructor login successful")
            else:
                self.log(f"❌ Instructor login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Instructor login error: {str(e)}")
            return False
        
        # Test student login
        student_login = {
            "email": "mike.student@yogaapp.com",
            "password": "YogaStudent456!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=student_login)
            if response.status_code == 200:
                self.log("✅ Student login successful")
                return True
            else:
                self.log(f"❌ Student login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Student login error: {str(e)}")
            return False
    
    def test_invalid_login(self):
        """Test invalid credentials"""
        self.log("Testing invalid login credentials...")
        
        invalid_login = {
            "email": "sarah.instructor@yogaapp.com",
            "password": "WrongPassword123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=invalid_login)
            if response.status_code == 401:
                self.log("✅ Invalid credentials properly rejected")
                return True
            else:
                self.log(f"❌ Invalid login should have failed but got: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Invalid login test error: {str(e)}")
            return False
    
    def test_get_students(self):
        """Test getting list of students"""
        self.log("Testing get students endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/users/students")
            if response.status_code == 200:
                students = response.json()
                if len(students) > 0:
                    self.log(f"✅ Retrieved {len(students)} students")
                    return True
                else:
                    self.log("❌ No students found")
                    return False
            else:
                self.log(f"❌ Get students failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get students error: {str(e)}")
            return False
    
    def test_diet_plans(self):
        """Test diet plan CRUD operations"""
        self.log("Testing diet plan operations...")
        
        # Create diet plan as instructor
        diet_plan_data = {
            "student_id": self.student_id,
            "title": "Beginner Yoga Nutrition Plan",
            "description": "A balanced nutrition plan for yoga beginners focusing on flexibility and energy",
            "meals": [
                {
                    "meal_type": "breakfast",
                    "items": ["Oatmeal with berries", "Green tea", "Almonds"],
                    "calories": 350
                },
                {
                    "meal_type": "lunch", 
                    "items": ["Quinoa salad", "Grilled chicken", "Avocado"],
                    "calories": 450
                },
                {
                    "meal_type": "dinner",
                    "items": ["Salmon", "Steamed vegetables", "Brown rice"],
                    "calories": 400
                },
                {
                    "meal_type": "snack",
                    "items": ["Greek yogurt", "Honey", "Walnuts"],
                    "calories": 200
                }
            ],
            "total_calories": 1400,
            "duration_days": 30,
            "notes": "Drink plenty of water and avoid processed foods"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/diet-plans?instructor_id={self.instructor_id}",
                json=diet_plan_data
            )
            if response.status_code == 200:
                plan = response.json()
                self.diet_plan_id = plan["id"]
                self.log("✅ Diet plan created successfully")
            else:
                self.log(f"❌ Diet plan creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Diet plan creation error: {str(e)}")
            return False
        
        # Get instructor's diet plans
        try:
            response = self.session.get(
                f"{BASE_URL}/diet-plans/my-plans?user_id={self.instructor_id}&role=instructor"
            )
            if response.status_code == 200:
                plans = response.json()
                if len(plans) > 0:
                    self.log(f"✅ Instructor retrieved {len(plans)} diet plans")
                else:
                    self.log("❌ No diet plans found for instructor")
                    return False
            else:
                self.log(f"❌ Get instructor plans failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get instructor plans error: {str(e)}")
            return False
        
        # Get student's diet plans
        try:
            response = self.session.get(
                f"{BASE_URL}/diet-plans/my-plans?user_id={self.student_id}&role=student"
            )
            if response.status_code == 200:
                plans = response.json()
                if len(plans) > 0:
                    self.log(f"✅ Student retrieved {len(plans)} assigned diet plans")
                else:
                    self.log("❌ No diet plans found for student")
                    return False
            else:
                self.log(f"❌ Get student plans failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get student plans error: {str(e)}")
            return False
        
        return True
    
    def test_health_metrics(self):
        """Test health metrics operations"""
        self.log("Testing health metrics operations...")
        
        # Create sample progress photo (small base64 image)
        sample_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Add health metric with weight and height (should auto-calculate BMI)
        health_data = {
            "weight": 70.5,
            "height": 175.0,
            "chest": 95.0,
            "waist": 80.0,
            "hips": 98.0,
            "progress_photo": sample_image_b64
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/health-metrics?user_id={self.student_id}",
                json=health_data
            )
            if response.status_code == 200:
                metric = response.json()
                if metric.get("bmi"):
                    expected_bmi = round(70.5 / (1.75 * 1.75), 2)
                    if abs(metric["bmi"] - expected_bmi) < 0.1:
                        self.log(f"✅ Health metric added with correct BMI calculation: {metric['bmi']}")
                    else:
                        self.log(f"❌ BMI calculation incorrect. Expected: {expected_bmi}, Got: {metric['bmi']}")
                        return False
                else:
                    self.log("❌ BMI not calculated")
                    return False
            else:
                self.log(f"❌ Health metric creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Health metric creation error: {str(e)}")
            return False
        
        # Add another health metric (different day)
        time.sleep(1)  # Ensure different timestamp
        health_data2 = {
            "weight": 69.8,
            "height": 175.0,
            "chest": 94.5,
            "waist": 79.5,
            "hips": 97.5
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/health-metrics?user_id={self.student_id}",
                json=health_data2
            )
            if response.status_code == 200:
                self.log("✅ Second health metric added successfully")
            else:
                self.log(f"❌ Second health metric creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Second health metric creation error: {str(e)}")
            return False
        
        # Get all health metrics
        try:
            response = self.session.get(f"{BASE_URL}/health-metrics?user_id={self.student_id}")
            if response.status_code == 200:
                metrics = response.json()
                if len(metrics) >= 2:
                    self.log(f"✅ Retrieved {len(metrics)} health metrics")
                else:
                    self.log(f"❌ Expected at least 2 health metrics, got {len(metrics)}")
                    return False
            else:
                self.log(f"❌ Get health metrics failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get health metrics error: {str(e)}")
            return False
        
        # Get latest health metric
        try:
            response = self.session.get(f"{BASE_URL}/health-metrics/latest?user_id={self.student_id}")
            if response.status_code == 200:
                latest = response.json()
                if latest and latest.get("weight") == 69.8:
                    self.log("✅ Latest health metric retrieved correctly")
                else:
                    self.log("❌ Latest health metric not correct")
                    return False
            else:
                self.log(f"❌ Get latest health metric failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get latest health metric error: {str(e)}")
            return False
        
        return True
    
    def test_workouts(self):
        """Test workout operations"""
        self.log("Testing workout operations...")
        
        # Log first workout
        workout1 = {
            "workout_type": "yoga",
            "duration_minutes": 45,
            "calories_burned": 180,
            "notes": "Morning Hatha yoga session - focused on sun salutations"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/workouts?user_id={self.student_id}",
                json=workout1
            )
            if response.status_code == 200:
                self.log("✅ First workout logged successfully")
            else:
                self.log(f"❌ First workout logging failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ First workout logging error: {str(e)}")
            return False
        
        # Log second workout (different type)
        time.sleep(1)  # Ensure different timestamp
        workout2 = {
            "workout_type": "flexibility",
            "duration_minutes": 30,
            "calories_burned": 120,
            "notes": "Evening flexibility training - hip openers and backbends"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/workouts?user_id={self.student_id}",
                json=workout2
            )
            if response.status_code == 200:
                self.log("✅ Second workout logged successfully")
            else:
                self.log(f"❌ Second workout logging failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Second workout logging error: {str(e)}")
            return False
        
        # Get workout history
        try:
            response = self.session.get(f"{BASE_URL}/workouts?user_id={self.student_id}")
            if response.status_code == 200:
                workouts = response.json()
                if len(workouts) >= 2:
                    self.log(f"✅ Retrieved {len(workouts)} workouts from history")
                else:
                    self.log(f"❌ Expected at least 2 workouts, got {len(workouts)}")
                    return False
            else:
                self.log(f"❌ Get workout history failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get workout history error: {str(e)}")
            return False
        
        # Get workout stats
        try:
            response = self.session.get(f"{BASE_URL}/workouts/stats?user_id={self.student_id}")
            if response.status_code == 200:
                stats = response.json()
                expected_total = 75  # 45 + 30 minutes
                expected_workouts = 2
                
                if (stats.get("total_workouts") == expected_workouts and 
                    stats.get("total_minutes") == expected_total):
                    self.log(f"✅ Workout stats correct: {stats}")
                else:
                    self.log(f"❌ Workout stats incorrect. Expected: {expected_workouts} workouts, {expected_total} minutes. Got: {stats}")
                    return False
            else:
                self.log(f"❌ Get workout stats failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get workout stats error: {str(e)}")
            return False
        
        return True
    
    def test_flexibility_scores(self):
        """Test flexibility score operations"""
        self.log("Testing flexibility score operations...")
        
        # Add first flexibility score
        score1 = {
            "pose_name": "Downward Dog",
            "score": 85.5,
            "pose_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "feedback": "Great alignment! Try to straighten your legs more for better stretch."
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/flexibility-scores?user_id={self.student_id}",
                json=score1
            )
            if response.status_code == 200:
                self.log("✅ First flexibility score added successfully")
            else:
                self.log(f"❌ First flexibility score failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ First flexibility score error: {str(e)}")
            return False
        
        # Add second flexibility score
        time.sleep(1)  # Ensure different timestamp
        score2 = {
            "pose_name": "Warrior II",
            "score": 78.0,
            "feedback": "Good foundation. Work on opening your hips more."
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/flexibility-scores?user_id={self.student_id}",
                json=score2
            )
            if response.status_code == 200:
                self.log("✅ Second flexibility score added successfully")
            else:
                self.log(f"❌ Second flexibility score failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Second flexibility score error: {str(e)}")
            return False
        
        # Get all flexibility scores
        try:
            response = self.session.get(f"{BASE_URL}/flexibility-scores?user_id={self.student_id}")
            if response.status_code == 200:
                scores = response.json()
                if len(scores) >= 2:
                    self.log(f"✅ Retrieved {len(scores)} flexibility scores")
                else:
                    self.log(f"❌ Expected at least 2 flexibility scores, got {len(scores)}")
                    return False
            else:
                self.log(f"❌ Get flexibility scores failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get flexibility scores error: {str(e)}")
            return False
        
        # Get average flexibility score
        try:
            response = self.session.get(f"{BASE_URL}/flexibility-scores/average?user_id={self.student_id}")
            if response.status_code == 200:
                avg_data = response.json()
                expected_avg = (85.5 + 78.0) / 2
                
                if (avg_data.get("total_assessments") == 2 and 
                    abs(avg_data.get("average_score", 0) - expected_avg) < 0.1):
                    self.log(f"✅ Average flexibility score correct: {avg_data}")
                else:
                    self.log(f"❌ Average flexibility score incorrect. Expected avg: {expected_avg}, Got: {avg_data}")
                    return False
            else:
                self.log(f"❌ Get average flexibility failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get average flexibility error: {str(e)}")
            return False
        
        return True
    
    def test_video_sessions(self):
        """Test video session operations"""
        self.log("Testing video session operations...")
        
        # Create video session
        future_time = datetime.utcnow() + timedelta(hours=2)
        session_data = {
            "instructor_id": self.instructor_id,
            "student_id": self.student_id,
            "scheduled_at": future_time.isoformat()
        }
        
        session_id = None
        try:
            response = self.session.post(f"{BASE_URL}/video-sessions", json=session_data)
            if response.status_code == 200:
                session = response.json()
                session_id = session["id"]
                if session.get("room_id") and session.get("status") == "scheduled":
                    self.log(f"✅ Video session created with room ID: {session['room_id']}")
                else:
                    self.log("❌ Video session missing room_id or incorrect status")
                    return False
            else:
                self.log(f"❌ Video session creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Video session creation error: {str(e)}")
            return False
        
        # Get instructor's video sessions
        try:
            response = self.session.get(
                f"{BASE_URL}/video-sessions?user_id={self.instructor_id}&role=instructor"
            )
            if response.status_code == 200:
                sessions = response.json()
                if len(sessions) > 0:
                    self.log(f"✅ Instructor retrieved {len(sessions)} video sessions")
                else:
                    self.log("❌ No video sessions found for instructor")
                    return False
            else:
                self.log(f"❌ Get instructor sessions failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get instructor sessions error: {str(e)}")
            return False
        
        # Get student's video sessions
        try:
            response = self.session.get(
                f"{BASE_URL}/video-sessions?user_id={self.student_id}&role=student"
            )
            if response.status_code == 200:
                sessions = response.json()
                if len(sessions) > 0:
                    self.log(f"✅ Student retrieved {len(sessions)} video sessions")
                else:
                    self.log("❌ No video sessions found for student")
                    return False
            else:
                self.log(f"❌ Get student sessions failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Get student sessions error: {str(e)}")
            return False
        
        # Update session status
        if session_id:
            try:
                response = self.session.patch(
                    f"{BASE_URL}/video-sessions/{session_id}/status",
                    json={"status": "active"}
                )
                if response.status_code == 200:
                    self.log("✅ Video session status updated to active")
                else:
                    self.log(f"❌ Session status update failed: {response.status_code} - {response.text}")
                    return False
            except Exception as e:
                self.log(f"❌ Session status update error: {str(e)}")
                return False
        
        return True
    
    def test_diet_plan_deletion(self):
        """Test diet plan deletion"""
        self.log("Testing diet plan deletion...")
        
        if not self.diet_plan_id:
            self.log("❌ No diet plan ID available for deletion test")
            return False
        
        try:
            response = self.session.delete(f"{BASE_URL}/diet-plans/{self.diet_plan_id}")
            if response.status_code == 200:
                self.log("✅ Diet plan deleted successfully")
                
                # Verify deletion by trying to get instructor's plans
                response = self.session.get(
                    f"{BASE_URL}/diet-plans/my-plans?user_id={self.instructor_id}&role=instructor"
                )
                if response.status_code == 200:
                    plans = response.json()
                    deleted_plan_exists = any(plan["id"] == self.diet_plan_id for plan in plans)
                    if not deleted_plan_exists:
                        self.log("✅ Diet plan deletion verified")
                        return True
                    else:
                        self.log("❌ Diet plan still exists after deletion")
                        return False
                else:
                    self.log("❌ Could not verify diet plan deletion")
                    return False
            else:
                self.log(f"❌ Diet plan deletion failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Diet plan deletion error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting comprehensive backend API testing...")
        self.log(f"Testing against: {BASE_URL}")
        
        test_results = {}
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("Duplicate Registration", self.test_duplicate_registration),
            ("User Login", self.test_user_login),
            ("Invalid Login", self.test_invalid_login),
            ("Get Students", self.test_get_students),
            ("Diet Plans CRUD", self.test_diet_plans),
            ("Health Metrics", self.test_health_metrics),
            ("Workout Logging", self.test_workouts),
            ("Flexibility Scores", self.test_flexibility_scores),
            ("Video Sessions", self.test_video_sessions),
            ("Diet Plan Deletion", self.test_diet_plan_deletion),
        ]
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*50}")
            self.log(f"Running: {test_name}")
            self.log('='*50)
            
            try:
                result = test_func()
                test_results[test_name] = result
                if result:
                    self.log(f"✅ {test_name} PASSED")
                else:
                    self.log(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log(f"❌ {test_name} ERROR: {str(e)}")
                test_results[test_name] = False
        
        # Summary
        self.log(f"\n{'='*60}")
        self.log("TEST SUMMARY")
        self.log('='*60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name:<25} {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Backend API is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} tests failed. Please check the issues above.")
        
        return test_results

if __name__ == "__main__":
    tester = YogaAppTester()
    results = tester.run_all_tests()