-- Smart Tourist Safety Monitoring System - Supabase Database Schema
-- Execute these SQL commands in your Supabase SQL Editor

-- 1. Officers table (for direct authentication - no dependency on auth.users)
CREATE TABLE public.officers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store password for direct authentication
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    station_id VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'officer' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notifications table
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('emergency', 'warning', 'info', 'success')),
    category VARCHAR(50) NOT NULL,
    "user" VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tourists table (for tracking)
CREATE TABLE public.tourists (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'safe' CHECK (status IN ('safe', 'alert', 'emergency')),
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    safety_score INTEGER DEFAULT 85 CHECK (safety_score >= 0 AND safety_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Incidents table
CREATE TABLE public.incidents (
    id VARCHAR(20) PRIMARY KEY,
    tourist_name VARCHAR(255) NOT NULL,
    tourist_id VARCHAR(50) REFERENCES tourists(id),
    type VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. E-FIR (Electronic First Information Report) table
CREATE TABLE public.efirs (
    id SERIAL PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    tourist_id VARCHAR(50) REFERENCES tourists(id),
    tourist_name VARCHAR(255) NOT NULL,
    tourist_phone VARCHAR(20),
    tourist_address TEXT,
    incident_type VARCHAR(100) NOT NULL,
    incident_description TEXT NOT NULL,
    incident_location VARCHAR(255) NOT NULL,
    incident_latitude DECIMAL(10, 8),
    incident_longitude DECIMAL(11, 8),
    incident_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_by INTEGER REFERENCES officers(id),
    officer_name VARCHAR(255) NOT NULL,
    station_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'under_investigation', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    witnesses TEXT,
    evidence_details TEXT,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Officers: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.officers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.officers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert officer profile on signup" ON public.officers
    FOR INSERT WITH CHECK (true);

-- Notifications: All authenticated users can read, system can insert
CREATE POLICY "Authenticated users can view notifications" ON public.notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete notifications" ON public.notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tourists: All authenticated users can read and update
CREATE POLICY "Authenticated users can view tourists" ON public.tourists
    FOR ALL USING (auth.role() = 'authenticated');

-- Incidents: All authenticated users can read and update
CREATE POLICY "Authenticated users can view incidents" ON public.incidents
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Create indexes for better performance
CREATE INDEX idx_officers_username ON public.officers(username);
CREATE INDEX idx_officers_email ON public.officers(email);
CREATE INDEX idx_notifications_timestamp ON public.notifications(timestamp DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_tourists_status ON public.tourists(status);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_timestamp ON public.incidents(timestamp DESC);

-- 8. Insert sample data

-- Sample tourists
INSERT INTO public.tourists (id, name, latitude, longitude, status, phone, safety_score) VALUES
('1', 'John Doe', 28.6139, 77.2090, 'safe', '+91-9876543210', 85),
('2', 'Sarah Smith', 28.6129, 77.2295, 'alert', '+91-9876543211', 60),
('3', 'Mike Johnson', 28.6169, 77.2310, 'emergency', '+91-9876543212', 30),
('4', 'Emma Wilson', 28.6200, 77.2100, 'safe', '+91-9876543213', 90);

-- Sample incidents
INSERT INTO public.incidents (id, tourist_name, tourist_id, type, latitude, longitude, status, severity, description) VALUES
('INC001', 'Mike Johnson', '3', 'Emergency Alert', 28.6169, 77.2310, 'active', 'high', 'Emergency button pressed by tourist'),
('INC002', 'Sarah Smith', '2', 'Geo-fence Violation', 28.6129, 77.2295, 'investigating', 'medium', 'Tourist moved outside safe zone'),
('INC003', 'Alex Brown', '1', 'Inactivity Alert', 28.6150, 77.2200, 'resolved', 'low', 'No activity detected for extended period');

-- 9. Create a function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE TRIGGER handle_officers_updated_at
    BEFORE UPDATE ON public.officers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tourists_updated_at
    BEFORE UPDATE ON public.tourists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();