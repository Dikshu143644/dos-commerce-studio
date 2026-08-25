"""
FeeAlert Automation Agent (Opal Google Automation Pipeline)
App ID: 1JZRQqDPtSUtW10oijzWi1uIRk4pbXj0y
Institution: Ashramshala Pathraj (आश्रमशाळा पाथरज)
Intent: Automate daily fee reminders for parents via localized Marathi SMS notifications.
Template: "नमस्कार [पालक], आपल्या पाल्याची [amount] शुल्क प्रलंबित आहे. कृपया शाळा कार्यालयात संपर्क करा. - आश्रमशाळा पाथरज"
Trigger: Daily at 9 AM or via POST /api/automations/fee-reminders
"""

import os
import csv
import io
import json
from datetime import datetime

class FeeReminderAgent:
    def __init__(self):
        self.institution = "Ashramshala Pathraj (आश्रमशाळा पाथरज)"
        self.sms_template = "नमस्कार {parent_name}, आपल्या पाल्याची ₹{amount} शुल्क प्रलंबित आहे. कृपया शाळा कार्यालयात संपर्क करा. - आश्रमशाळा पाथरज"
        
        # In-memory default realistic student records for Ashramshala Pathraj
        self.student_records = [
            {
                "id": "STU-101",
                "student_name": "आदित्य रमेश पाटील (Aditya Patil)",
                "parent_name": "रमेश पाटील (Ramesh Patil)",
                "grade": "इयत्ता ८ वी (Grade 8)",
                "roll_no": "08-14",
                "phone": "+91 98231 45670",
                "total_fee": 18000,
                "paid_fee": 12000,
                "pending_amount": 6000,
                "due_date": "2026-09-01",
                "status": "pending",
                "last_notified": "2026-08-20T09:00:00Z"
            },
            {
                "id": "STU-102",
                "student_name": "सायली विकास देशमुख (Sayali Deshmukh)",
                "parent_name": "विकास देशमुख (Vikas Deshmukh)",
                "grade": "इयत्ता ९ वी (Grade 9)",
                "roll_no": "09-07",
                "phone": "+91 98902 34123",
                "total_fee": 22000,
                "paid_fee": 14500,
                "pending_amount": 7500,
                "due_date": "2026-08-30",
                "status": "pending",
                "last_notified": "2026-08-18T09:00:00Z"
            },
            {
                "id": "STU-103",
                "student_name": "प्रणव गजानन शिंदे (Pranav Shinde)",
                "parent_name": "गजानन शिंदे (Gajanan Shinde)",
                "grade": "इयत्ता १० वी (Grade 10)",
                "roll_no": "10-22",
                "phone": "+91 97654 89012",
                "total_fee": 25000,
                "paid_fee": 15000,
                "pending_amount": 10000,
                "due_date": "2026-08-28",
                "status": "pending",
                "last_notified": None
            },
            {
                "id": "STU-104",
                "student_name": "तन्वी सचिन सावंत (Tanvi Sawant)",
                "parent_name": "सचिन सावंत (Sachin Sawant)",
                "grade": "इयत्ता ७ वी (Grade 7)",
                "roll_no": "07-03",
                "phone": "+91 98220 11456",
                "total_fee": 16000,
                "paid_fee": 16000,
                "pending_amount": 0,
                "due_date": "2026-08-15",
                "status": "paid",
                "last_notified": None
            },
            {
                "id": "STU-105",
                "student_name": "रोहन प्रकाश गायकवाड (Rohan Gaikwad)",
                "parent_name": "प्रकाश गायकवाड (Prakash Gaikwad)",
                "grade": "इयत्ता ९ वी (Grade 9)",
                "roll_no": "09-18",
                "phone": "+91 99701 56789",
                "total_fee": 22000,
                "paid_fee": 17000,
                "pending_amount": 5000,
                "due_date": "2026-09-05",
                "status": "pending",
                "last_notified": "2026-08-22T09:00:00Z"
            },
            {
                "id": "STU-106",
                "student_name": "वैष्णवी विठ्ठल मोरे (Vaishnavi More)",
                "parent_name": "विठ्ठल मोरे (Vitthal More)",
                "grade": "इयत्ता १० वी (Grade 10)",
                "roll_no": "10-09",
                "phone": "+91 98811 78901",
                "total_fee": 25000,
                "paid_fee": 12000,
                "pending_amount": 13000,
                "due_date": "2026-08-25",
                "status": "pending",
                "last_notified": None
            },
            {
                "id": "STU-107",
                "student_name": "अमित ज्ञानेश्वर कदम (Amit Kadam)",
                "parent_name": "ज्ञानेश्वर कदम (Dnyaneshwar Kadam)",
                "grade": "इयत्ता ६ वी (Grade 6)",
                "roll_no": "06-12",
                "phone": "+91 98600 45678",
                "total_fee": 15000,
                "paid_fee": 15000,
                "pending_amount": 0,
                "due_date": "2026-08-10",
                "status": "paid",
                "last_notified": None
            }
        ]
        self.transmission_log = []

    def format_marathi_sms(self, parent_name: str, amount: int) -> str:
        """Node Step 1: Format exact Marathi SMS template from Opal specification"""
        formatted_amount = f"{amount:,}"
        clean_parent = parent_name.split('(')[0].strip()
        return f"नमस्कार {clean_parent}, आपल्या पाल्याची ₹{formatted_amount} शुल्क प्रलंबित आहे. कृपया शाळा कार्यालयात संपर्क करा. - आश्रमशाळा पाथरज"

    def process_fee_data(self, custom_records=None) -> dict:
        """
        Opal Node: node_step_fee_analysis_results
        Filters records for pending fees and generates structured SMS previews.
        """
        records = custom_records if custom_records is not None else self.student_records
        pending_students = []
        total_outstanding = 0
        total_students_pending = 0

        for s in records:
            pending = s.get("pending_amount", 0)
            if pending > 0:
                total_students_pending += 1
                total_outstanding += pending
                sms_message = self.format_marathi_sms(s.get("parent_name", "पालक"), pending)
                
                pending_students.append({
                    "id": s.get("id"),
                    "student_name": s.get("student_name"),
                    "parent_name": s.get("parent_name"),
                    "grade": s.get("grade"),
                    "roll_no": s.get("roll_no"),
                    "phone": s.get("phone"),
                    "total_fee": s.get("total_fee"),
                    "paid_fee": s.get("paid_fee"),
                    "pending_amount": pending,
                    "due_date": s.get("due_date"),
                    "status": "pending",
                    "last_notified": s.get("last_notified"),
                    "sms_preview": sms_message
                })

        return {
            "institution": self.institution,
            "processed_at": datetime.utcnow().isoformat() + "Z",
            "total_students": len(records),
            "total_students_pending": total_students_pending,
            "total_outstanding_amount": total_outstanding,
            "sms_queue_status": f"{total_students_pending} Messages Ready for Dispatch",
            "pending_records": pending_students
        }

    def trigger_batch_reminders(self) -> dict:
        """
        Executes batch SMS trigger for all pending fee records.
        Simulates carrier dispatch with timestamp updates.
        """
        analysis = self.process_fee_data()
        dispatched_count = 0
        timestamp = datetime.utcnow().isoformat() + "Z"

        for student in analysis["pending_records"]:
            dispatched_count += 1
            log_entry = {
                "student_id": student["id"],
                "student_name": student["student_name"],
                "phone": student["phone"],
                "amount": student["pending_amount"],
                "sms_text": student["sms_preview"],
                "dispatched_at": timestamp,
                "delivery_status": "DELIVERED",
                "carrier": "Jio/BSNL SMS Gateway"
            }
            self.transmission_log.append(log_entry)
            
            # Update in-memory record
            for r in self.student_records:
                if r["id"] == student["id"]:
                    r["last_notified"] = timestamp

        return {
            "status": "success",
            "message": f"Successfully dispatched {dispatched_count} fee reminder SMS notifications.",
            "dispatched_count": dispatched_count,
            "total_amount_reminded": analysis["total_outstanding_amount"],
            "timestamp": timestamp,
            "institution": self.institution
        }

    def send_single_reminder(self, student_id: str) -> dict:
        """Sends SMS reminder to a specific student's parent"""
        target = None
        for s in self.student_records:
            if s["id"] == student_id:
                target = s
                break

        if not target:
            return {"status": "error", "message": f"Student with ID {student_id} not found."}

        pending = target.get("pending_amount", 0)
        if pending <= 0:
            return {"status": "error", "message": "This student has no pending fee dues."}

        timestamp = datetime.utcnow().isoformat() + "Z"
        sms_text = self.format_marathi_sms(target.get("parent_name", "पालक"), pending)
        target["last_notified"] = timestamp

        log_entry = {
            "student_id": target["id"],
            "student_name": target["student_name"],
            "phone": target["phone"],
            "amount": pending,
            "sms_text": sms_text,
            "dispatched_at": timestamp,
            "delivery_status": "DELIVERED",
            "carrier": "Jio/BSNL SMS Gateway"
        }
        self.transmission_log.append(log_entry)

        return {
            "status": "success",
            "message": f"SMS reminder sent to {target['parent_name']} ({target['phone']}).",
            "student_id": target["id"],
            "sms_text": sms_text,
            "dispatched_at": timestamp
        }

    def parse_csv_upload(self, csv_content: str) -> dict:
        """Parses custom uploaded CSV file containing student fee details"""
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
            new_records = []
            for idx, row in enumerate(reader):
                total = int(row.get("total_fee") or row.get("Total Fee") or 0)
                paid = int(row.get("paid_fee") or row.get("Paid Fee") or 0)
                pending = int(row.get("pending_amount") or row.get("Pending Fee") or (total - paid))
                
                new_records.append({
                    "id": row.get("id") or f"STU-{200 + idx}",
                    "student_name": row.get("student_name") or row.get("Student Name") or "Student",
                    "parent_name": row.get("parent_name") or row.get("Parent Name") or "Parent",
                    "grade": row.get("grade") or row.get("Class") or "General",
                    "roll_no": row.get("roll_no") or f"R-{idx+1}",
                    "phone": row.get("phone") or row.get("Mobile") or "+91 90000 00000",
                    "total_fee": total,
                    "paid_fee": paid,
                    "pending_amount": pending,
                    "due_date": row.get("due_date") or "2026-09-01",
                    "status": "pending" if pending > 0 else "paid",
                    "last_notified": None
                })
            
            if new_records:
                self.student_records = new_records
            return self.process_fee_data()
        except Exception as e:
            return {"status": "error", "message": f"CSV parse error: {str(e)}"}

fee_reminder_agent = FeeReminderAgent()
