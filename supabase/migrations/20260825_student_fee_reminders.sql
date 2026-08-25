-- FeeAlert Student Fee Reminders & SMS Automation Schema
-- Opal Automation App: https://opal.google/app/1JZRQqDPtSUtW10oijzWi1uIRk4pbXj0y
-- Institution: Ashramshala Pathraj (आश्रमशाळा पाथरज)

CREATE TABLE IF NOT EXISTS public.student_fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50),
    phone VARCHAR(30) NOT NULL,
    total_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pending_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    last_notified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fee_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) REFERENCES public.student_fee_records(student_id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    pending_amount NUMERIC(12, 2) NOT NULL,
    sms_text TEXT NOT NULL,
    delivery_status VARCHAR(50) DEFAULT 'DELIVERED',
    carrier VARCHAR(100) DEFAULT 'Jio/BSNL SMS Gateway',
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_student_fee_status ON public.student_fee_records(status);
CREATE INDEX IF NOT EXISTS idx_student_fee_pending ON public.student_fee_records(pending_amount);
CREATE INDEX IF NOT EXISTS idx_fee_reminder_dispatched ON public.fee_reminder_logs(dispatched_at);

-- Row Level Security
ALTER TABLE public.student_fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on student_fee_records" ON public.student_fee_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_fee_records" ON public.student_fee_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_fee_records" ON public.student_fee_records FOR UPDATE USING (true);

CREATE POLICY "Allow public select on fee_reminder_logs" ON public.fee_reminder_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on fee_reminder_logs" ON public.fee_reminder_logs FOR INSERT WITH CHECK (true);

-- Seed Initial Realistic Records for Ashramshala Pathraj
INSERT INTO public.student_fee_records (student_id, student_name, parent_name, grade, roll_no, phone, total_fee, paid_fee, pending_amount, due_date, status, last_notified)
VALUES 
('STU-101', 'आदित्य रमेश पाटील (Aditya Patil)', 'रमेश पाटील (Ramesh Patil)', 'इयत्ता ८ वी (Grade 8)', '08-14', '+91 98231 45670', 18000, 12000, 6000, '2026-09-01', 'pending', '2026-08-20 09:00:00+00'),
('STU-102', 'सायली विकास देशमुख (Sayali Deshmukh)', 'विकास देशमुख (Vikas Deshmukh)', 'इयत्ता ९ वी (Grade 9)', '09-07', '+91 98902 34123', 22000, 14500, 7500, '2026-08-30', 'pending', '2026-08-18 09:00:00+00'),
('STU-103', 'प्रणव गजानन शिंदे (Pranav Shinde)', 'गजानन शिंदे (Gajanan Shinde)', 'इयत्ता १० वी (Grade 10)', '10-22', '+91 97654 89012', 25000, 15000, 10000, '2026-08-28', 'pending', NULL),
('STU-104', 'तन्वी सचिन सावंत (Tanvi Sawant)', 'सचिन सावंत (Sachin Sawant)', 'इयत्ता ७ वी (Grade 7)', '07-03', '+91 98220 11456', 16000, 16000, 0, '2026-08-15', 'paid', NULL),
('STU-105', 'रोहन प्रकाश गायकवाड (Rohan Gaikwad)', 'प्रकाश गायकवाड (Prakash Gaikwad)', 'इयत्ता ९ वी (Grade 9)', '09-18', '+91 99701 56789', 22000, 17000, 5000, '2026-09-05', 'pending', '2026-08-22 09:00:00+00'),
('STU-106', 'वैष्णवी विठ्ठल मोरे (Vaishnavi More)', 'विठ्ठल मोरे (Vitthal More)', 'इयत्ता १० वी (Grade 10)', '10-09', '+91 98811 78901', 25000, 12000, 13000, '2026-08-25', 'pending', NULL),
('STU-107', 'अमित ज्ञानेश्वर कदम (Amit Kadam)', 'ज्ञानेश्वर कदम (Dnyaneshwar Kadam)', 'इयत्ता ६ वी (Grade 6)', '06-12', '+91 98600 45678', 15000, 15000, 0, '2026-08-10', 'paid', NULL)
ON CONFLICT (student_id) DO NOTHING;
