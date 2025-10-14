import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Shield,
  Users,
  AlertTriangle,
  FileText,
  Eye,
  MapPin,
  Clock,
  Phone,
  User,
  LogOut,
  Bell,
  CheckCircle,
  XCircle,
  Download,
  Search,
  UserPlus,
  ArrowLeft,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Supabase Configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Enhanced Color Palette for Coimbatore Tourist Safety System
const colorPalette = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },
  safe: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
};

// Coimbatore City Coordinates and Zone Data
const coimbatoreData = {
  center: [11.0168, 76.9558], // Coimbatore city center
  bounds: [[10.8000, 76.7000], [11.2000, 77.2000]], // City boundaries
  
  // Safe zones in Coimbatore (based on well-developed, commercial, and tourist areas)
  safeZones: [
    {
      name: "Race Course Area",
      coordinates: [11.0040, 76.9661],
      radius: 1200,
      description: "Well-developed commercial area with good police presence",
      safetyScore: 92
    },
    {
      name: "RS Puram",
      coordinates: [11.0055, 76.9600],
      radius: 1500,
      description: "Premium residential and commercial hub",
      safetyScore: 88
    },
    {
      name: "Peelamedu (IT Hub)",
      coordinates: [11.0296, 76.9216],
      radius: 2000,
      description: "IT corridor with modern infrastructure",
      safetyScore: 90
    },
    {
      name: "Gandhipuram Central",
      coordinates: [11.0168, 76.9558],
      radius: 800,
      description: "Central business district with high security",
      safetyScore: 85
    },
    {
      name: "Saibaba Colony",
      coordinates: [11.0210, 76.9510],
      radius: 1000,
      description: "Upscale residential area",
      safetyScore: 87
    }
  ],
  
  // High-risk zones (based on typical urban risk patterns)
  riskZones: [
    {
      name: "Railway Station Area",
      coordinates: [11.0010, 76.9720],
      radius: 600,
      description: "Crowded transport hub, pickpocketing risk",
      riskLevel: "medium",
      safetyScore: 45
    },
    {
      name: "Ukkadam",
      coordinates: [11.0080, 76.9380],
      radius: 800,
      description: "Industrial area, late night safety concerns",
      riskLevel: "medium",
      safetyScore: 40
    },
    {
      name: "Town Hall Area (Night)",
      coordinates: [11.0140, 76.9640],
      radius: 500,
      description: "Busy market area, crowding issues",
      riskLevel: "low",
      safetyScore: 55
    },
    {
      name: "Peripheral Industrial Zone",
      coordinates: [10.9800, 76.9200],
      radius: 1200,
      description: "Less patrolled industrial outskirts",
      riskLevel: "high",
      safetyScore: 30
    }
  ],
  
  // Popular tourist spots with safety info
  touristSpots: [
    {
      name: "Marudamalai Temple",
      coordinates: [11.0498, 76.8421],
      safetyScore: 80,
      description: "Popular temple with good crowd management"
    },
    {
      name: "VOC Park & Zoo",
      coordinates: [11.0244, 76.9297],
      safetyScore: 85,
      description: "Family-friendly attraction with security"
    },
    {
      name: "Brookefields Mall",
      coordinates: [11.0200, 76.9500],
      safetyScore: 90,
      description: "Modern shopping complex with CCTV coverage"
    },
    {
      name: "Monkey Falls (Outskirts)",
      coordinates: [11.1800, 76.7300],
      safetyScore: 60,
      description: "Nature spot - visit in groups during daytime"
    }
  ]
};

// API Configuration (fallback)
const API_BASE_URL = 'http://localhost:8000/api';

  // API Service with Supabase Integration (Supabase-only, no localStorage fallbacks)
  const apiService = {
  // Auth endpoints with Supabase
  register: async (userData) => {
    console.log('Attempting direct database registration for:', userData.username);

    // Check if user already exists in database
    const { data: existingUser } = await supabase
      .from('officers')
      .select('username, email')
      .or(`username.eq.${userData.username},email.eq.${userData.email}`)
      .single();

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return { detail: 'User with this username or email already exists' };
    }

    // Insert new user directly into officers table
    const { data: newUser, error: insertError } = await supabase
      .from('officers')
      .insert([{
        username: userData.username,
        email: userData.email,
        password: userData.password, // Store password for direct auth
        full_name: userData.full_name,
        phone: userData.phone,
        department: userData.department,
        rank: userData.rank,
        station_id: userData.station_id,
        role: userData.role || 'officer',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database registration error:', insertError);
      throw insertError;
    }

    console.log('Database registration successful for:', userData.full_name);
    return {
      username: userData.username,
      id: newUser.id,
      success: true
    };
  },

  login: async (credentials) => {
    console.log('🔐 Direct DB login attempt for:', credentials.username);
    
    try {
      // Direct database authentication - check officers table
      const { data: user, error: dbError } = await supabase
        .from('officers')
        .select('*')
        .or(`username.eq.${credentials.username},email.eq.${credentials.username}`)
        .eq('password', credentials.password)
        .single();

      if (dbError || !user) {
        console.log('❌ Database auth failed:', dbError?.message || 'User not found');
        throw new Error('Invalid credentials');
      }

      console.log('✅ Database login successful for:', user.full_name);
      
      return {
        access_token: 'db_token_' + user.id + '_' + Date.now(),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department,
          rank: user.rank,
          station_id: user.station_id
        }
      };
      
    } catch (error) {
      console.error('🔥 Database login error:', error);
      
      // Fallback to localStorage demo users
      console.log('🔄 Falling back to demo users');
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      console.log('📋 Found demo users:', users.length);
      
      const user = users.find(u => 
        (u.username === credentials.username || u.email === credentials.username) &&
        u.password === credentials.password
      );
      
      if (user) {
        console.log('🎉 Demo user login successful:', user.full_name);
        return {
          access_token: 'demo_token_' + user.id + '_' + Date.now(),
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            rank: user.rank,
            station_id: user.station_id
          }
        };
      } else {
        console.log('❌ No matching user found in database or demo');
        return { detail: 'Invalid credentials - username/email or password incorrect' };
      }
    }
  },

  getCurrentUser: async (token) => {
    try {
      const { data: userData, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      
      const { data: profileData, error: profileError } = await supabase
        .from('officers')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;
      return profileData;
    } catch (error) {
      console.error('Get current user error:', error);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.json();
    }
  },

  // Notification methods for Supabase
  saveNotification: async (notification) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          message: notification.message,
          type: notification.type,
          category: notification.category,
          user: notification.user,
          action: notification.action,
          timestamp: notification.timestamp,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Save notification error:', error);
      // Fallback: just return the notification as-is for localStorage handling
      return notification;
    }
  },

  getNotifications: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get notifications error:', error);
      // Return empty array if Supabase fails
      return [];
    }
  },

  clearNotifications: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', 0); // Delete all

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
  },

  getDashboardStats: async (token) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getTourists: async (token) => {
    const response = await fetch(`${API_BASE_URL}/tourists`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getIncidents: async (token) => {
    const response = await fetch(`${API_BASE_URL}/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
  
  // Submit E-FIR to Supabase database
  submitEFIR: async (efirData) => {
    console.log('📝 Submitting E-FIR to Supabase:', efirData);
    
    try {
      // Generate a unique FIR number
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const firNumber = `FIR-${timestamp}-${randomSuffix}`;
      
      // Insert into Supabase efirs table
      const { data, error } = await supabase
        .from('efirs')
        .insert([{
          fir_number: firNumber,
          tourist_id: efirData.touristId,
          tourist_name: efirData.touristName,
          tourist_phone: efirData.touristPhone,
          tourist_address: efirData.touristAddress || 'Not provided',
          incident_type: efirData.incidentType,
          incident_description: efirData.incidentDescription,
          incident_location: efirData.incidentLocation,
          incident_latitude: efirData.latitude,
          incident_longitude: efirData.longitude,
          incident_date_time: efirData.incidentDateTime || new Date().toISOString(),
          reported_by: efirData.officerId,
          officer_name: efirData.officerName,
          station_name: efirData.stationName,
          status: 'registered',
          priority: efirData.priority || 'medium',
          witnesses: efirData.witnesses || '',
          evidence_details: efirData.evidenceDetails || '',
          action_taken: efirData.actionTaken || ''
        }])
        .select();
      
      if (error) {
        console.error('❌ E-FIR submission failed:', error);
        
        // Fallback to localStorage if Supabase fails
        console.log('🔄 Falling back to localStorage for E-FIR storage');
        const efirs = JSON.parse(localStorage.getItem('demo_efirs') || '[]');
        
        const newEfir = {
          id: Date.now(),
          fir_number: firNumber,
          ...efirData,
          created_at: new Date().toISOString()
        };
        
        efirs.push(newEfir);
        localStorage.setItem('demo_efirs', JSON.stringify(efirs));
        
        return {
          success: true,
          data: newEfir,
          source: 'localStorage'
        };
      }
      
      console.log('✅ E-FIR submitted successfully to Supabase:', data);
      return {
        success: true,
        data: data[0],
        source: 'supabase'
      };
      
    } catch (error) {
      console.error('🔥 Error submitting E-FIR:', error);
      return {
        success: false,
        error: error.message || 'Unknown error submitting E-FIR'
      };
    }
  },
  
  // Get E-FIRs from Supabase
  getEFIRs: async (filters = {}) => {
    console.log('🔍 Fetching E-FIRs from Supabase with filters:', filters);
    
    try {
      // Build the query
      let query = supabase.from('efirs').select('*');
      
      // Apply filters if provided
      if (filters.touristId) {
        query = query.eq('tourist_id', filters.touristId);
      }
      
      if (filters.officerId) {
        query = query.eq('reported_by', filters.officerId);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.dateFrom) {
        query = query.gte('incident_date_time', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('incident_date_time', filters.dateTo);
      }
      
      // Add sorting
      query = query.order('created_at', { ascending: false });
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Failed to fetch E-FIRs from Supabase:', error);
        throw error;
      }
      
      console.log('✅ Successfully fetched E-FIRs from Supabase:', data?.length || 0, 'records');
      
      // If no data from Supabase, try localStorage as fallback
      if (!data || data.length === 0) {
        const efirs = JSON.parse(localStorage.getItem('demo_efirs') || '[]');
        
        if (efirs.length > 0) {
          console.log('📋 Using locally stored E-FIRs:', efirs.length, 'records');
          return {
            success: true,
            data: efirs,
            source: 'localStorage'
          };
        }
      }
      
      return {
        success: true,
        data: data || [],
        source: 'supabase'
      };
      
    } catch (error) {
      console.error('🔥 Error fetching E-FIRs:', error);
      
      // Fallback to localStorage
      const efirs = JSON.parse(localStorage.getItem('demo_efirs') || '[]');
      
      return {
        success: true,
        data: efirs,
        source: 'localStorage',
        error: error.message
      };
    }
  }
};

// Mock data (fallback if API is not available)
const mockTourists = [
  { id: '1', name: 'Priya Sharma', location: [11.0055, 76.9600], status: 'safe', lastUpdate: '2 mins ago', phone: '+91-9876543210', safetyScore: 88, currentArea: 'RS Puram' },
  { id: '2', name: 'Rajesh Kumar', location: [11.0010, 76.9720], status: 'alert', lastUpdate: '5 mins ago', phone: '+91-9876543211', safetyScore: 45, currentArea: 'Railway Station' },
  { id: '3', name: 'Anita Singh', location: [10.9800, 76.9200], status: 'emergency', lastUpdate: '1 min ago', phone: '+91-9876543212', safetyScore: 30, currentArea: 'Industrial Zone' },
  { id: '4', name: 'David Wilson', location: [11.0296, 76.9216], status: 'safe', lastUpdate: '3 mins ago', phone: '+91-9876543213', safetyScore: 90, currentArea: 'IT Hub Peelamedu' },
  { id: '5', name: 'Sarah Johnson', location: [11.0244, 76.9297], status: 'safe', lastUpdate: '4 mins ago', phone: '+91-9876543214', safetyScore: 85, currentArea: 'VOC Park' },
];

const mockIncidents = [
  { id: 'INC001', touristName: 'Anita Singh', type: 'Emergency Alert', location: [10.9800, 76.9200], timestamp: '2025-09-26 14:30', status: 'active', severity: 'high', area: 'Industrial Zone' },
  { id: 'INC002', touristName: 'Rajesh Kumar', type: 'Geo-fence Violation', location: [11.0010, 76.9720], timestamp: '2025-09-26 14:25', status: 'investigating', severity: 'medium', area: 'Railway Station' },
  { id: 'INC003', touristName: 'Unknown Tourist', type: 'Inactivity Alert', location: [11.0080, 76.9380], timestamp: '2025-09-26 13:45', status: 'resolved', severity: 'low', area: 'Ukkadam' },
];

const mockGeoFences = [
  // High Risk Zones
  { id: 'GF1', center: [10.9800, 76.9200], radius: 1200, type: 'restricted', name: 'Industrial Zone - High Risk', color: '#dc2626' },
  { id: 'GF2', center: [11.0010, 76.9720], radius: 600, type: 'caution', name: 'Railway Station Area', color: '#f59e0b' },
  { id: 'GF3', center: [11.0080, 76.9380], radius: 800, type: 'caution', name: 'Ukkadam Industrial Area', color: '#f59e0b' },
  
  // Safe Zones
  { id: 'GF4', center: [11.0055, 76.9600], radius: 1500, type: 'safe', name: 'RS Puram Safe Zone', color: '#16a34a' },
  { id: 'GF5', center: [11.0296, 76.9216], radius: 2000, type: 'safe', name: 'IT Hub Peelamedu', color: '#16a34a' },
  { id: 'GF6', center: [11.0168, 76.9558], radius: 800, type: 'safe', name: 'Gandhipuram CBD', color: '#16a34a' },
  { id: 'GF7', center: [11.0210, 76.9510], radius: 1000, type: 'safe', name: 'Saibaba Colony', color: '#16a34a' },
];

// Police Stations in Coimbatore Region
const policeStations = [
  { 
    id: 'PS1', 
    name: 'RS Puram Police Station', 
    location: [11.0053, 76.9542], 
    contactNumber: '0422-2300970',
    email: 'rspuram.police@tnpolice.gov.in',
    officer: 'Inspector Rajesh Kumar',
    jurisdiction: ['RS Puram', 'Saibaba Colony', 'Gandhipuram'],
    range: 2500 // meters
  },
  { 
    id: 'PS2', 
    name: 'Race Course Police Station', 
    location: [11.0130, 76.9756], 
    contactNumber: '0422-2301214',
    email: 'racecourse.police@tnpolice.gov.in',
    officer: 'Inspector Sreenivas',
    jurisdiction: ['Race Course', 'Gandhipuram', 'Peelamedu'],
    range: 2000 // meters
  },
  { 
    id: 'PS3', 
    name: 'Peelamedu Police Station', 
    location: [11.0259, 76.9986], 
    contactNumber: '0422-2591915',
    email: 'peelamedu.police@tnpolice.gov.in',
    officer: 'Inspector Anitha Kumari',
    jurisdiction: ['Peelamedu', 'IT Hub', 'Airport'],
    range: 2500 // meters
  },
  { 
    id: 'PS4', 
    name: 'Ukkadam Police Station', 
    location: [10.9980, 76.9359], 
    contactNumber: '0422-2300567',
    email: 'ukkadam.police@tnpolice.gov.in',
    officer: 'Inspector Mohammed Rafi',
    jurisdiction: ['Ukkadam', 'Town Hall', 'Industrial Zone'],
    range: 2000 // meters
  },
  { 
    id: 'PS5', 
    name: 'Railway Police Station', 
    location: [11.0028, 76.9702], 
    contactNumber: '0422-2303121',
    email: 'railway.police@tnpolice.gov.in',
    officer: 'Inspector Divya Prakash',
    jurisdiction: ['Railway Station', 'Central Bus Stand'],
    range: 1500 // meters
  }
];

// Custom hook for map operations
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, {
        animate: true,
        duration: 1
      });
      
      // Enable map interactions
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.keyboard.enable();
      
      // Invalidate size to handle any container resizing issues
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);
  
  return null;
};

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]); // Coimbatore city center
  const [showEFirModal, setShowEFirModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // E-FIR state
  const [efirData, setEfirData] = useState({
    touristId: '',
    touristName: '',
    touristPhone: '',
    touristAddress: '',
    incidentType: 'Emergency Alert',
    incidentDescription: '',
    incidentLocation: '',
    latitude: null,
    longitude: null,
    incidentDateTime: new Date().toISOString(),
    priority: 'medium',
    witnesses: '',
    evidenceDetails: '',
    actionTaken: 'Emergency alert sent to nearest patrol unit'
  });
  const [efirSubmitting, setEfirSubmitting] = useState(false);
  const [efirError, setEfirError] = useState('');
  const [efirSuccess, setEfirSuccess] = useState('');
  const [showEfirList, setShowEfirList] = useState(false);
  
  // Data state
  const [tourists, setTourists] = useState(mockTourists);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [stationAlerts, setStationAlerts] = useState([]);
  const [localPoliceStations, setLocalPoliceStations] = useState(policeStations);
  const [efirs, setEfirs] = useState([]);
  const [efirsLoading, setEfirsLoading] = useState(false);
  const [efirsError, setEfirsError] = useState('');
  const [selectedEfir, setSelectedEfir] = useState(null);
  const [showEfirViewModal, setShowEfirViewModal] = useState(false);
  const [efirFilters, setEfirFilters] = useState({
    touristId: '',
    officerId: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });
  const [dashboardStats, setDashboardStats] = useState({
    active_tourists: 4,
    active_incidents: 1,
    safe_tourists: 3,
    efirs_today: 3
  });
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      message: 'Emergency alert from Mike Johnson', 
      time: new Date(Date.now() - 1 * 60 * 1000).toLocaleTimeString(), 
      timestamp: Date.now() - 1 * 60 * 1000,
      type: 'emergency',
      category: 'alert',
      user: 'Mike Johnson',
      action: 'Emergency Alert Triggered'
    },
    { 
      id: 2, 
      message: 'Geo-fence violation detected for Sarah Smith', 
      time: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString(), 
      timestamp: Date.now() - 5 * 60 * 1000,
      type: 'warning',
      category: 'location',
      user: 'Sarah Smith',
      action: 'Geo-fence Violation'
    },
    { 
      id: 3, 
      message: 'New officer registered in system', 
      time: new Date(Date.now() - 10 * 60 * 1000).toLocaleTimeString(), 
      timestamp: Date.now() - 10 * 60 * 1000,
      type: 'info',
      category: 'system',
      user: 'System',
      action: 'Officer Registration'
    },
    { 
      id: 4, 
      message: 'Tourist safety score updated for Emma Wilson', 
      time: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString(), 
      timestamp: Date.now() - 15 * 60 * 1000,
      type: 'info',
      category: 'safety',
      user: 'Emma Wilson',
      action: 'Safety Score Update'
    }
  ]);
  const [notificationFilter, setNotificationFilter] = useState('all');

  // Function to add new notifications (with Supabase persistence)
  const addNotification = async (type, category, message, user = 'System', action = '') => {
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      type,
      category,
      user,
      action
    };
    
    // Add to local state immediately for instant UI update
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    
    // Save to Supabase in background
    try {
      await apiService.saveNotification(newNotification);
    } catch (error) {
      console.error('Failed to save notification to Supabase:', error);
    }
  };

  // Load notifications from Supabase on login
  const loadNotifications = async () => {
    try {
      const supabaseNotifications = await apiService.getNotifications();
      if (supabaseNotifications && supabaseNotifications.length > 0) {
        // Convert Supabase format to app format
        const formattedNotifications = supabaseNotifications.map(n => ({
          id: n.id,
          message: n.message,
          time: new Date(n.timestamp).toLocaleTimeString(),
          timestamp: new Date(n.timestamp).getTime(),
          type: n.type,
          category: n.category,
          user: n.user,
          action: n.action
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Simulate real-time notifications
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const activities = [
      { type: 'info', category: 'safety', message: 'Tourist safety score updated for John Doe', user: 'John Doe', action: 'Safety Score Update' },
      { type: 'warning', category: 'location', message: 'Tourist moved to restricted area', user: 'Sarah Smith', action: 'Location Alert' },
      { type: 'info', category: 'system', message: 'System backup completed successfully', user: 'System', action: 'Backup Complete' },
      { type: 'emergency', category: 'alert', message: 'Emergency button pressed', user: 'Mike Johnson', action: 'Emergency Alert' },
      { type: 'success', category: 'safety', message: 'Tourist reached safe zone', user: 'Emma Wilson', action: 'Safety Zone Entry' },
      { type: 'info', category: 'location', message: 'Tourist checked in at hotel', user: 'Alex Brown', action: 'Check-in Notification' },
      { type: 'warning', category: 'safety', message: 'Low battery alert from tourist device', user: 'Lisa Chen', action: 'Device Alert' }
    ];

    const interval = setInterval(() => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      addNotification(
        randomActivity.type,
        randomActivity.category,
        randomActivity.message,
        randomActivity.user,
        randomActivity.action
      );
    }, 30000); // Add new notification every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Load dashboard data (must be defined before verifyToken)
  const loadDashboardData = async (token) => {
    try {
      const [stats, touristsData, incidentsData] = await Promise.all([
        apiService.getDashboardStats(token),
        apiService.getTourists(token),
        apiService.getIncidents(token)
      ]);

      setDashboardStats(stats || dashboardStats);
      setTourists(Array.isArray(touristsData) ? touristsData : mockTourists);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : mockIncidents);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use mock data as fallback
      setTourists(mockTourists);
      setIncidents(mockIncidents);
    }
  };

  // Fetch E-FIRs from database (must be defined before verifyToken)
  const fetchEFIRs = useCallback(async () => {
    setEfirsLoading(true);
    try {
      const response = await apiService.getEFIRs(efirFilters);
      if (response.success) {
        setEfirs(response.data);
        console.log(`✅ Fetched ${response.data.length} E-FIRs from ${response.source}`);
      } else {
        console.error('Failed to fetch E-FIRs:', response.error);
        setEfirsError(response.error || 'Failed to fetch E-FIRs');
      }
    } catch (error) {
      console.error('Error fetching E-FIRs:', error);
      setEfirsError(error.message || 'Error fetching E-FIRs');
    } finally {
      setEfirsLoading(false);
    }
  }, [efirFilters]);

  // Verify token and load user data
  const verifyToken = useCallback(async (token) => {
    try {
      const userData = await apiService.getCurrentUser(token);
      if (userData.username) {
        setCurrentUser(userData);
        setIsLoggedIn(true);
        loadDashboardData(token);
        fetchEFIRs(); // Fetch E-FIRs when user logs in
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
    }
  }, [fetchEFIRs]);
  
  // Generate PDF from E-FIR
  const generatePDF = (efir) => {
    try {
      // Initialize the PDF document
      const doc = new jsPDF();
      
      // Add the logo and header
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102);
      doc.text('SMART TOURIST SAFETY MONITORING SYSTEM', 105, 20, { align: 'center' });
      
      // Add the E-FIR title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Electronic First Information Report (E-FIR)`, 105, 30, { align: 'center' });
      
      // Add the FIR Number and Date
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`FIR Number: ${efir.fir_number}`, 20, 40);
      
      const incidentDate = new Date(efir.incident_date_time);
      doc.text(`Date & Time: ${incidentDate.toLocaleString()}`, 20, 47);
      
      // Add a line separator
      doc.setLineWidth(0.5);
      doc.line(20, 50, 190, 50);
      
      // Add Complainant Information
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('Complainant Information', 20, 60);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${efir.tourist_name}`, 25, 70);
      doc.text(`Phone: ${efir.tourist_phone}`, 25, 77);
      doc.text(`Address: ${efir.tourist_address}`, 25, 84);
      
      // Add Incident Information
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('Incident Information', 20, 100);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Type: ${efir.incident_type}`, 25, 110);
      doc.text(`Location: ${efir.incident_location}`, 25, 117);
      doc.text(`Coordinates: ${efir.incident_latitude}, ${efir.incident_longitude}`, 25, 124);
      
      // Add Description with word wrapping
      doc.text('Description:', 25, 134);
      const splitDescription = doc.splitTextToSize(efir.incident_description, 150);
      doc.text(splitDescription, 25, 141);
      
      // Calculate Y position after description
      const yPos = Math.min(141 + splitDescription.length * 7, 200);
      
      // Add Officer Information
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('Reporting Officer Information', 20, yPos);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Officer: ${efir.officer_name}`, 25, yPos + 10);
      doc.text(`Police Station: ${efir.station_name}`, 25, yPos + 17);
      
      // Add Status Information
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('Case Information', 20, yPos + 30);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Status: ${efir.status.toUpperCase()}`, 25, yPos + 40);
      doc.text(`Priority: ${efir.priority.toUpperCase()}`, 25, yPos + 47);
      
      // Add Evidence Information if available
      if (efir.evidence_details) {
        doc.text(`Evidence: ${efir.evidence_details}`, 25, yPos + 54);
      }
      
      // Add Witness Information if available
      if (efir.witnesses) {
        doc.text(`Witnesses: ${efir.witnesses}`, 25, yPos + 61);
      }
      
      // Add Action Taken if available
      if (efir.action_taken) {
        doc.text(`Action Taken: ${efir.action_taken}`, 25, yPos + 68);
      }
      
      // Add a line for signature
      doc.line(130, yPos + 90, 190, yPos + 90);
      doc.text("Officer's Signature", 160, yPos + 95, { align: 'center' });
      
      // Add footer
      doc.setFontSize(8);
      doc.text('This is a digitally generated E-FIR. No physical signature is required.', 105, 280, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
      
      // Save the PDF
      doc.save(`EFIR-${efir.fir_number}.pdf`);
      
      // Add a notification
      addNotification('info', 'file', `E-FIR ${efir.fir_number} downloaded as PDF`, currentUser?.full_name || 'Officer', 'E-FIR Download');
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    }
  }, [verifyToken]);

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // Get values from form inputs
    const formData = new FormData(e.target);
    const registerData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
      department: formData.get('department'),
      rank: formData.get('rank'),
      station_id: formData.get('station_id'),
      role: formData.get('role') || 'officer'
    };

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }

    // Validate required fields
    const requiredFields = ['username', 'email', 'password', 'full_name', 'phone', 'department', 'rank', 'station_id'];
    const missingFields = requiredFields.filter(field => !registerData[field] || !registerData[field].trim());
    
    if (missingFields.length > 0) {
      setAuthError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setAuthLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = registerData;
      const response = await apiService.register(registrationData);
      
      if (response.username || response.id) {
        // Registration successful
        setAuthError('');
        setAuthSuccess(`Registration successful! Welcome ${registerData.full_name}. You can now login with your credentials.`);
        setShowRegister(false);
        
        // Add notification for new registration
        addNotification('success', 'system', `New officer ${registerData.full_name} registered successfully`, registerData.full_name, 'Officer Registration');
        
        // Clear form
        e.target.reset();
        
        // Auto-switch to login after a brief delay
        setTimeout(() => {
          setAuthSuccess('');
        }, 5000);
      } else {
        setAuthError(response.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('Registration failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // Get values from form inputs
    const formData = new FormData(e.target);
    const loginData = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    try {
      const response = await apiService.login(loginData);
      
      if (response.access_token) {
        // Login successful
        localStorage.setItem('auth_token', response.access_token);
        setCurrentUser(response.user);
        setIsLoggedIn(true);
        setAuthError('');
        setAuthSuccess('');
        
        // Add login notification
        await addNotification('info', 'system', `${response.user.full_name} logged into the system`, response.user.full_name, 'User Login');
        
        // Load notifications from Supabase
        await loadNotifications();
        
        loadDashboardData(response.access_token);
      } else {
        setAuthError(response.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (currentUser) {
      addNotification('info', 'system', `${currentUser.full_name} logged out of the system`, currentUser.full_name, 'User Logout');
    }
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Handle E-FIR submission
  const handleEfirSubmit = async () => {
    // Validation
    if (!efirData.touristId) {
      setEfirError('Please select a tourist');
      return;
    }

    if (!efirData.incidentDescription) {
      setEfirError('Please provide an incident description');
      return;
    }

    // Reset messages and set loading
    setEfirError('');
    setEfirSuccess('');
    setEfirSubmitting(true);

    try {
      // Prepare data for submission
      const submissionData = {
        ...efirData,
        officerId: currentUser?.id,
        officerName: currentUser?.full_name || 'Unknown Officer',
        stationName: currentUser?.station_id ? `Station ${currentUser.station_id}` : 'Tourist Police Station',
        incidentDateTime: new Date().toISOString()
      };

      // Call API to submit E-FIR
      const result = await apiService.submitEFIR(submissionData);

      if (result.success) {
        // Update success message
        setEfirSuccess('E-FIR submitted successfully!');
        
        // Update dashboard stats
        setDashboardStats(prev => ({
          ...prev,
          efirs_today: (prev.efirs_today || 0) + 1
        }));
        
        // Send alerts to nearby police stations in Coimbatore region
        const alertsGenerated = alertNearbyPoliceStations(submissionData);
        console.log(`🚓 Alerts sent to ${alertsGenerated.length} nearby police stations`);
        
        // If incident is urgent or high priority, center map on incident location
        if (submissionData.priority === 'urgent' || submissionData.priority === 'high') {
          setMapCenter([submissionData.latitude, submissionData.longitude]);
        }

        // Add notification
        addNotification(
          'success', 
          'fir', 
          `E-FIR submitted for tourist ${efirData.touristName}`, 
          efirData.touristName,
          'E-FIR Registered'
        );

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowEFirModal(false);
          // Reset form
          setEfirData({
            touristId: '',
            touristName: '',
            touristPhone: '',
            touristAddress: '',
            incidentType: 'Emergency Alert',
            incidentDescription: '',
            incidentLocation: '',
            latitude: null,
            longitude: null,
            incidentDateTime: new Date().toISOString(),
            priority: 'medium',
            witnesses: '',
            evidenceDetails: '',
            actionTaken: 'Emergency alert sent to nearest patrol unit'
          });
        }, 2000);
      } else {
        setEfirError(result.error || 'Failed to submit E-FIR. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting E-FIR:', error);
      setEfirError('An unexpected error occurred. Please try again.');
    } finally {
      setEfirSubmitting(false);
    }
  };

  // Calculate distance between two GPS coordinates in meters (Haversine formula)
  const calculateDistance = (coord1, coord2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  };
  
  // Find nearby police stations based on incident location
  const findNearbyPoliceStations = (incidentLocation) => {
    return policeStations.filter(station => {
      const distance = calculateDistance(station.location, incidentLocation);
      return distance <= station.range;
    });
  };

  // Send alert to nearby police stations
  const alertNearbyPoliceStations = (incidentData) => {
    const nearbyStations = findNearbyPoliceStations([incidentData.latitude, incidentData.longitude]);
    
    if (nearbyStations.length === 0) {
      console.log('No police stations found within range of incident');
      return [];
    }
    
    const alertsGenerated = nearbyStations.map(station => {
      const alertData = {
        id: `alert-${Date.now()}-${station.id}`,
        stationId: station.id,
        stationName: station.name,
        officerName: station.officer,
        incidentType: incidentData.incidentType,
        incidentLocation: incidentData.incidentLocation,
        touristName: incidentData.touristName,
        priority: incidentData.priority,
        timestamp: new Date().toISOString(),
        status: 'unread'
      };
      
      // In a real system, this would send the alert through various channels
      console.log(`🚨 Alert sent to ${station.name} (${station.contactNumber}): ${incidentData.incidentType} at ${incidentData.incidentLocation}`);
      
      return alertData;
    });
    
    // Add to local alerts state
    setStationAlerts(prev => [...prev, ...alertsGenerated]);
    
    // Add notification about alerts sent
    if (alertsGenerated.length > 0) {
      addNotification(
        'info', 
        'alert', 
        `Alert sent to ${alertsGenerated.length} nearby police stations for incident at ${incidentData.incidentLocation}`,
        'System',
        'Police Stations Notified'
      );
    }
    
    return alertsGenerated;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return '#22c55e';
      case 'alert': return '#f59e0b';
      case 'emergency': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Create custom marker icon
  const createCustomIcon = (status) => {
    const color = getStatusColor(status);
    const iconHtml = `
      <div style="
        width: 25px; 
        height: 25px; 
        background-color: ${color}; 
        border: 2px solid white; 
        border-radius: 50%;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <div style="
          width: 8px; 
          height: 8px; 
          background-color: white; 
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      iconSize: [25, 25],
      iconAnchor: [12, 12],
      className: 'custom-marker-icon'
    });
  };

  // Registration Form Component
  const RegistrationForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <button
              onClick={() => setShowRegister(false)}
              className="absolute left-8 top-8 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <UserPlus className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Officer</h1>
          <p className="text-gray-600">Smart Tourist Safety Monitoring System</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {authSuccess && (
            <div className="p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">
              {authSuccess}
            </div>
          )}
          
          {authError && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
              {authError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                id="regUsernameInput"
                name="username"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                id="regEmailInput"
                name="email"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="officer@police.gov.in"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                id="regPasswordInput"
                name="password"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Minimum 6 characters"
                minLength="6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                id="regConfirmPasswordInput"
                name="confirmPassword"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Re-enter password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                id="regFullNameInput"
                name="full_name"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Officer Full Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                id="regPhoneInput"
                name="phone"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+91-9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                id="regDepartmentInput"
                name="department"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tourist Police Department"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rank *</label>
              <select
                id="regRankSelect"
                name="rank"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Rank</option>
                <option value="Constable">Constable</option>
                <option value="Head Constable">Head Constable</option>
                <option value="Sub Inspector">Sub Inspector</option>
                <option value="Inspector">Inspector</option>
                <option value="Deputy Superintendent">Deputy Superintendent</option>
                <option value="Superintendent">Superintendent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station ID *</label>
              <input
                type="text"
                id="regStationIdInput"
                name="station_id"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="TP001 (Tourist Police Station ID)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                id="regRoleSelect"
                name="role"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="officer">Officer</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={authLoading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account? 
          <button 
            onClick={() => setShowRegister(false)}
            className="text-green-600 hover:text-green-800 ml-1"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );

  // Login Screen
  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Police Dashboard</h1>
          <p className="text-gray-600">Smart Tourist Safety Monitoring</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {authSuccess && (
            <div className="p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">
              {authSuccess}
            </div>
          )}
          
          {authError && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
              {authError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="usernameInput"
              name="username"
              defaultValue=""
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="passwordInput"
              name="password"
              defaultValue=""
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500 mb-2">
            Demo credentials: admin / admin123
          </div>
          <button
            onClick={() => {
              setShowRegister(true);
              setAuthError('');
              setAuthSuccess('');
            }}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Officer</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Show registration form
  if (showRegister) {
    return <RegistrationForm />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Police Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-500 cursor-pointer" />
              {notifications.filter(n => Date.now() - n.timestamp < 5 * 60 * 1000).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => Date.now() - n.timestamp < 5 * 60 * 1000).length}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">
                {currentUser ? currentUser.full_name : 'Officer'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Tourists</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.active_tourists || tourists.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Incidents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.active_incidents || incidents.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Safe Tourists</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.safe_tourists || tourists.filter(t => t.status === 'safe').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">E-FIRs Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.efirs_today || 3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'map', label: 'Live Map', icon: MapPin },
                { id: 'tourists', label: 'Tourists', icon: Users },
                { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
                { id: 'reports', label: 'Reports', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'map' && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-lg border border-blue-100">
                <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <MapPin className="h-6 w-6 mr-2" />
                    Live Tourist Map - Coimbatore, Tamil Nadu
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Real-time monitoring with safety zones</p>
                </div>
                <div className="h-[500px] relative">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-b-xl"
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    dragging={true}
                    zoomControl={true}
                    attributionControl={true}
                    whenCreated={(mapInstance) => {
                      mapInstance.on('click', () => {
                        if (showEFirModal) {
                          // Prevent map interaction when modal is open
                          return;
                        }
                      });
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController center={mapCenter} zoom={12} />
                    
                    {/* Coimbatore Safety Zones */}
                    {coimbatoreData.safeZones.map((zone) => (
                      <Circle
                        key={`safe-${zone.name}`}
                        center={zone.coordinates}
                        radius={zone.radius}
                        color={colorPalette.safe[600]}
                        fillColor={colorPalette.safe[500]}
                        fillOpacity={0.15}
                        weight={2}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <h3 className="font-bold text-green-800 mb-2">{zone.name}</h3>
                            <p className="text-sm text-gray-700 mb-2">{zone.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Safety Score: {zone.safetyScore}%
                              </span>
                              <span className="text-xs text-gray-500">Safe Zone</span>
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    ))}
                    
                    {/* Coimbatore Risk Zones */}
                    {coimbatoreData.riskZones.map((zone) => (
                      <Circle
                        key={`risk-${zone.name}`}
                        center={zone.coordinates}
                        radius={zone.radius}
                        color={zone.riskLevel === 'high' ? colorPalette.danger[600] : colorPalette.warning[600]}
                        fillColor={zone.riskLevel === 'high' ? colorPalette.danger[500] : colorPalette.warning[500]}
                        fillOpacity={0.2}
                        weight={2}
                        dashArray={zone.riskLevel === 'high' ? "5, 5" : "10, 5"}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <h3 className="font-bold text-red-800 mb-2">{zone.name}</h3>
                            <p className="text-sm text-gray-700 mb-2">{zone.description}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                zone.riskLevel === 'high' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                Safety Score: {zone.safetyScore}%
                              </span>
                              <span className={`text-xs capitalize ${
                                zone.riskLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {zone.riskLevel} Risk
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    ))}
                    
                    {/* Tourist Spots */}
                    {coimbatoreData.touristSpots.map((spot) => (
                      <Marker
                        key={`spot-${spot.name}`}
                        position={spot.coordinates}
                        icon={L.divIcon({
                          html: `<div class="w-6 h-6 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                                   <span class="text-white text-xs">📍</span>
                                 </div>`,
                          className: 'tourist-spot-marker',
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <h3 className="font-bold text-purple-800 mb-2">{spot.name}</h3>
                            <p className="text-sm text-gray-700 mb-2">{spot.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                Safety Score: {spot.safetyScore}%
                              </span>
                              <span className="text-xs text-purple-600">Tourist Spot</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Tourist Markers */}
                    {tourists.map((tourist) => (
                      <Marker
                        key={tourist.id}
                        position={tourist.location}
                        icon={createCustomIcon(tourist.status)}
                      >
                        <Popup>
                          <div className="p-4 min-w-[250px]">
                            <h3 className="font-bold text-gray-900 mb-2">{tourist.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  tourist.status === 'safe' ? 'bg-green-100 text-green-800' :
                                  tourist.status === 'alert' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tourist.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Area:</span>
                                <span className="text-sm font-medium">{tourist.currentArea}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Safety Score:</span>
                                <span className="text-sm font-bold text-blue-600">{tourist.safetyScore}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last Update:</span>
                                <span className="text-sm">{tourist.lastUpdate}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTourist(tourist);
                                  addNotification('info', 'monitoring', `Viewing details for tourist ${tourist.name}`, currentUser?.full_name || 'Officer', 'Tourist Details Viewed');
                                }}
                                className="w-full mt-3 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Police Station Markers */}
                    {localPoliceStations.map((station) => (
                      <Marker
                        key={station.id}
                        position={station.location}
                        icon={L.divIcon({
                          className: 'custom-police-icon',
                          html: `<div style="background-color: #1e40af; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(0,0,0,0.5);">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="10" height="10">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                            </svg>
                          </div>`,
                          iconSize: [28, 28],
                          iconAnchor: [14, 14]
                        })}
                      >
                        <Popup>
                          <div className="p-4 min-w-[250px]">
                            <h3 className="font-bold text-gray-900 mb-2">{station.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Officer:</span>
                                <span className="text-sm font-medium">{station.officer}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Contact:</span>
                                <span className="text-sm font-medium">{station.contactNumber}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Email:</span>
                                <span className="text-sm">{station.email}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Jurisdiction:</span>
                                <span className="text-sm">{station.jurisdiction.join(', ')}</span>
                              </div>
                              <button
                                onClick={() => {
                                  addNotification('info', 'system', `Contact initiated with ${station.name}`, currentUser?.full_name || 'Officer', 'Police Contact');
                                }}
                                className="w-full mt-3 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Contact Station
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Legacy Geo-fence Circles for backward compatibility */}
                    {mockGeoFences.map((fence) => (
                      <Circle
                        key={fence.id}
                        center={fence.center}
                        radius={fence.radius}
                        color={fence.color || (fence.type === 'restricted' ? '#ef4444' : '#22c55e')}
                        fillColor={fence.color || (fence.type === 'restricted' ? '#ef4444' : '#22c55e')}
                        fillOpacity={0.1}
                        weight={2}
                      >
                        <Popup>
                          <div className="p-3">
                            <h3 className="font-semibold text-gray-900 mb-1">{fence.name}</h3>
                            <p className="text-sm text-gray-600">Type: {fence.type}</p>
                            <p className="text-sm text-gray-600">Radius: {fence.radius}m</p>
                          </div>
                        </Popup>
                      </Circle>
                    ))}
                  </MapContainer>
                  
                  {/* Zone Legend */}
                  <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Safety Zones</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-700">Safe Areas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-700">Caution Areas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-700">High Risk Areas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-gray-700">Tourist Spots</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions Below Map */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-b-xl border-t border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setShowEFirModal(true)}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">E-FIR</span>
                    </button>
                    <button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Alert</span>
                    </button>
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Check-in</span>
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="font-medium">Register</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tourists' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Tourist List</h2>
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        id="searchInput"
                        name="search"
                        placeholder="Search tourists..."
                        defaultValue=""
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {tourists
                    .filter(tourist => 
                      tourist.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((tourist) => (
                    <div key={tourist.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: getStatusColor(tourist.status) }}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900">{tourist.name}</p>
                            <p className="text-sm text-gray-500">ID: {tourist.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Safety Score: {tourist.safetyScore}%
                          </p>
                          <p className="text-sm text-gray-500">{tourist.lastUpdate}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setMapCenter(tourist.location);
                              setActiveTab('map');
                              addNotification('info', 'location', `Tracking tourist ${tourist.name} on map`, currentUser?.full_name || 'Officer', 'Map Location Tracking');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedTourist(tourist)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-2 w-2 rounded-full ${
                            incident.severity === 'high' ? 'bg-red-500' :
                            incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{incident.type}</p>
                            <p className="text-sm text-gray-500">{incident.touristName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{incident.status}</p>
                          <p className="text-sm text-gray-500">{incident.timestamp}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setMapCenter(incident.location);
                              setActiveTab('map');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedIncident(incident)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {incident.status === 'active' && (
                            <button
                              onClick={() => setShowEFirModal(true)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <button 
                      onClick={() => {
                        fetchEFIRs();
                        setShowEfirList(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">View E-FIRs</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Daily Tourist Traffic</h3>
                      <p className="text-2xl font-bold text-blue-900">1,247</p>
                      <p className="text-sm text-blue-700">+12% from yesterday</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-red-900 mb-2">Incidents Today</h3>
                      <p className="text-2xl font-bold text-red-900">7</p>
                      <p className="text-sm text-red-700">3 resolved, 4 active</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-green-900 mb-2">Officers Online</h3>
                      <p className="text-2xl font-bold text-green-900">{dashboardStats.total_users || 1}</p>
                      <p className="text-sm text-green-700">System registered users</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-purple-900 mb-2">Response Time</h3>
                      <p className="text-2xl font-bold text-purple-900">2.3 min</p>
                      <p className="text-sm text-purple-700">Average emergency response</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download Daily Report</span>
                    </button>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Export Tourist Data</span>
                    </button>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Generate Analytics Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Enhanced Notifications */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Activity History</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">{notifications.length} total</span>
                    </div>
                    <button
                      onClick={async () => {
                        setNotifications([]);
                        try {
                          await apiService.clearNotifications();
                        } catch (error) {
                          console.error('Failed to clear notifications in Supabase:', error);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Notification Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'emergency', 'warning', 'info', 'success'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNotificationFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        notificationFilter === filter
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {notifications
                  .filter(notification => 
                    notificationFilter === 'all' || notification.type === notificationFilter
                  )
                  .slice(0, 20)
                  .map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.type === 'emergency' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.action}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {notification.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {notification.user}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end text-xs text-gray-500 ml-2">
                            <span>{notification.time}</span>
                            <span className="mt-1">
                              {Math.floor((Date.now() - notification.timestamp) / (1000 * 60))}m ago
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.filter(notification => 
                  notificationFilter === 'all' || notification.type === notificationFilter
                ).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No notifications found</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Info Card */}
            {currentUser && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Officer Info</h2>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{currentUser.full_name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Rank: {currentUser.rank}</p>
                    <p>Department: {currentUser.department}</p>
                    <p>Station: {currentUser.station_id}</p>
                    <p>Role: {currentUser.role}</p>
                  </div>
                  {currentUser.last_login && (
                    <div className="text-xs text-gray-400 mt-2">
                      Last login: {new Date(currentUser.last_login).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* E-FIR Modal */}
      {showEFirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" style={{ isolation: 'isolate' }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Auto-Generated E-FIR Draft</h2>
                <button
                  onClick={() => setShowEFirModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {/* Status Messages */}
              {efirSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>{efirSuccess}</span>
                </div>
              )}
              
              {efirError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{efirError}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Tourist Selection */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Select Tourist</h3>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={efirData.touristId}
                    onChange={(e) => {
                      const selectedTourist = tourists.find(t => t.id === e.target.value);
                      setEfirData({
                        ...efirData,
                        touristId: selectedTourist?.id || '',
                        touristName: selectedTourist?.name || '',
                        touristPhone: selectedTourist?.phone || '',
                        latitude: selectedTourist?.location?.[0] || null,
                        longitude: selectedTourist?.location?.[1] || null,
                        incidentLocation: selectedTourist?.currentArea || ''
                      });
                    }}
                  >
                    <option value="">-- Select Tourist --</option>
                    {tourists.map(tourist => (
                      <option key={tourist.id} value={tourist.id}>
                        {tourist.name} - {tourist.currentArea} ({tourist.status})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">FIR Details</h3>
                  <p><strong>FIR No:</strong> Auto-generated on submission</p>
                  <p><strong>Date & Time:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Station:</strong> {currentUser?.station_id || 'Tourist Police Station'}</p>
                  <p><strong>Reporting Officer:</strong> {currentUser?.full_name || 'Officer'}</p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Incident Type</label>
                    <select 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      value={efirData.incidentType}
                      onChange={(e) => setEfirData({...efirData, incidentType: e.target.value})}
                    >
                      <option value="Emergency Alert">Emergency Alert</option>
                      <option value="Missing Person">Missing Person</option>
                      <option value="Geo-fence Violation">Geo-fence Violation</option>
                      <option value="Theft">Theft</option>
                      <option value="Harassment">Harassment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      value={efirData.priority}
                      onChange={(e) => setEfirData({...efirData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Tourist Information</h3>
                  <p><strong>Name:</strong> {efirData.touristName || 'Select a tourist'}</p>
                  <p><strong>Tourist ID:</strong> {efirData.touristId ? `TST-${efirData.touristId}` : 'Not selected'}</p>
                  <p><strong>Contact:</strong> {efirData.touristPhone || 'Not available'}</p>
                  <p><strong>Last Known Location:</strong> {efirData.latitude ? `${efirData.latitude.toFixed(4)}, ${efirData.longitude.toFixed(4)}` : 'Not available'}</p>
                  <p><strong>Area:</strong> {efirData.incidentLocation || 'Unknown'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Incident Description</h3>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="4"
                    value={efirData.incidentDescription || `Tourist ${efirData.touristName || 'unknown'} triggered emergency panic button at ${new Date().toLocaleTimeString()} hours. Last GPS location shows tourist in vicinity of ${efirData.incidentLocation || 'unknown area'}. No response to automated safety check calls. AI system detected anomalous behavior pattern including sudden location change and prolonged inactivity. Immediate response initiated by system and reported to ${currentUser?.full_name || 'duty officer'}.`}
                    onChange={(e) => setEfirData({...efirData, incidentDescription: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Actions Taken</h3>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="4"
                    value={efirData.actionTaken}
                    onChange={(e) => setEfirData({...efirData, actionTaken: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Additional Information</h3>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Witnesses (if any)</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      value={efirData.witnesses}
                      onChange={(e) => setEfirData({...efirData, witnesses: e.target.value})}
                      placeholder="Names and contact details of witnesses"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Evidence Details</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      value={efirData.evidenceDetails}
                      onChange={(e) => setEfirData({...efirData, evidenceDetails: e.target.value})}
                      placeholder="CCTV footage, physical evidence, etc."
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center ${efirSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={efirSubmitting || !efirData.touristId}
                    onClick={handleEfirSubmit}
                  >
                    {efirSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit E-FIR'
                    )}
                  </button>
                  <button 
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      // Save to localStorage for draft functionality
                      localStorage.setItem('efir_draft', JSON.stringify(efirData));
                      setEfirSuccess('E-FIR saved as draft');
                      setTimeout(() => setEfirSuccess(''), 3000);
                    }}
                  >
                    Save as Draft
                  </button>
                  <button 
                    onClick={() => setShowEFirModal(false)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tourist Details Modal */}
      {selectedTourist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Tourist Details</h2>
                <button
                  onClick={() => setSelectedTourist(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: getStatusColor(selectedTourist.status) }}
                  ></div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTourist.name}</h3>
                    <p className="text-gray-600">ID: {selectedTourist.id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg font-semibold capitalize">{selectedTourist.status}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Safety Score</p>
                    <p className="text-lg font-semibold">{selectedTourist.safetyScore}%</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Contact Information</p>
                  <p className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4" />
                    <span>{selectedTourist.phone}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Last Known Location</p>
                  <p className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedTourist.location[0].toFixed(4)}, {selectedTourist.location[1].toFixed(4)}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Last Update</p>
                  <p className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedTourist.lastUpdate}</span>
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setMapCenter(selectedTourist.location);
                      setActiveTab('map');
                      setSelectedTourist(null);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>View on Map</span>
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Contact</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Incident Details</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`h-3 w-3 rounded-full ${
                    selectedIncident.severity === 'high' ? 'bg-red-500' :
                    selectedIncident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedIncident.type}</h3>
                    <p className="text-gray-600">ID: {selectedIncident.id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg font-semibold capitalize">{selectedIncident.status}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Severity</p>
                    <p className="text-lg font-semibold capitalize">{selectedIncident.severity}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Tourist Involved</p>
                  <p className="mt-1">{selectedIncident.touristName}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedIncident.location[0].toFixed(4)}, {selectedIncident.location[1].toFixed(4)}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedIncident.timestamp}</span>
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setMapCenter(selectedIncident.location);
                      setActiveTab('map');
                      setSelectedIncident(null);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>View on Map</span>
                  </button>
                  {selectedIncident.status === 'active' && (
                    <button 
                      onClick={() => {
                        setSelectedIncident(null);
                        setShowEFirModal(true);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Generate E-FIR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* E-FIR List Modal */}
      {showEfirList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Electronic FIRs</h2>
              <button
                onClick={() => setShowEfirList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                    value={efirFilters.status}
                    onChange={(e) => setEfirFilters({...efirFilters, status: e.target.value})}
                  >
                    <option value="">All</option>
                    <option value="registered">Registered</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                    value={efirFilters.priority}
                    onChange={(e) => setEfirFilters({...efirFilters, priority: e.target.value})}
                  >
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                    value={efirFilters.dateFrom}
                    onChange={(e) => setEfirFilters({...efirFilters, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                    value={efirFilters.dateTo}
                    onChange={(e) => setEfirFilters({...efirFilters, dateTo: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={fetchEFIRs}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {efirsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading E-FIRs...</span>
                </div>
              ) : efirs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">No E-FIRs found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or submit a new E-FIR</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {efirs.map((efir) => (
                    <div key={efir.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{efir.fir_number}</p>
                          <p className="text-sm text-gray-600 mt-1">{efir.incident_type} - {efir.tourist_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(efir.incident_date_time).toLocaleDateString()}
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              efir.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                              efir.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                              efir.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {efir.status.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              efir.priority === 'high' ? 'bg-red-100 text-red-800' :
                              efir.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {efir.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEfir(efir);
                              setShowEfirViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View E-FIR"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => generatePDF(efir)}
                            className="text-green-600 hover:text-green-800"
                            title="Download as PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* E-FIR View Modal */}
      {selectedEfir && showEfirViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">E-FIR Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => generatePDF(selectedEfir)}
                  className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                  title="Download as PDF"
                >
                  <Download className="h-5 w-5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setShowEfirViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">FIR NUMBER</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedEfir.fir_number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedEfir.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                      selectedEfir.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEfir.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEfir.status.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedEfir.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedEfir.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedEfir.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">INCIDENT TYPE</p>
                    <p className="font-medium">{selectedEfir.incident_type}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">DATE & TIME</p>
                    <p className="font-medium">
                      {new Date(selectedEfir.incident_date_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Complainant Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">NAME</p>
                      <p className="font-medium">{selectedEfir.tourist_name}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">PHONE</p>
                      <p className="font-medium">{selectedEfir.tourist_phone}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mt-2">
                    <p className="text-xs text-gray-500">ADDRESS</p>
                    <p className="font-medium">{selectedEfir.tourist_address}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Incident Details</h3>
                  <div className="bg-gray-50 p-3 rounded-lg mb-2">
                    <p className="text-xs text-gray-500">LOCATION</p>
                    <p className="font-medium">{selectedEfir.incident_location}</p>
                    <p className="text-xs text-gray-500 mt-1">COORDINATES</p>
                    <p className="text-sm">{selectedEfir.incident_latitude}, {selectedEfir.incident_longitude}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">DESCRIPTION</p>
                    <p className="whitespace-pre-wrap">{selectedEfir.incident_description}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Reporting Officer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">OFFICER NAME</p>
                      <p className="font-medium">{selectedEfir.officer_name}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">POLICE STATION</p>
                      <p className="font-medium">{selectedEfir.station_name}</p>
                    </div>
                  </div>
                </div>
                
                {(selectedEfir.witnesses || selectedEfir.evidence_details || selectedEfir.action_taken) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h3>
                    {selectedEfir.witnesses && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-2">
                        <p className="text-xs text-gray-500">WITNESSES</p>
                        <p className="whitespace-pre-wrap">{selectedEfir.witnesses}</p>
                      </div>
                    )}
                    {selectedEfir.evidence_details && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-2">
                        <p className="text-xs text-gray-500">EVIDENCE</p>
                        <p className="whitespace-pre-wrap">{selectedEfir.evidence_details}</p>
                      </div>
                    )}
                    {selectedEfir.action_taken && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">ACTION TAKEN</p>
                        <p className="whitespace-pre-wrap">{selectedEfir.action_taken}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEfirViewModal(false)}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => generatePDF(selectedEfir)}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;