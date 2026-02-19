"""
EventFlow – Fraud Engine Service
Detects suspicious scanning behavior (impossible travel, burst limits).
"""

import math
from datetime import datetime
from database import get_db

class FraudEngine:
    # Configuration Constants
    MAX_SPEED_MPS = 2.5       # Max walking speed (m/s) ~ 9 km/h
    BURST_LIMIT = 3           # Max scans allowed in the window
    BURST_WINDOW_SEC = 60     # Time window for burst check
    
    def __init__(self):
        pass

    @property
    def scan_collection(self):
        return get_db().get_collection("scanevents")

    @property
    def sponsor_collection(self):
        return get_db().get_collection("sponsors")

    @property
    def fraud_collection(self):
         return get_db().get_collection("fraud_alerts")

    async def verify_scan(self, new_scan: dict):
        """
        The main entry point. Runs all checks in parallel or sequence.
        """
        student_id = new_scan["student_id"]
        
        # 1. Fetch History (Optimized: Only last 5 scans needed)
        cursor = self.scan_collection.find(
            {"student_id": student_id}
        ).sort("timestamp", -1).limit(5)
        history = await cursor.to_list(length=5)

        # If history is empty (first scan ever), they are safe.
        if not history:
            return

        # 2. Run Checks
        # We await these potentially blocking IO operations
        await self._check_velocity(new_scan, history)
        await self._check_frequency(new_scan, history)

    async def _check_velocity(self, current_scan, history):
        """
        The 'Impossible Travel' Physics Check
        """
        # The history list INCLUDES the scan we just saved (index 0). 
        # So we compare index 0 (current) with index 1 (previous).
        if len(history) < 2:
            return

        prev_scan = history[1]
        
        # Get coordinates
        curr_sponsor = await self.sponsor_collection.find_one({"_id": current_scan["sponsor_id"]})
        prev_sponsor = await self.sponsor_collection.find_one({"_id": prev_scan["sponsor_id"]})

        if not curr_sponsor or not prev_sponsor:
            return # Data integrity issue, skip check

        # Calculate Distance (Pythagorean theorem)
        x1, y1 = curr_sponsor["map_location"]["x_coord"], curr_sponsor["map_location"]["y_coord"]
        x2, y2 = prev_sponsor["map_location"]["x_coord"], prev_sponsor["map_location"]["y_coord"]
        
        distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        # Calculate Time Delta
        time_delta = (current_scan["timestamp"] - prev_scan["timestamp"]).total_seconds()
        
        if time_delta <= 0: time_delta = 1 # Avoid division by zero
        
        speed = distance / time_delta

        if speed > self.MAX_SPEED_MPS:
            await self._log_fraud(
                current_scan, 
                reason=f"Impossible Travel: {int(distance)}m in {int(time_delta)}s ({speed:.2f} m/s)",
                severity="High" if speed > 10 else "Medium"
            )

    async def _check_frequency(self, current_scan, history):
        """
        The 'Machine Gun' Burst Check
        """
        # Count scans within the last window
        window_start = current_scan["timestamp"].timestamp() - self.BURST_WINDOW_SEC
        
        recent_count = sum(
            1 for s in history 
            if s["timestamp"].timestamp() > window_start
        )

        if recent_count >= self.BURST_LIMIT:
            await self._log_fraud(
                current_scan,
                reason=f"Burst Limit Exceeded: {recent_count} scans in {self.BURST_WINDOW_SEC}s",
                severity="Low"
            )

    async def _log_fraud(self, scan, reason, severity):
        alert = {
            "student_id": scan["student_id"],
            "scan_event_id": scan["_id"],
            "reason": reason,
            "severity": severity,
            "timestamp": datetime.utcnow(),
            "status": "OPEN" # For the admin dashboard to resolve
        }
        await self.fraud_collection.insert_one(alert)
        print(f"🚨 FRAUD DETECTED: {reason}")

# Create a singleton instance for easy import
fraud_engine = FraudEngine()
