import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  ArrowLeft
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// API Service
const apiService = {
  // Auth endpoints
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
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
  }
};

// Mock data (fallback if API is not available)
const mockTourists = [
  { id: '1', name: 'John Doe', location: [28.6139, 77.2090], status: 'safe', lastUpdate: '2 mins ago', phone: '+91-9876543210', safetyScore: 85 },
  { id: '2', name: 'Sarah Smith', location: [28.6129, 77.2295], status: 'alert', lastUpdate: '5 mins ago', phone: '+91-9876543211', safetyScore: 60 },
  { id: '3', name: 'Mike Johnson', location: [28.6169, 77.2310], status: 'emergency', lastUpdate: '1 min ago', phone: '+91-9876543212', safetyScore: 30 },
  { id: '4', name: 'Emma Wilson', location: [28.6200, 77.2100], status: 'safe', lastUpdate: '3 mins ago', phone: '+91-9876543213', safetyScore: 90 },
];

const mockIncidents = [
  { id: 'INC001', touristName: 'Mike Johnson', type: 'Emergency Alert', location: [28.6169, 77.2310], timestamp: '2024-09-25 14:30', status: 'active', severity: 'high' },
  { id: 'INC002', touristName: 'Sarah Smith', type: 'Geo-fence Violation', location: [28.6129, 77.2295], timestamp: '2024-09-25 14:25', status: 'investigating', severity: 'medium' },
  { id: 'INC003', touristName: 'Alex Brown', type: 'Inactivity Alert', location: [28.6150, 77.2200], timestamp: '2024-09-25 13:45', status: 'resolved', severity: 'low' },
];

const mockGeoFences = [
  { id: 'GF1', center: [28.6129, 77.2295], radius: 500, type: 'restricted', name: 'High Risk Zone A' },
  { id: 'GF2', center: [28.6200, 77.2100], radius: 300, type: 'safe', name: 'Tourist Hub' },
];

// Custom hook for map operations
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
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

  // Form state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    department: '',
    rank: '',
    station_id: '',
    role: 'officer'
  });

  // Dashboard state
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [showEFirModal, setShowEFirModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [tourists, setTourists] = useState(mockTourists);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [dashboardStats, setDashboardStats] = useState({
    active_tourists: 4,
    active_incidents: 1,
    safe_tourists: 3,
    efirs_today: 3
  });
  const [notifications] = useState([
    { id: 1, message: 'Emergency alert from Mike Johnson', time: '1 min ago', type: 'emergency' },
    { id: 2, message: 'Geo-fence violation detected', time: '5 mins ago', type: 'warning' },
  ]);

  // Verify token and load user data
  const verifyToken = useCallback(async (token) => {
    try {
      const userData = await apiService.getCurrentUser(token);
      if (userData.username) {
        setCurrentUser(userData);
        setIsLoggedIn(true);
        loadDashboardData(token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
    }
  }, []);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    }
  }, [verifyToken]);

  // Load dashboard data
  const loadDashboardData = async (token) => {
    try {
      const [stats, touristsData, incidentsData] = await Promise.all([
        apiService.getDashboardStats(token),
        apiService.getTourists(token),
        apiService.getIncidents(token)
      ]);
      
      setDashboardStats(stats);
      setTourists(touristsData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use mock data as fallback
    }
  };

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }

    // Validate required fields
    const requiredFields = ['username', 'email', 'password', 'full_name', 'phone', 'department', 'rank', 'station_id'];
    const missingFields = requiredFields.filter(field => !registerData[field].trim());
    
    if (missingFields.length > 0) {
      setAuthError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setAuthLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = registerData;
      const response = await apiService.register(registrationData);
      
      if (response.username) {
        // Registration successful
        setAuthError('');
        setShowRegister(false);
        setAuthError('Registration successful! Please login with your credentials.');
        // Clear form
        setRegisterData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          phone: '',
          department: '',
          rank: '',
          station_id: '',
          role: 'officer'
        });
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

    try {
      const response = await apiService.login(loginData);
      
      if (response.access_token) {
        // Login successful
        localStorage.setItem('auth_token', response.access_token);
        setCurrentUser(response.user);
        setIsLoggedIn(true);
        setAuthError('');
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
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginData({ username: '', password: '' });
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
          {authError && (
            <div className={`p-3 rounded-md text-sm ${
              authError.includes('successful') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {authError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="officer@police.gov.in"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
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
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Re-enter password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={registerData.full_name}
                onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Officer Full Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={registerData.phone}
                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+91-9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                value={registerData.department}
                onChange={(e) => setRegisterData({...registerData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tourist Police Department"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rank *</label>
              <select
                value={registerData.rank}
                onChange={(e) => setRegisterData({...registerData, rank: e.target.value})}
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
                value={registerData.station_id}
                onChange={(e) => setRegisterData({...registerData, station_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="TP001 (Tourist Police Station ID)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
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
          {authError && (
            <div className={`p-3 rounded-md text-sm ${
              authError.includes('successful') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {authError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({...prev, username: e.target.value}))}
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
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
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
            onClick={() => setShowRegister(true)}
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
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
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
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Live Tourist Map</h2>
                </div>
                <div className="h-96">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-b-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController center={mapCenter} zoom={13} />
                    
                    {/* Tourist Markers */}
                    {tourists.map((tourist) => (
                      <Marker
                        key={tourist.id}
                        position={tourist.location}
                        icon={createCustomIcon(tourist.status)}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{tourist.name}</h3>
                            <p className="text-sm text-gray-600">Status: {tourist.status}</p>
                            <p className="text-sm text-gray-600">Last Update: {tourist.lastUpdate}</p>
                            <p className="text-sm text-gray-600">Safety Score: {tourist.safetyScore}%</p>
                            <button
                              onClick={() => setSelectedTourist(tourist)}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Geo-fence Circles */}
                    {mockGeoFences.map((fence) => (
                      <Circle
                        key={fence.id}
                        center={fence.center}
                        radius={fence.radius}
                        color={fence.type === 'restricted' ? '#ef4444' : '#22c55e'}
                        fillColor={fence.type === 'restricted' ? '#ef4444' : '#22c55e'}
                        fillOpacity={0.1}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{fence.name}</h3>
                            <p className="text-sm text-gray-600">Type: {fence.type}</p>
                            <p className="text-sm text-gray-600">Radius: {fence.radius}m</p>
                          </div>
                        </Popup>
                      </Circle>
                    ))}
                  </MapContainer>
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
                        placeholder="Search tourists..."
                        value={searchQuery}
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
            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        notification.type === 'emergency' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setShowEFirModal(true)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Generate E-FIR</span>
                </button>
                <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Send Alert</span>
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Tourist Check-in</span>
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register Officer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* E-FIR Modal */}
      {showEFirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-96 overflow-y-auto">
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
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">FIR Details</h3>
                  <p><strong>FIR No:</strong> FIR/2024/TSM/001</p>
                  <p><strong>Date & Time:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Station:</strong> {currentUser?.station_id || 'Tourist Police Station'}</p>
                  <p><strong>Reporting Officer:</strong> {currentUser?.full_name || 'Officer'}</p>
                  <p><strong>Incident Type:</strong> Missing Person / Emergency Alert</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Tourist Information</h3>
                  <p><strong>Name:</strong> Mike Johnson</p>
                  <p><strong>Tourist ID:</strong> TST-2024-001</p>
                  <p><strong>Contact:</strong> +91-9876543212</p>
                  <p><strong>Last Known Location:</strong> 28.6169, 77.2310</p>
                  <p><strong>Emergency Contact:</strong> +1-555-0123 (Family)</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Incident Description</h3>
                  <p>Tourist triggered emergency panic button at {new Date().toLocaleTimeString()} hours. Last GPS location shows tourist in vicinity of restricted zone. No response to automated safety check calls. AI system detected anomalous behavior pattern including sudden location change and prolonged inactivity. Immediate response initiated by system and reported to {currentUser?.full_name || 'duty officer'}.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Actions Taken</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Emergency alert sent to nearest patrol unit</li>
                    <li>Family/emergency contacts notified automatically</li>
                    <li>GPS tracking activated for search operations</li>
                    <li>Tourist safety score updated in system</li>
                    <li>Blockchain record created for incident logging</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    Submit E-FIR
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
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
    </div>
  );
}

export default App;