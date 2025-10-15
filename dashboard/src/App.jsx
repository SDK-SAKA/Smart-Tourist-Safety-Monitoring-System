import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'leaflet/dist/leaflet.css';
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

// Fix for React-Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);


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
//const API_BASE_URL = 'http://localhost:8000/api';

// API Service with Supabase Integration (Supabase-only, no localStorage fallbacks)
const apiService = {
  // Auth endpoints with Supabase
register: async (userData) => {
  console.log('🆕 Supabase Auth registration attempt for:', userData.email);

  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        full_name: userData.full_name,
        department: userData.department,
        rank: userData.rank,
        station_id: userData.station_id,
        role: userData.role || 'officer'
      }
    }
  });

  if (error) {
    console.error('❌ Supabase Auth registration error:', error.message);
    return { detail: error.message };
  }

  console.log('✅ Supabase registration successful for:', userData.full_name);
  return { success: true, user: data.user };
},

login: async (credentials) => {
  console.log('🔐 Supabase Auth login attempt for:', credentials.username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.username,
    password: credentials.password,
  });

  if (error) {
    console.error('❌ Supabase Auth error:', error.message);
    return { detail: error.message };
  }

  const user = data.user;
  console.log('✅ Supabase Auth successful for:', user.email);

  return {
    access_token: data.session.access_token,
    user: user,
  };
},

getCurrentUser: async (token) => {
await supabase.auth.signOut()
localStorage.clear()
window.location.reload()
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

getDashboardStats: async () => {
  try {
    // Get live counts from Supabase
    const [{ count: touristCount }, { count: incidentCount }, { count: efirCount }] = await Promise.all([
      supabase.from('tourists').select('*', { count: 'exact', head: true }),
      supabase.from('incidents').select('*', { count: 'exact', head: true }),
      supabase.from('efirs').select('*', { count: 'exact', head: true }),
    ]);

    // Calculate safe tourists based on a "status" column if exists
    const { data: safeTourists } = await supabase
      .from('tourists')
      .select('id')
      .eq('status', 'safe');

    return {
      active_tourists: touristCount || 0,
      active_incidents: incidentCount || 0,
      safe_tourists: safeTourists?.length || 0,
      efirs_today: efirCount || 0,
    };
  } catch (error) {
    console.error('Error loading dashboard stats from Supabase:', error);
    return { active_tourists: 0, active_incidents: 0, safe_tourists: 0, efirs_today: 0 };
  }
},

getTourists: async () => {
  try {
    const { data, error } = await supabase.from('tourists').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading tourists from Supabase:', error);
    return [];
  }
},

  getIncidents: async () => {
    try {
      console.log('Fetching incidents directly from Supabase...');
      const { data, error } = await supabase.from('incidents').select('*');

      if (error) {
        console.error('Error fetching incidents from Supabase:', error);
        throw error;
      }

      console.log(`✅ Retrieved ${data.length} incidents from Supabase`);
      return data;
    } catch (err) {
      console.error('❌ Supabase incident fetch failed:', err);
      return [];
    }
  },

  // Submit E-FIR to Supabase database
  submitEFIR: async (efirs) => {
    console.log('📝 Submitting E-FIR to Supabase:', efirs);

    try {
      // Check for potential duplicates before submission
      console.log('🔍 Checking for duplicate E-FIRs...');
      const currentTime = new Date();
      const twentyFourHoursAgo = new Date(currentTime.getTime() - (24 * 60 * 60 * 1000));

      const { data: existingEfirs, error: duplicateCheckError } = await supabase
        .from('efirs')
        .select('id, fir_number, tourist_name, incident_type, incident_location, incident_date_time')
        .eq('tourist_name', efirs.touristName)
        .eq('incident_type', efirs.incidentType)
        .eq('incident_location', efirs.incidentLocation)
        .gte('incident_date_time', twentyFourHoursAgo.toISOString())
        .order('incident_date_time', { ascending: false });

      if (duplicateCheckError) {
        console.warn('⚠️ Could not check for duplicates, proceeding with submission:', duplicateCheckError);
      } else if (existingEfirs && existingEfirs.length > 0) {
        console.log('🚫 Duplicate E-FIR detected:', existingEfirs[0]);
        return {
          success: false,
          error: `A similar E-FIR (${existingEfirs[0].fir_number}) was already registered for this tourist within the last 24 hours. Please check existing reports before submitting duplicates.`,
          duplicate: true,
          existingFIR: existingEfirs[0].fir_number
        };
      }

      // Generate a unique FIR number
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const firNumber = `FIR-${timestamp}-${randomSuffix}`;

      // Insert into Supabase efirs table
      const { data, error } = await supabase
        .from('efirs')
        .insert([{
          fir_number: firNumber,
          tourist_id: efirs.touristId,
          tourist_name: efirs.touristName,
          tourist_phone: efirs.touristPhone,
          tourist_address: efirs.touristAddress || 'Not provided',
          incident_type: efirs.incidentType,
          incident_description: efirs.incidentDescription,
          incident_location: efirs.incidentLocation,
          incident_latitude: efirs.latitude,
          incident_longitude: efirs.longitude,
          incident_date_time: efirs.incidentDateTime || new Date().toISOString(),
          reported_by: efirs.officerId,
          officer_name: efirs.officerName,
          station_name: efirs.stationName,
          status: 'registered',
          priority: efirs.priority || 'medium',
          witnesses: efirs.witnesses || '',
          evidence_details: efirs.evidenceDetails || '',
          action_taken: efirs.actionTaken || ''
        }])
        .select();

      if (error) {
        console.error('❌ E-FIR submission failed:', error);

        // Check if it's a duplicate error (409 conflict)
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('409')) {
          return {
            success: false,
            error: 'An E-FIR with similar details already exists. Please check existing reports.',
            duplicate: true
          };
        }

        // Fallback to localStorage if Supabase fails
        console.log('🔄 Falling back to localStorage for E-FIR storage');
        const efirs = JSON.parse(localStorage.getItem('demo_efirs') || '[]');

        const newEfir = {
          id: Date.now(),
          fir_number: firNumber,
          ...efirs,
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
    if (center && map) {
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
  
  return null; // This component only handles map logic, doesn't render anything
};

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [incidents, setIncidents] = useState([]);
const [tourists, setTourists] = useState([]);
const [stats, setStats] = useState({ incidents: 0, tourists: 0, efirs: 0 });

  // Dashboard state
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]); // Coimbatore city center
  const [showEFirModal, setShowEFirModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // E-FIR state
  const [efirs, setefirs] = useState({
  touristName: '',
  touristPhone: '',
  touristAddress: '',
  incidentType: 'Emergency Alert',
  priority: 'medium',
  incidentLocation: '',
  incidentDescription: '',
  witnesses: '',
  evidenceDetails: '',
  actionTaken: '',
});
  const [efirSubmitting, setefirsubmitting] = useState(false);
  const [efirError, setEfirError] = useState('');
  const [efirSuccess, setefirsuccess] = useState('');
  const [showEfirList, setShowEfirList] = useState(false);
  
  // Data state
  const [stationAlerts, setStationAlerts] = useState([]);
  const [localPoliceStations, setLocalPoliceStations] = useState(policeStations);
  const [efirsLoading, setefirsLoading] = useState(false);
  const [efirsError, setefirsError] = useState('');
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
const loadDashboardData = async () => {
  try {
    console.log("📊 Loading Supabase dashboard data...");

    const [incidentRes, efirRes, touristRes] = await Promise.all([
      supabase.from("incidents").select("*"),
      supabase.from("efirs").select("*"),
      supabase.from("tourists").select("*"),
    ]);

    const incidentsData = incidentRes.data || [];
    const efirs = efirRes.data || [];
    const touristData = touristRes.data || [];

    setIncidents(incidentsData);
    setefirs(efirs);
    setTourists(touristData);

    setStats({
      incidents: incidentsData.length,
      efirs: efirs.length,
      tourists: touristData.length,
    });

    console.log(
      `✅ Loaded ${incidentsData.length} incidents, ${touristData.length} tourists, ${efirs.length} E-FIRs.`
    );
  } catch (error) {
    console.error("❌ Failed to load Supabase data:", error);
  }
};


  // Fetch E-FIRs from database (must be defined before verifyToken)
  const fetchEFIRs = useCallback(async () => {
    setefirsLoading(true);
    try {
      const response = await apiService.getEFIRs(efirFilters);
      if (response.success) {
        setefirs(response.data);
        console.log(`✅ Fetched ${response.data.length} E-FIRs from ${response.source}`);
      } else {
        console.error('Failed to fetch E-FIRs:', response.error);
        setefirsError(response.error || 'Failed to fetch E-FIRs');
      }
    } catch (error) {
      console.error('Error fetching E-FIRs:', error);
      setefirsError(error.message || 'Error fetching E-FIRs');
    } finally {
      setefirsLoading(false);
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
        loadNotifications(); // Load notifications from Supabase
      } else {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, [fetchEFIRs]);

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, [verifyToken]);
  

  // Fetch E-FIRs when filters change
  useEffect(() => {
    if (isLoggedIn) {
      fetchEFIRs();
    }
  }, [fetchEFIRs, isLoggedIn]);
  useEffect(() => {
  // Initial load
  loadDashboardData();

  // 🟢 Real-time subscriptions for live updates
  const incidentsSub = supabase
    .channel("realtime:incidents")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "incidents" },
      payload => {
        console.log("🔁 Incident update:", payload);
        loadDashboardData(); // reload data whenever incident table changes
      }
    )
    .subscribe();

  const efirsSub = supabase
    .channel("realtime:efirs")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "efirs" },
      payload => {
        console.log("🔁 E-FIR update:", payload);
        loadDashboardData();
      }
    )
    .subscribe();

  const touristsSub = supabase
    .channel("realtime:tourists")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tourists" },
      payload => {
        console.log("🔁 Tourist update:", payload);
        loadDashboardData();
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(incidentsSub);
    supabase.removeChannel(efirsSub);
    supabase.removeChannel(touristsSub);
  };
}, []);

  // Authentication handlers
  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');
    
    try {
      const response = await apiService.login(credentials);
      
      if (response.detail) {
        setAuthError(response.detail);
      } else if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        setCurrentUser(response.user);
        setIsLoggedIn(true);
        setAuthSuccess(`Welcome back, ${response.user.full_name}!`);
        
        // Add login notification
        addNotification(
          'success',
          'auth',
          `Officer ${response.user.full_name} logged in successfully`,
          response.user.full_name,
          'Login'
        );
        
        // Load dashboard data
        loadDashboardData(response.access_token);
        fetchEFIRs();
        loadNotifications();
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');
    
    try {
      const response = await apiService.register(userData);
      
      if (response.detail) {
        setAuthError(response.detail);
      } else if (response.success) {
        setAuthSuccess('Registration successful! Please login with your credentials.');
        setShowRegister(false);
        
        // Add registration notification
        addNotification(
          'info',
          'system',
          `New officer registered: ${userData.full_name}`,
          userData.full_name,
          'Officer Registration'
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error.message || 'Registration failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    // Add logout notification
    if (currentUser) {
      addNotification(
        'info',
        'auth',
        `Officer ${currentUser.full_name} logged out`,
        currentUser.full_name,
        'Logout'
      );
    }
    
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthSuccess('Logged out successfully');
  };

  // E-FIR handlers
  const handleSubmitEFIR = async () => {
    setefirsubmitting(true);
    setEfirError('');
    setefirsuccess('');
    
    try {
      // Get current user's station info
      const userStation = localPoliceStations.find(station => 
        station.id === currentUser?.station_id
      );
      
      const efirSubmissionData = {
        ...efirs,
        officerId: currentUser?.id,
        officerName: currentUser?.full_name,
        stationName: userStation?.name || 'Coimbatore Police Station'
      };
      
      const result = await apiService.submitEFIR(efirSubmissionData);
      
      if (result.success) {
        setefirsuccess(`E-FIR submitted successfully! FIR Number: ${result.data.fir_number}`);
        setShowEFirModal(false);
        
        // Reset form
        setefirs({
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
        
        // Refresh E-FIR list
        fetchEFIRs();
        
        // Add notification
        addNotification(
          'success',
          'efir',
          `New E-FIR registered: ${result.data.fir_number}`,
          currentUser?.full_name,
          'E-FIR Registration'
        );
      } else {
        setEfirError(result.error || 'Failed to submit E-FIR');
      }
    } catch (error) {
      console.error('E-FIR submission error:', error);
      setEfirError(error.message || 'Failed to submit E-FIR');
    } finally {
      setefirsubmitting(false);
    }
  };

  // Generate PDF for E-FIR
  const generateEFIRPDF = (efir) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('COIMBATORE TOURIST SAFETY SYSTEM', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('E-FIR REPORT', 105, 22, { align: 'center' });
    
    // Basic Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('FIR Details', 14, 40);
    
    doc.setFontSize(10);
    const firDetails = [
      ['FIR Number:', efir.fir_number || efir.id],
      ['Status:', efir.status || 'registered'],
      ['Priority:', efir.priority || 'medium'],
      ['Incident Date:', new Date(efir.incident_date_time || efir.created_at).toLocaleString()],
      ['Reported By:', efir.officer_name || currentUser?.full_name],
      ['Police Station:', efir.station_name || 'Coimbatore Police Station']
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Field', 'Value']],
      body: firDetails,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [14, 165, 233] }
    });
    
    // Tourist Information
    doc.setFontSize(16);
    doc.text('Tourist Information', 14, doc.lastAutoTable.finalY + 15);
    
    const touristInfo = [
      ['Tourist Name:', efir.tourist_name],
      ['Tourist Phone:', efir.tourist_phone],
      ['Tourist Address:', efir.tourist_address || 'Not provided']
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: touristInfo,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [14, 165, 233] }
    });
    
    // Incident Details
    doc.setFontSize(16);
    doc.text('Incident Details', 14, doc.lastAutoTable.finalY + 15);
    
    const incidentInfo = [
      ['Incident Type:', efir.incident_type],
      ['Location:', efir.incident_location],
      ['Description:', efir.incident_description],
      ['Witnesses:', efir.witnesses || 'None reported'],
      ['Evidence:', efir.evidence_details || 'None provided'],
      ['Action Taken:', efir.action_taken || 'Emergency alert sent']
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: incidentInfo,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [14, 165, 233] }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleString()} by Coimbatore Tourist Safety System`, 14, finalY);
    
    // Save the PDF
    doc.save(`E-FIR-${efir.fir_number || efir.id}.pdf`);
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (notificationFilter === 'all') return true;
    return notification.type === notificationFilter;
  });

  // Clear all notifications
  const clearAllNotifications = async () => {
    const success = await apiService.clearNotifications();
    if (success) {
      setNotifications([]);
    } else {
      // If Supabase clear fails, clear locally
      setNotifications([]);
    }
  };

  // Render login/register form
  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colorPalette.primary[100],
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <Shield size={32} color={colorPalette.primary[600]} />
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: colorPalette.neutral[900],
              marginBottom: '8px'
            }}>
              Tourist Safety Dashboard
            </h1>
            <p style={{
              color: colorPalette.neutral[600],
              fontSize: '14px'
            }}>
              {showRegister ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          {authError && (
            <div style={{
              background: colorPalette.danger[50],
              border: `1px solid ${colorPalette.danger[200]}`,
              color: colorPalette.danger[700],
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{
              background: colorPalette.safe[50],
              border: `1px solid ${colorPalette.safe[200]}`,
              color: colorPalette.safe[700],
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} />
              {authSuccess}
            </div>
          )}

          {showRegister ? (
            <RegisterForm 
              onSubmit={handleRegister}
              loading={authLoading}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <LoginForm 
              onSubmit={handleLogin}
              loading={authLoading}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    );
  }

  // Render main dashboard
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colorPalette.neutral[50],
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: `1px solid ${colorPalette.neutral[200]}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={24} color={colorPalette.primary[600]} />
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: colorPalette.neutral[900]
            }}>
              Tourist Safety Dashbaord
            </span>
          </div>
          
          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', marginLeft: '32px' }}>
            {['map', 'tourists', 'incidents', 'efir', 'stations', 'notifications'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab ? colorPalette.primary[50] : 'transparent',
                  color: activeTab === tab ? colorPalette.primary[700] : colorPalette.neutral[600],
                  fontWeight: activeTab === tab ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'map' && <MapPin size={16} />}
                {tab === 'tourists' && <Users size={16} />}
                {tab === 'incidents' && <AlertTriangle size={16} />}
                {tab === 'efir' && <FileText size={16} />}
                {tab === 'stations' && <Shield size={16} />}
                {tab === 'notifications' && <Bell size={16} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: colorPalette.neutral[900] }}>
              {currentUser?.full_name}
            </div>
            <div style={{ fontSize: '12px', color: colorPalette.neutral[500] }}>
              {currentUser?.rank} • {currentUser?.department}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${colorPalette.neutral[300]}`,
              background: 'white',
              color: colorPalette.neutral[700],
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = colorPalette.danger[50];
              e.target.style.borderColor = colorPalette.danger[300];
              e.target.style.color = colorPalette.danger[700];
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = colorPalette.neutral[300];
              e.target.style.color = colorPalette.neutral[700];
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px' }}>
        {/* Dashboard Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <StatCard
            title="Active Tourists"
            value={dashboardStats.active_tourists}
            icon={<Users size={20} />}
            color={colorPalette.primary[500]}
          />
          <StatCard
            title="Active Incidents"
            value={dashboardStats.active_incidents}
            icon={<AlertTriangle size={20} />}
            color={colorPalette.danger[500]}
          />
          <StatCard
            title="Safe Tourists"
            value={dashboardStats.safe_tourists}
            icon={<CheckCircle size={20} />}
            color={colorPalette.safe[500]}
          />
          <StatCard
            title="E-FIRs Today"
            value={dashboardStats.efirs_today}
            icon={<FileText size={20} />}
            color={colorPalette.warning[500]}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'map' && (
  <div style={{ 
    background: 'white', 
    borderRadius: '12px', 
    padding: '0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    height: '600px',
    overflow: 'hidden'
  }}>
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
<MapContainer
  center={[11.0168, 76.9558]} // Default center (Coimbatore or your area)
  zoom={13}
  style={{ height: "100vh", width: "100%" }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="&copy; OpenStreetMap contributors"
  />

  {/* Optional: keep your map controller if you have it */}
  <MapController center={mapCenter} zoom={13} />

  {/* 🧍 TOURISTS (from Supabase) */}
  {tourists
    .filter(
      t =>
        Array.isArray(t.location) &&
        t.location.length === 2 &&
        t.location.every(coord => typeof coord === "number" && !isNaN(coord))
    )
    .map(tourist => (
      <Marker key={`tourist-${tourist.id}`} position={tourist.location}>
        <Popup>
          <div style={{ padding: "8px", minWidth: "200px" }}>
            <h3 style={{ margin: "0 0 8px 0" }}>{tourist.name}</h3>
            {tourist.phone && (
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                📞 {tourist.phone}
              </p>
            )}
            {tourist.status && (
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                Status: {tourist.status}
              </p>
            )}
            {tourist.currentArea && (
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                Area: {tourist.currentArea}
              </p>
            )}
            {typeof tourist.safetyScore === "number" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "8px",
                  padding: "4px 8px",
                  background:
                    tourist.safetyScore >= 80
                      ? "#e6f4ea"
                      : tourist.safetyScore >= 60
                      ? "#fff6e5"
                      : "#fdecea",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <Shield size={12} />
                Safety Score: {tourist.safetyScore}/100
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    ))}

  {/* 🚨 INCIDENTS (from Supabase) */}
  {incidents
    .filter(
      i =>
        Array.isArray(i.location) &&
        i.location.length === 2 &&
        i.location.every(coord => typeof coord === "number" && !isNaN(coord))
    )
    .map(incident => (
      <Circle
        key={`incident-${incident.id}`}
        center={incident.location}
        radius={incident.radius || 150}
        color={incident.status === "active" ? "red" : "green"}
        fillOpacity={0.3}
      >
        <Popup>
          <strong>{incident.title || "Incident"}</strong>
          <br />
          {incident.description || "No details available"}
          <br />
          {incident.date && (
            <em>{new Date(incident.date).toLocaleString()}</em>
          )}
        </Popup>
      </Circle>
    ))}

  {/* 📁 E-FIRs (from Supabase) */}
  {efirs
    .filter(
      e =>
        Array.isArray(e.location) &&
        e.location.length === 2 &&
        e.location.every(coord => typeof coord === "number" && !isNaN(coord))
    )
    .map(e => (
      <Circle
        key={`efir-${e.id}`}
        center={e.location}
        radius={200}
        color="blue"
        fillOpacity={0.2}
      >
        <Popup>
          <strong>E-FIR #{e.id}</strong>
          <br />
          {e.crime_type || "Unknown Type"}
          <br />
          {e.status || "Pending"}
        </Popup>
      </Circle>
    ))}
</MapContainer>
    </MapContainer>
  </div>
)}

        {activeTab === 'tourists' && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: colorPalette.neutral[900],
                margin: 0
              }}>
                Tourist Monitoring
              </h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: colorPalette.neutral[400]
                  }} />
                  <input
                    type="text"
                    placeholder="Search tourists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 36px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '250px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {tourists
                .filter(tourist => 
                  tourist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  tourist.currentArea.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(tourist => (
                  <div
                    key={tourist.id}
                    style={{
                      padding: '16px',
                      border: `1px solid ${colorPalette.neutral[200]}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = colorPalette.primary[300];
                      e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = colorPalette.neutral[200];
                      e.target.style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      setSelectedTourist(tourist);
                      setMapCenter(tourist.location);
                      setActiveTab('map');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: tourist.status === 'safe' ? colorPalette.safe[100] : 
                                   tourist.status === 'alert' ? colorPalette.warning[100] : colorPalette.danger[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tourist.status === 'safe' ? colorPalette.safe[600] : 
                               tourist.status === 'alert' ? colorPalette.warning[600] : colorPalette.danger[600]
                      }}>
                        <User size={20} />
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: colorPalette.neutral[900]
                        }}>
                          {tourist.name}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: colorPalette.neutral[600],
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px'
                        }}>
                          <MapPin size={12} />
                          {tourist.currentArea}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: tourist.status === 'safe' ? colorPalette.safe[50] : 
                                     tourist.status === 'alert' ? colorPalette.warning[50] : colorPalette.danger[50],
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: tourist.status === 'safe' ? colorPalette.safe[700] : 
                                 tourist.status === 'alert' ? colorPalette.warning[700] : colorPalette.danger[700]
                        }}>
                          {tourist.status === 'safe' && <CheckCircle size={12} />}
                          {tourist.status === 'alert' && <AlertTriangle size={12} />}
                          {tourist.status === 'emergency' && <Zap size={12} />}
                          {tourist.status.charAt(0).toUpperCase() + tourist.status.slice(1)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: colorPalette.neutral[500],
                          marginTop: '4px'
                        }}>
                          Safety: {tourist.safetyScore}/100
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: colorPalette.neutral[500] }}>
                          Last Update
                        </div>
                        <div style={{ fontSize: '14px', color: colorPalette.neutral[700] }}>
                          {tourist.lastUpdate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

{activeTab === 'incidents' && (
  <div style={{ 
    background: 'white', 
    borderRadius: '12px', 
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '24px'
    }}>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: colorPalette.neutral[900],
        margin: 0
      }}>
        Incident Management
      </h2>
    </div>

    <div style={{ display: 'grid', gap: '16px' }}>
      {incidents.map(incident => (
        <div
          key={incident.id}
          style={{
            padding: '16px',
            border: `1px solid ${colorPalette.neutral[200]}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = colorPalette.primary[300];
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = colorPalette.neutral[200];
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => {
            setSelectedIncident(incident);
            setMapCenter(incident.location);
            setActiveTab('map');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: incident.severity === 'high' ? colorPalette.danger[100] : 
                         incident.severity === 'medium' ? colorPalette.warning[100] : colorPalette.safe[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: incident.severity === 'high' ? colorPalette.danger[600] : 
                     incident.severity === 'medium' ? colorPalette.warning[600] : colorPalette.safe[600]
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: colorPalette.neutral[900]
              }}>
                {incident.type}
              </div>
              <div style={{
                fontSize: '14px',
                color: colorPalette.neutral[600],
                marginTop: '2px'
              }}>
                <strong>Tourist:</strong> {incident.touristName} • <strong>Location:</strong> {incident.area}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: incident.status === 'active' ? colorPalette.danger[50] : 
                           incident.status === 'investigating' ? colorPalette.warning[50] : colorPalette.safe[50],
                borderRadius: '4px',
                fontSize: '12px',
                color: incident.status === 'active' ? colorPalette.danger[700] : 
                       incident.status === 'investigating' ? colorPalette.warning[700] : colorPalette.safe[700]
              }}>
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </div>
              <div style={{
                fontSize: '12px',
                color: colorPalette.neutral[500],
                marginTop: '4px'
              }}>
                Severity: {incident.severity}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: colorPalette.neutral[500] }}>
                Reported
              </div>
              <div style={{ fontSize: '14px', color: colorPalette.neutral[700] }}>
                {incident.timestamp}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {activeTab === 'efir' && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: colorPalette.neutral[900],
                margin: 0
              }}>
                E-FIR Management
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowEfirList(!showEfirList)}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    background: 'white',
                    color: colorPalette.neutral[700],
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={16} />
                  {showEfirList ? 'New E-FIR' : 'View E-FIRs'}
                </button>
                <button
                  onClick={() => setShowEFirModal(true)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: colorPalette.primary[600],
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={16} />
                  Register New E-FIR
                </button>
              </div>
            </div>

            {showEfirList ? (
              <div>
                {/* E-FIR List View */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Registered E-FIRs
                  </h3>
                  
                  {/* Filters */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <select
                      value={efirFilters.status}
                      onChange={(e) => setEfirFilters(prev => ({ ...prev, status: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colorPalette.neutral[300]}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="registered">Registered</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <select
                      value={efirFilters.priority}
                      onChange={(e) => setEfirFilters(prev => ({ ...prev, priority: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colorPalette.neutral[300]}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    
                    <input
                      type="date"
                      value={efirFilters.dateFrom}
                      onChange={(e) => setEfirFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      placeholder="From Date"
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colorPalette.neutral[300]}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    
                    <input
                      type="date"
                      value={efirFilters.dateTo}
                      onChange={(e) => setEfirFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      placeholder="To Date"
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colorPalette.neutral[300]}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {efirsLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '40px',
                    color: colorPalette.neutral[500]
                  }}>
                    <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
                    Loading E-FIRs...
                  </div>
                ) : efirsError ? (
                  <div style={{
                    background: colorPalette.danger[50],
                    border: `1px solid ${colorPalette.danger[200]}`,
                    color: colorPalette.danger[700],
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    {efirsError}
                  </div>
                ) : efirs.length === 0 ? (
                  <div style={{
                    background: colorPalette.neutral[50],
                    border: `1px solid ${colorPalette.neutral[200]}`,
                    color: colorPalette.neutral[600],
                    padding: '40px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div>No E-FIRs found</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {efirs.map(efir => (
                      <div
                        key={efir.id}
                        style={{
                          padding: '16px',
                          border: `1px solid ${colorPalette.neutral[200]}`,
                          borderRadius: '8px',
                          background: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = colorPalette.primary[300];
                          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = colorPalette.neutral[200];
                          e.target.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          setSelectedEfir(efir);
                          setShowEfirViewModal(true);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ 
                                fontSize: '16px', 
                                fontWeight: '600',
                                color: colorPalette.neutral[900]
                              }}>
                                {efir.fir_number || `E-FIR-${efir.id}`}
                              </span>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                background: efir.status === 'registered' ? colorPalette.primary[50] : 
                                           efir.status === 'investigating' ? colorPalette.warning[50] : colorPalette.safe[50],
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: efir.status === 'registered' ? colorPalette.primary[700] : 
                                       efir.status === 'investigating' ? colorPalette.warning[700] : colorPalette.safe[700]
                              }}>
                                {efir.status?.charAt(0).toUpperCase() + efir.status?.slice(1) || 'Registered'}
                              </span>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                background: efir.priority === 'high' ? colorPalette.danger[50] : 
                                           efir.priority === 'medium' ? colorPalette.warning[50] : colorPalette.safe[50],
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: efir.priority === 'high' ? colorPalette.danger[700] : 
                                       efir.priority === 'medium' ? colorPalette.warning[700] : colorPalette.safe[700]
                              }}>
                                {efir.priority?.charAt(0).toUpperCase() + efir.priority?.slice(1) || 'Medium'}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: colorPalette.neutral[600], marginBottom: '4px' }}>
                              <strong>Tourist:</strong> {efir.tourist_name} • <strong>Incident:</strong> {efir.incident_type}
                            </div>
                            <div style={{ fontSize: '14px', color: colorPalette.neutral[600], marginBottom: '4px' }}>
                              <strong>Location:</strong> {efir.incident_location}
                            </div>
                            <div style={{ fontSize: '14px', color: colorPalette.neutral[600] }}>
                              <strong>Reported by:</strong> {efir.officer_name} • <strong>Station:</strong> {efir.station_name}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: colorPalette.neutral[500] }}>
                              {new Date(efir.incident_date_time || efir.created_at).toLocaleDateString()}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateEFIRPDF(efir);
                              }}
                              style={{
                                padding: '6px 12px',
                                border: `1px solid ${colorPalette.neutral[300]}`,
                                background: 'white',
                                color: colorPalette.neutral[700],
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '8px'
                              }}
                            >
                              <Download size={12} />
                              PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: colorPalette.neutral[50],
                border: `2px dashed ${colorPalette.neutral[300]}`,
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <FileText size={48} style={{ marginBottom: '16px', color: colorPalette.neutral[400] }} />
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: colorPalette.neutral[700],
                  marginBottom: '8px'
                }}>
                  E-FIR Management System
                </h3>
                <p style={{ 
                  color: colorPalette.neutral[600],
                  marginBottom: '24px',
                  maxWidth: '400px',
                  margin: '0 auto 24px'
                }}>
                  Register new Electronic First Information Reports (E-FIRs) for tourist incidents and emergencies.
                </p>
                <button
                  onClick={() => setShowEFirModal(true)}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: colorPalette.primary[600],
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500'
                  }}
                >
                  <FileText size={16} />
                  Register New E-FIR
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stations' && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: colorPalette.neutral[900],
              marginBottom: '24px'
            }}>
              Police Stations Network
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {localPoliceStations.map(station => (
                <div
                  key={station.id}
                  style={{
                    padding: '20px',
                    border: `1px solid ${colorPalette.neutral[200]}`,
                    borderRadius: '8px',
                    background: 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = colorPalette.primary[300];
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = colorPalette.neutral[200];
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: colorPalette.primary[700],
                        margin: '0 0 8px 0'
                      }}>
                        {station.name}
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', color: colorPalette.neutral[600], marginBottom: '4px' }}>
                            <strong>Station Officer:</strong> {station.officer}
                          </div>
                          <div style={{ fontSize: '14px', color: colorPalette.neutral[600], marginBottom: '4px' }}>
                            <strong>Contact:</strong> {station.contactNumber}
                          </div>
                          <div style={{ fontSize: '14px', color: colorPalette.neutral[600] }}>
                            <strong>Email:</strong> {station.email}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '14px', color: colorPalette.neutral[600], marginBottom: '8px' }}>
                            <strong>Jurisdiction:</strong>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {station.jurisdiction.map(area => (
                              <span
                                key={area}
                                style={{
                                  padding: '2px 8px',
                                  background: colorPalette.primary[50],
                                  color: colorPalette.primary[700],
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: colorPalette.safe[50],
                        color: colorPalette.safe[700],
                        borderRadius: '4px',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        <Shield size={12} />
                        Operational
                      </div>
                      <div style={{ fontSize: '12px', color: colorPalette.neutral[500] }}>
                        Range: {station.range}m
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: colorPalette.neutral[900],
                margin: 0
              }}>
                System Notifications
              </h2>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={notificationFilter}
                  onChange={(e) => setNotificationFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="all">All Notifications</option>
                  <option value="emergency">Emergency</option>
                  <option value="warning">Warning</option>
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                </select>
                
                <button
                  onClick={clearAllNotifications}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    background: 'white',
                    color: colorPalette.neutral[700],
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={16} />
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredNotifications.length === 0 ? (
                <div style={{
                  background: colorPalette.neutral[50],
                  border: `1px solid ${colorPalette.neutral[200]}`,
                  color: colorPalette.neutral[600],
                  padding: '40px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div>No notifications found</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      style={{
                        padding: '16px',
                        border: `1px solid ${colorPalette.neutral[200]}`,
                        borderRadius: '8px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = colorPalette.primary[300];
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = colorPalette.neutral[200];
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: notification.type === 'emergency' ? colorPalette.danger[100] : 
                                   notification.type === 'warning' ? colorPalette.warning[100] : 
                                   notification.type === 'success' ? colorPalette.safe[100] : colorPalette.primary[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: notification.type === 'emergency' ? colorPalette.danger[600] : 
                               notification.type === 'warning' ? colorPalette.warning[600] : 
                               notification.type === 'success' ? colorPalette.safe[600] : colorPalette.primary[600],
                        flexShrink: 0
                      }}>
                        {notification.type === 'emergency' && <Zap size={16} />}
                        {notification.type === 'warning' && <AlertTriangle size={16} />}
                        {notification.type === 'success' && <CheckCircle size={16} />}
                        {notification.type === 'info' && <Bell size={16} />}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          color: colorPalette.neutral[900],
                          marginBottom: '4px'
                        }}>
                          {notification.message}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: colorPalette.neutral[500],
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>User: {notification.user}</span>
                          <span>•</span>
                          <span>Action: {notification.action}</span>
                          <span>•</span>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* E-FIR Registration Modal */}
      {showEFirModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: colorPalette.neutral[900],
                margin: 0
              }}>
                Register E-FIR
              </h2>
              <button
                onClick={() => setShowEFirModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colorPalette.neutral[500],
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = colorPalette.neutral[100];
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                }}
              >
                <XCircle size={20} />
              </button>
            </div>

            {efirError && (
              <div style={{
                background: colorPalette.danger[50],
                border: `1px solid ${colorPalette.danger[200]}`,
                color: colorPalette.danger[700],
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {efirError}
              </div>
            )}

            {efirSuccess && (
              <div style={{
                background: colorPalette.safe[50],
                border: `1px solid ${colorPalette.safe[200]}`,
                color: colorPalette.safe[700],
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {efirSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Tourist Name *
                  </label>
                  <input
                    type="text"
                    value={efirs.touristName}
                    onChange={(e) => setefirs(prev => ({ ...prev, touristName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter tourist full name"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Tourist Phone *
                  </label>
                  <input
                    type="tel"
                    value={efirs.touristPhone}
                    onChange={(e) => setefirs(prev => ({ ...prev, touristPhone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="+91-9876543210"
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: colorPalette.neutral[700],
                  marginBottom: '4px'
                }}>
                  Tourist Address
                </label>
                <textarea
                  value={efirs.touristAddress}
                  onChange={(e) => setefirs(prev => ({ ...prev, touristAddress: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter tourist permanent address"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Incident Type *
                  </label>
                  <select
                    value={efirs.incidentType}
                    onChange={(e) => setefirs(prev => ({ ...prev, incidentType: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Emergency Alert">Emergency Alert</option>
                    <option value="Theft">Theft</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Lost Property">Lost Property</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Traffic Accident">Traffic Accident</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Priority *
                  </label>
                  <select
                    value={efirs.priority}
                    onChange={(e) => setefirs(prev => ({ ...prev, priority: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: colorPalette.neutral[700],
                  marginBottom: '4px'
                }}>
                  Incident Location *
                </label>
                <input
                  type="text"
                  value={efirs.incidentLocation}
                  onChange={(e) => setefirs(prev => ({ ...prev, incidentLocation: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter incident location details"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: colorPalette.neutral[700],
                  marginBottom: '4px'
                }}>
                  Incident Description *
                </label>
                <textarea
                  value={efirs.incidentDescription}
                  onChange={(e) => setefirs(prev => ({ ...prev, incidentDescription: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Provide detailed description of the incident"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Witnesses
                  </label>
                  <input
                    type="text"
                    value={efirs.witnesses}
                    onChange={(e) => setefirs(prev => ({ ...prev, witnesses: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Names of witnesses if any"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: colorPalette.neutral[700],
                    marginBottom: '4px'
                  }}>
                    Evidence Details
                  </label>
                  <input
                    type="text"
                    value={efirs.evidenceDetails}
                    onChange={(e) => setefirs(prev => ({ ...prev, evidenceDetails: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colorPalette.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Photos, videos, documents etc."
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: colorPalette.neutral[700],
                  marginBottom: '4px'
                }}>
                  Immediate Action Taken
                </label>
                <textarea
                  value={efirs.actionTaken}
                  onChange={(e) => setefirs(prev => ({ ...prev, actionTaken: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.neutral[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Describe immediate actions taken"
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${colorPalette.neutral[200]}`
            }}>
              <button
                onClick={() => setShowEFirModal(false)}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${colorPalette.neutral[300]}`,
                  background: 'white',
                  color: colorPalette.neutral[700],
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEFIR}
                disabled={efirSubmitting || !efirs.touristName || !efirs.touristPhone || !efirs.incidentDescription}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: efirSubmitting || !efirs.touristName || !efirs.touristPhone || !efirs.incidentDescription ? 
                            colorPalette.neutral[300] : colorPalette.primary[600],
                  color: 'white',
                  borderRadius: '6px',
                  cursor: efirSubmitting || !efirs.touristName || !efirs.touristPhone || !efirs.incidentDescription ? 
                         'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {efirSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Submit E-FIR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-FIR View Modal */}
      {showEfirViewModal && selectedEfir && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: colorPalette.neutral[900],
                margin: 0
              }}>
                E-FIR Details
              </h2>
              <button
                onClick={() => setShowEfirViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colorPalette.neutral[500],
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = colorPalette.neutral[100];
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* FIR Header */}
              <div style={{
                background: colorPalette.primary[50],
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${colorPalette.primary[200]}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: colorPalette.primary[700] }}>
                      {selectedEfir.fir_number || `E-FIR-${selectedEfir.id}`}
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.primary[600] }}>
                      Coimbatore Tourist Safety System
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: selectedEfir.status === 'registered' ? colorPalette.primary[100] : 
                                 selectedEfir.status === 'investigating' ? colorPalette.warning[100] : colorPalette.safe[100],
                      color: selectedEfir.status === 'registered' ? colorPalette.primary[700] : 
                             selectedEfir.status === 'investigating' ? colorPalette.warning[700] : colorPalette.safe[700],
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {selectedEfir.status?.charAt(0).toUpperCase() + selectedEfir.status?.slice(1) || 'Registered'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: colorPalette.neutral[800],
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${colorPalette.neutral[200]}`
                }}>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Reported By
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.officer_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Police Station
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.station_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Priority
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: selectedEfir.priority === 'high' ? colorPalette.danger[700] : 
                             selectedEfir.priority === 'medium' ? colorPalette.warning[700] : colorPalette.safe[700]
                    }}>
                      {selectedEfir.priority?.charAt(0).toUpperCase() + selectedEfir.priority?.slice(1) || 'Medium'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Incident Date
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {new Date(selectedEfir.incident_date_time || selectedEfir.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tourist Information */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: colorPalette.neutral[800],
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${colorPalette.neutral[200]}`
                }}>
                  Tourist Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Full Name
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.tourist_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Phone Number
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.tourist_phone}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Address
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.tourist_address || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: colorPalette.neutral[800],
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${colorPalette.neutral[200]}`
                }}>
                  Incident Details
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Incident Type
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.incident_type}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Location
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.incident_location}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Description
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: colorPalette.neutral[800],
                      background: colorPalette.neutral[50],
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${colorPalette.neutral[200]}`
                    }}>
                      {selectedEfir.incident_description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: colorPalette.neutral[800],
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${colorPalette.neutral[200]}`
                }}>
                  Additional Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Witnesses
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.witnesses || 'None reported'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Evidence
                    </div>
                    <div style={{ fontSize: '14px', color: colorPalette.neutral[800] }}>
                      {selectedEfir.evidence_details || 'None provided'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', color: colorPalette.neutral[500], marginBottom: '2px' }}>
                      Action Taken
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: colorPalette.neutral[800],
                      background: colorPalette.neutral[50],
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${colorPalette.neutral[200]}`
                    }}>
                      {selectedEfir.action_taken || 'Emergency alert sent to nearest patrol unit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${colorPalette.neutral[200]}`
            }}>
              <button
                onClick={() => generateEFIRPDF(selectedEfir)}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${colorPalette.neutral[300]}`,
                  background: 'white',
                  color: colorPalette.neutral[700],
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={() => setShowEfirViewModal(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: colorPalette.primary[600],
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: `1px solid #f1f5f9`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '8px',
      background: `${color}15`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color
    }}>
      {icon}
    </div>
    <div>
      <div style={{
        fontSize: '12px',
        fontWeight: '500',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0f172a'
      }}>
        {value}
      </div>
    </div>
  </div>
);

// Login Form Component
const LoginForm = ({ onSubmit, loading, onSwitchToRegister }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Username or Email
        </label>
        <input
          type="text"
          value={credentials.username}
          onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your username or email"
          required
        />
      </div>
      
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Password
        </label>
        <input
          type="password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your password"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: loading ? '#9ca3af' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
      
      {/* <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          Don't have an account?{' '}
        </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#0ea5e9',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Register here
        </button>
      </div> */}
    </form>
  );
};

// Register Form Component
const RegisterForm = ({ onSubmit, loading, onSwitchToLogin }) => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    department: 'Police Department',
    rank: 'Constable',
    station_id: 'PS1',
    role: 'officer'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userData.password !== userData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    onSubmit(userData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Username *
          </label>
          <input
            type="text"
            value={userData.username}
            onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Choose a username"
            required
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Email *
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="your.email@example.com"
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Password *
          </label>
          <input
            type="password"
            value={userData.password}
            onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Create a password"
            required
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Confirm Password *
          </label>
          <input
            type="password"
            value={userData.confirmPassword}
            onChange={(e) => setUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>

      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Full Name *
        </label>
        <input
          type="text"
          value={userData.full_name}
          onChange={(e) => setUserData(prev => ({ ...prev, full_name: e.target.value }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your full name"
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={userData.phone}
            onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="+91-9876543210"
            required
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Rank *
          </label>
          <select
            value={userData.rank}
            onChange={(e) => setUserData(prev => ({ ...prev, rank: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="Constable">Constable</option>
            <option value="Head Constable">Head Constable</option>
            <option value="Sub Inspector">Sub Inspector</option>
            <option value="Inspector">Inspector</option>
            <option value="Deputy Superintendent">Deputy Superintendent</option>
            <option value="Superintendent">Superintendent</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Department *
          </label>
          <select
            value={userData.department}
            onChange={(e) => setUserData(prev => ({ ...prev, department: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="Police Department">Police Department</option>
            <option value="Tourist Police">Tourist Police</option>
            <option value="Traffic Police">Traffic Police</option>
            <option value="Crime Branch">Crime Branch</option>
          </select>
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Police Station *
          </label>
          <select
            value={userData.station_id}
            onChange={(e) => setUserData(prev => ({ ...prev, station_id: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="PS1">RS Puram Police Station</option>
            <option value="PS2">Race Course Police Station</option>
            <option value="PS3">Peelamedu Police Station</option>
            <option value="PS4">Ukkadam Police Station</option>
            <option value="PS5">Railway Police Station</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: loading ? '#9ca3af' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Create Account
          </>
        )}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          Already have an account?{' '}
        </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#0ea5e9',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Sign in here
        </button>
      </div>
    </form>
  );
};

export default App;