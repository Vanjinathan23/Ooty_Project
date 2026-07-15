import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import MapContainer from './components/MapContainer';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import InfoTooltip from './components/InfoTooltip';
import MapControls from './components/MapControls';
import FilterRow from './components/FilterRow';
import PropertyPreviewCard from './components/PropertyPreviewCard';
import FullPropertyDetailPanel from './components/FullPropertyDetailPanel';
import EnquiryModal from './components/EnquiryModal';

// Supabase and Authentication components
import { supabase } from './supabase';
import AuthModal from './components/AuthModal';
import SavedPropertiesList from './components/SavedPropertiesList';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { Loader2 } from 'lucide-react';

import { MapStyleId, Property, PropertyType } from './types';
import mockProperties from './ooty-mock-properties.json';

export default function App() {
  // Navigation drawer and settings state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showBoundary, setShowBoundary] = React.useState(true);
  const [showSpotlight, setShowSpotlight] = React.useState(true);
  const [activeStyle, setActiveStyle] = React.useState<MapStyleId>('standard');
  const [mapInstance, setMapInstance] = React.useState<any>(null);
  const [showReturnToOoty, setShowReturnToOoty] = React.useState(false);

  // Responsive mobile state tracking
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth state
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [savedPropertyIds, setSavedPropertyIds] = React.useState<string[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);

  // Modal / overlay states
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalMessage, setAuthModalMessage] = React.useState('');
  const [savedPropertiesOpen, setSavedPropertiesOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{
    type: 'save' | 'review';
    propertyId: string;
    reviewData?: { name: string; rating: number; comment: string };
  } | null>(null);

  // Router path state
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  // Route navigation helper
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Auth sessions
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndMigrate(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfileAndMigrate(currentUser);
      } else {
        setProfile(null);
        setSavedPropertyIds([]);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSavedProperties = async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_properties')
      .select('property_id')
      .eq('user_id', userId);

    if (!error && data) {
      setSavedPropertyIds(data.map(d => d.property_id));
    }
  };

  const fetchProfileAndMigrate = async (authUser: any) => {
    try {
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile creation is now handled by the database trigger.
        // Wait a brief moment and retry fetching in case the trigger transaction is slightly delayed.
        await new Promise(resolve => setTimeout(resolve, 500));
        const retry = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (retry.error) throw retry.error;
        profileData = retry.data;
      } else if (error) {
        throw error;
      }

      setProfile(profileData);

      // Auto-redirect admins to the dashboard if they log in from the main map page
      if (profileData?.role === 'admin' && window.location.pathname === '/') {
        navigateTo('/admin');
      }

      // Perform local storage saved properties migration
      const localKeys = Object.keys(localStorage);
      const savedIdsToMigrate: string[] = [];

      localKeys.forEach(key => {
        const match = key.match(/^saved_prop_(.+)$/);
        if (match && localStorage.getItem(key) === 'true') {
          savedIdsToMigrate.push(match[1]);
        }
      });

      if (savedIdsToMigrate.length > 0) {
        const rows = savedIdsToMigrate.map(propId => ({
          user_id: authUser.id,
          property_id: propId
        }));

        const { error: batchInsertErr } = await supabase
          .from('saved_properties')
          .insert(rows);

        if (!batchInsertErr || batchInsertErr.code === '23505') { 
          savedIdsToMigrate.forEach(propId => {
            localStorage.removeItem(`saved_prop_${propId}`);
          });
        }
      }

      await refreshSavedProperties(authUser.id);
    } catch (err: any) {
      console.error('Error fetching/migrating profile:', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sync pending action to sessionStorage
  React.useEffect(() => {
    if (pendingAction) {
      sessionStorage.setItem('pending_auth_action', JSON.stringify(pendingAction));
    } else {
      sessionStorage.removeItem('pending_auth_action');
    }
  }, [pendingAction]);

  // Execute pending action after login completes
  React.useEffect(() => {
    if (user && !authLoading) {
      const stored = sessionStorage.getItem('pending_auth_action');
      if (stored) {
        try {
          const action = JSON.parse(stored);
          sessionStorage.removeItem('pending_auth_action');
          
          if (action.type === 'save') {
            supabase.from('saved_properties')
              .insert({ user_id: user.id, property_id: action.propertyId })
              .then(({ error }) => {
                if (!error) {
                  setSavedPropertyIds(prev => {
                    if (!prev.includes(action.propertyId)) {
                      return [...prev, action.propertyId];
                    }
                    return prev;
                  });
                }
              });
          } else if (action.type === 'review' && action.reviewData) {
            const localKey = `reviews_prop_${action.propertyId}`;
            const storedReviews = localStorage.getItem(localKey);
            const reviews = storedReviews ? JSON.parse(storedReviews) : [];
            const newReview = {
              name: action.reviewData.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              rating: action.reviewData.rating,
              comment: action.reviewData.comment,
              date: 'Just now'
            };
            localStorage.setItem(localKey, JSON.stringify([newReview, ...reviews]));
            if (fullDetailProperty && fullDetailProperty.id === action.propertyId) {
              setFullDetailProperty(prev => prev ? { ...prev } : null);
            }
          }
        } catch (e) {
          console.error('Error executing pending action:', e);
        }
      }
    }
  }, [user, authLoading]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter state & currently selected property
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | PropertyType>('all');
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const [fullDetailProperty, setFullDetailProperty] = React.useState<Property | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = React.useState(false);
  const [enquiryPropertyName, setEnquiryPropertyName] = React.useState('');

  // Hovered state from search results list to Map pin sync
  const [hoveredPropertyId, setHoveredPropertyId] = React.useState<string | null>(null);

  // Properties state — loads live from Supabase, falls back to mock JSON on error/empty
  const [liveProperties, setLiveProperties] = React.useState<Property[]>([]);

  // Extracted mapping function so it can be reused by Realtime handlers
  const mapPropertyRow = React.useCallback((row: any): Property | null => {
    try {
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description ?? '',
        price: row.price ?? 0,
        locality: row.locality ?? '',
        latitude: Number(row.latitude) || 0,
        longitude: Number(row.longitude) || 0,
        plotAreaSqft: row.plot_area_sqft ?? undefined,
        builtUpAreaSqft: row.built_up_area_sqft ?? undefined,
        bhk: row.bhk ?? undefined,
        floorNumber: row.floor_number ?? undefined,
        amenities: row.amenities ?? [],
        images: row.images ?? [],
        documents: row.documents ?? [],
        status: row.status ?? 'available',
        is_published: row.is_published ?? false,
        distanceFromTownKm: row.distance_from_town_km ?? 0,
        pinCategory: row.pin_category ?? row.type,
        pinIcon: row.pin_icon ?? 'map-pin-land',
        videoUrl: row.video_url ?? undefined,
      };
    } catch (err) {
      console.error('Error mapping property', row.id, err);
      return null;
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let isInitialSubscribe = true;

    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true);
        
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        const mapped: Property[] = [];
        data.forEach((row: any) => {
          const prop = mapPropertyRow(row);
          if (prop) mapped.push(prop);
        });
        console.log(`Fetched ${data.length} properties, successfully mapped ${mapped.length}`);
        setLiveProperties(mapped);
      }
    };

    // Initial fetch
    fetchProperties();

    // Set up Realtime subscription
    const channel = supabase
      .channel('public:properties')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          setLiveProperties((prev) => {
            const { eventType, new: newRow, old: oldRow } = payload;
            
            if (eventType === 'INSERT') {
              if (newRow.is_published) {
                const newProp = mapPropertyRow(newRow);
                if (newProp) {
                  return [...prev, newProp];
                }
              }
            } else if (eventType === 'UPDATE') {
              const newProp = mapPropertyRow(newRow);
              if (!newProp) return prev;
              
              const exists = prev.some((p) => p.id === newProp.id);
              
              if (newProp.is_published) {
                if (exists) {
                  return prev.map((p) => (p.id === newProp.id ? newProp : p));
                } else {
                  return [...prev, newProp];
                }
              } else {
                return prev.filter((p) => p.id !== newProp.id);
              }
            } else if (eventType === 'DELETE') {
              return prev.filter((p) => p.id !== oldRow.id);
            }
            return prev;
          });
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to properties real-time updates');
          if (!isInitialSubscribe) {
            console.log('Reconnected to real-time channel. Refetching properties to sync state...');
            await fetchProperties();
          }
          isInitialSubscribe = false;
        } else if (status === 'CLOSED') {
          console.log('Unsubscribed from properties real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error with properties real-time channel');
        }
      });

    return () => { 
      cancelled = true; 
      supabase.removeChannel(channel);
    };
  }, [mapPropertyRow]);

  // Compute active properties reactively based on filter category
  const filteredProperties = React.useMemo(() => {
    if (selectedCategory === 'all') return liveProperties;
    return liveProperties.filter((p) => p.type === selectedCategory);
  }, [selectedCategory, liveProperties]);

  // Handle individual pin selection (centering + offsetting camera)
  const handlePinClick = (property: Property | null) => {
    setSelectedProperty(property);
    if (!property || !mapInstance) return;

    const isMobile = window.innerWidth < 768;
    const offsetLat = isMobile ? -0.005 : 0;
    const offsetLng = isMobile ? 0 : 0.006;

    const currentZoom = mapInstance.getZoom();
    const targetZoom = Math.max(currentZoom, 12.8);

    mapInstance.flyTo({
      center: [property.longitude + offsetLng, property.latitude + offsetLat],
      zoom: targetZoom,
      duration: 1000,
      essential: true
    });
  };

  // Handle pin selection from search dropdown (resets category filter first, opens full detail, flies to pin)
  const handleSelectPropertyFromSearch = (property: Property | null) => {
    if (property) {
      setSelectedCategory('all');
      setFullDetailProperty(property);
      setSelectedProperty(null); // Ensure small card is closed

      if (mapInstance) {
        const isMobile = window.innerWidth < 768;
        const offsetLat = isMobile ? -0.005 : 0;
        const offsetLng = isMobile ? 0 : 0.006;
        const currentZoom = mapInstance.getZoom();
        const targetZoom = Math.max(currentZoom, 12.8);

        mapInstance.flyTo({
          center: [property.longitude + offsetLng, property.latitude + offsetLat],
          zoom: targetZoom,
          duration: 1000,
          essential: true
        });
      }
    }
  };

  // Close preview card completely
  const handleClosePreview = () => {
    setSelectedProperty(null);
  };

  // Smooth ease-in-out flight to default Ooty view
  const handleReturnToOoty = () => {
    if (!mapInstance) return;
    mapInstance.flyTo({
      center: [76.6907, 11.4111],
      zoom: 11.2,
      pitch: 0,
      bearing: 0,
      duration: 1200,
      essential: true,
      easing: (t: number) => t * (2 - t) // Smooth cubic bezier easing
    });
  };

  const handleToggleSave = async (propertyId: string) => {
    if (!user) {
      setAuthModalMessage("Sign in to save this property");
      setPendingAction({ type: 'save', propertyId });
      setAuthModalOpen(true);
      return;
    }

    const isSaved = savedPropertyIds.includes(propertyId);
    
    // Optimistic UI Update
    if (isSaved) {
      setSavedPropertyIds(prev => prev.filter(id => id !== propertyId));
      
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
        
      if (error) {
        // Rollback on failure
        console.error("Failed to unsave property:", error);
        setSavedPropertyIds(prev => [...prev, propertyId]);
      }
    } else {
      setSavedPropertyIds(prev => [...prev, propertyId]);
      
      const { error } = await supabase
        .from('saved_properties')
        .insert({ user_id: user.id, property_id: propertyId });
        
      if (error) {
        // Rollback on failure
        console.error("Failed to save property:", error);
        setSavedPropertyIds(prev => prev.filter(id => id !== propertyId));
      }
    }
  };

  // --- ROUTER CONDITIONAL RENDERS ---
  if (currentPath === '/admin/login') {
    return (
      <AdminLogin 
        onLoginSuccess={(session, role) => {
          setUser(session.user);
          setProfile({ id: session.user.id, email: session.user.email, role });
        }}
        currentPath={currentPath}
        setNavigation={navigateTo}
      />
    );
  }

  if (currentPath.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-neutral-950 text-white font-sans">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400 font-semibold">Verifying administrative access...</span>
          </div>
        </div>
      );
    }

    if (!user || profile?.role !== 'admin') {
      // Redirect immediately — no hook needed inside a conditional
      navigateTo('/admin/login');
      return null;
    }

    return (
      <AdminDashboard 
        onSignOut={() => {
          setUser(null);
          setProfile(null);
        }}
        setNavigation={navigateTo}
      />
    );
  }

  return (
    <main 
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none"
      id="app-main-root"
    >
      {/* Absolute Layer 0: Map Container */}
      <MapContainer
        showBoundary={showBoundary}
        showSpotlight={showSpotlight}
        activeStyle={activeStyle}
        setMapInstance={setMapInstance}
        onViewStateChange={setShowReturnToOoty}
        properties={filteredProperties}
        onPinClick={handlePinClick}
        selectedPropertyId={selectedProperty ? selectedProperty.id : null}
        hoveredPropertyId={hoveredPropertyId}
        savedPropertyIds={savedPropertyIds}
        onToggleSave={handleToggleSave}
        onViewFullDetails={(property) => {
          setFullDetailProperty(property);
          setSelectedProperty(null);
        }}
      />

      {/* Absolute Layer 1: Fixed Floating UI Controls Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between"
        id="floating-ui-layer"
      >
        {/* Auth / Profile Button (Top Right) */}
        <div 
          className={`absolute top-4 sm:top-6 z-50 pointer-events-auto transition-all duration-300 ${
            !isMobile && fullDetailProperty 
              ? 'right-[490px] md:right-[520px]' 
              : 'right-4 sm:right-6'
          }`}
        >
          {authLoading ? (
            <div className="h-10 px-4 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center">
              <Loader2 className="w-4.5 h-4.5 text-brand-green animate-spin" />
            </div>
          ) : user ? (
            <div className="relative" id="user-profile-menu">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="h-10 pl-4 pr-1.5 rounded-full bg-white border border-gray-100 shadow-md flex items-center space-x-2 overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none group"
                title={user.email}
              >
                <span className="text-sm font-bold text-brand-charcoal max-w-[100px] sm:max-w-[150px] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center overflow-hidden shrink-0 border border-brand-green/20 group-hover:border-brand-green/40 transition-colors">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-brand-green font-display">
                      {user.email?.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {isUserDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-neutral-100 p-2 z-50 flex flex-col font-sans animate-scaleUp">
                    <div className="px-3 py-2 border-b border-neutral-50 mb-1.5 select-none">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Signed In As</p>
                      <p className="text-[11px] font-semibold text-brand-charcoal truncate mt-0.5">{user.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setSavedPropertiesOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-brand-charcoal hover:bg-neutral-50 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-brand-green fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span>My Saved Properties</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalMessage("Sign in to sync your saves and write reviews");
                setPendingAction(null);
                setAuthModalOpen(true);
              }}
              className="h-10 px-4 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center space-x-2 hover:scale-105 active:scale-95 transition-all text-brand-green cursor-pointer focus:outline-none shadow-brand-green/5"
              title="Sign In"
            >
              <span className="text-sm font-bold">Sign In</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {/* Top Section: Search, Category Filters, and Info Tooltips */}
        <div className="flex flex-col space-y-3.5 items-start w-full" id="top-floating-section">
          
          {/* Search Bar Area */}
          <div className="flex items-center space-x-3 w-full max-w-md pointer-events-auto">
            <SearchBar 
              onOpenSidebar={() => setIsSidebarOpen(true)} 
              className="shadow-xl flex-1"
              properties={liveProperties}
              onSelectProperty={handleSelectPropertyFromSearch}
              onHoverProperty={setHoveredPropertyId}
              mapInstance={mapInstance}
            />
          </div>

          {/* Pill Category Selector Filters */}
          <FilterRow
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            className="pointer-events-auto"
          />

          {/* Dismissible Info Tooltip (Regional limits) */}
          <InfoTooltip className="pointer-events-auto" />
        </div>

        {/* Bottom Section (Managed fully within MapControls) */}
      </div>

      {/* Slide-out Preview Property Card overlay - only visible on mobile */}
      {isMobile && selectedProperty && (
        <PropertyPreviewCard
          property={selectedProperty}
          onClose={handleClosePreview}
          onViewDetails={(id) => {
            setFullDetailProperty(selectedProperty);
            setSelectedProperty(null);
          }}
          isMobile={true}
          savedPropertyIds={savedPropertyIds}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* Full Property Detail Panel */}
      {fullDetailProperty && (
        <FullPropertyDetailPanel
          property={fullDetailProperty}
          onClose={() => setFullDetailProperty(null)}
          onOpenEnquiry={(propertyName) => {
            setEnquiryPropertyName(propertyName);
            setIsEnquiryOpen(true);
          }}
          isMobile={isMobile}
          user={user}
          savedPropertyIds={savedPropertyIds}
          onToggleSave={handleToggleSave}
          onTriggerAuth={(message, action) => {
            setAuthModalMessage(message);
            setPendingAction(action);
            setAuthModalOpen(true);
          }}
        />
      )}

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        propertyName={enquiryPropertyName}
      />

      {/* Floating Controls Overlay (Location, Zoom, Styles, Compass, Toast) */}
      <MapControls
        map={mapInstance}
        activeStyle={activeStyle}
        setActiveStyle={setActiveStyle}
        showReturnToOoty={showReturnToOoty}
        onReturnToOoty={handleReturnToOoty}
      />

      {/* Left Drawer Slide-out Sidebar Panel */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        showBoundary={showBoundary}
        setShowBoundary={setShowBoundary}
        showSpotlight={showSpotlight}
        setShowSpotlight={setShowSpotlight}
        activeStyle={activeStyle}
        setActiveStyle={setActiveStyle}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message={authModalMessage}
      />

      {/* Saved Properties Drawer */}
      <SavedPropertiesList
        isOpen={savedPropertiesOpen}
        onClose={() => setSavedPropertiesOpen(false)}
        savedPropertyIds={savedPropertyIds}
        properties={liveProperties.length > 0 ? liveProperties : (mockProperties as Property[])}
        onSelectProperty={(p) => {
          // Find in liveProperties first, then fall back to the passed property
          const found = liveProperties.find(lp => lp.id === p?.id);
          handleSelectPropertyFromSearch(found || p);
        }}
        onToggleSave={handleToggleSave}
      />

      {/* Professional Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center animate-scaleUp">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-brand-charcoal mb-2">Sign Out</h3>
            <p className="text-sm text-neutral-500 text-center mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex space-x-3 w-full">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await supabase.auth.signOut();
                  setUser(null);
                  setProfile(null);
                  setSavedPropertyIds([]);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
