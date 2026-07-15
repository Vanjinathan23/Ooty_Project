import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Bookmark, 
  Share2, 
  FileText, 
  Lock, 
  Download, 
  Star, 
  Image as ImageIcon, 
  Play, 
  CheckCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  ParkingCircle,
  Droplet,
  Flame,
  Zap,
  Compass,
  Trees,
  Check,
  Send,
  Loader2
} from 'lucide-react';
import { Property, DocumentInfo } from '../types';
import FullScreenGalleryViewer from './FullScreenGalleryViewer';

interface FullPropertyDetailPanelProps {
  property: Property | null;
  onClose: () => void;
  onOpenEnquiry: (propertyName: string) => void;
  isMobile?: boolean;
  user: any;
  savedPropertyIds: string[];
  onToggleSave: (propertyId: string) => void;
  onTriggerAuth: (message: string, pendingAction: any) => void;
}

// Default reviews seeded for each of the 12 properties
const SEED_REVIEWS: Record<string, Array<{ name: string; rating: number; comment: string; date: string }>> = {
  p1: [
    { name: "Rajesh Kumar", rating: 5, comment: "Excellent location near Ooty Lake. Flat terrain and very easy to access. Perfect spot for our dream villa.", date: "2 weeks ago" },
    { name: "Priya Sharma", rating: 4, comment: "Beautiful views in the morning. Quiet neighborhood. Price is reasonable for this prime locality.", date: "1 month ago" }
  ],
  p2: [
    { name: "Amit Patel", rating: 5, comment: "The surroundings of pine and eucalyptus groves are breath-taking. Perfect for boutique resort development.", date: "3 days ago" },
    { name: "Vikram Singh", rating: 4, comment: "Existing structures need some work but the potential is massive. Located in a high-footfall tourist zone.", date: "3 weeks ago" }
  ],
  p3: [
    { name: "Dr. Anjali Rao", rating: 5, comment: "Mature tea bushes and well-maintained plantation. Close to botanical gardens and very accessible.", date: "1 week ago" },
    { name: "Suresh Menon", rating: 4, comment: "Very rich soil. Water stream is a big bonus. Excellent long-term investment opportunity.", date: "1 month ago" }
  ],
  p4: [
    { name: "Karthik J", rating: 5, comment: "The panoramic valley views from Doddabetta peak area are incredible! Very bright and sunny.", date: "5 days ago" },
    { name: "Meera Krishnan", rating: 4, comment: "Elevated location, perfect for holiday homes. Quiet surroundings and clean mountain air.", date: "2 weeks ago" }
  ],
  p5: [
    { name: "Rahul Verma", rating: 5, comment: "Stunning lake views, Pykara is an amazing location. Great layout for cottages.", date: "6 days ago" },
    { name: "Shweta G", rating: 3, comment: "Scenic but a bit far from the main town. Wonderful potential for eco-resort.", date: "1 month ago" }
  ],
  p6: [
    { name: "Sanjay K", rating: 5, comment: "High yield tea plantation with established worker quarters. Avalanche region is gorgeous.", date: "2 weeks ago" },
    { name: "Deepak Roy", rating: 4, comment: "Tranquil environment, perfect weather. Stream running through the property is clean and active.", date: "1 month ago" }
  ],
  p7: [
    { name: "Nidhi Saxena", rating: 4, comment: "Borders the forest, very peaceful and quiet. Emerald Lake is within walking distance.", date: "1 week ago" },
    { name: "Arjun Mehta", rating: 5, comment: "If you want absolute peace, this is it. Clean air and beautiful forest boundary.", date: "1 month ago" }
  ],
  p8: [
    { name: "Vivek Anand", rating: 5, comment: "Golf course proximity is a huge plus. Glenmorgan grasslands are magnificent.", date: "3 days ago" },
    { name: "Divya P", rating: 4, comment: "Spacious meadow views. Ideal for a premium wellness retreat. Highly recommended.", date: "1 month ago" }
  ],
  p9: [
    { name: "Arun Prasath", rating: 4, comment: "Quiet second home spot near Kamaraj Sagar Dam. Surrounded by beautiful shola woods.", date: "2 weeks ago" },
    { name: "Swati Mishra", rating: 5, comment: "Very serene and scenic. Excellent water table and clean surroundings.", date: "3 weeks ago" }
  ],
  p10: [
    { name: "Prakash Nair", rating: 5, comment: "Bordering the Wenlock Downs is a dream. Panoramic views of green rolling hills.", date: "1 week ago" },
    { name: "Pooja Hegde", rating: 4, comment: "Well connected estate road. Healthy tea leaves ready for harvesting.", date: "1 month ago" }
  ],
  p11: [
    { name: "Rohan Das", rating: 5, comment: "Sweeping valley views from Kalhatty. Cooler microclimate than Ooty town.", date: "4 days ago" },
    { name: "Sneha Paul", rating: 4, comment: "Amazing Ghat road access. Hilltop location provides absolute privacy and pristine views.", date: "3 weeks ago" }
  ],
  p12: [
    { name: "Manoj Kumar", rating: 5, comment: "Very close to Sim's Park in Coonoor. Highly coveted central tourist area.", date: "2 weeks ago" },
    { name: "Geetha S", rating: 4, comment: "Plot is clean and ready for construction. Great road access.", date: "1 month ago" }
  ]
};

// Simple helper to match amenities with visual icons
const getAmenityIcon = (amenity: string) => {
  const norm = amenity.toLowerCase();
  if (norm.includes('parking')) return <ParkingCircle className="w-4 h-4 text-emerald-600" />;
  if (norm.includes('water') || norm.includes('stream')) return <Droplet className="w-4 h-4 text-blue-500" />;
  if (norm.includes('power') || norm.includes('electricity') || norm.includes('utility')) return <Zap className="w-4 h-4 text-amber-500" />;
  if (norm.includes('view') || norm.includes('scenic') || norm.includes('panoramic')) return <Compass className="w-4 h-4 text-indigo-500" />;
  if (norm.includes('forest') || norm.includes('terrain') || norm.includes('nature') || norm.includes('garden') || norm.includes('plantation')) return <Trees className="w-4 h-4 text-emerald-700" />;
  return <CheckCircle className="w-4 h-4 text-neutral-500" />;
};

export default function FullPropertyDetailPanel({
  property,
  onClose,
  onOpenEnquiry,
  isMobile = false,
  user,
  savedPropertyIds,
  onToggleSave,
  onTriggerAuth
}: FullPropertyDetailPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'specifications' | 'documents' | 'reviews'>('overview');
  const [showGallery, setShowGallery] = React.useState(false);
  const [openGalleryToVideo, setOpenGalleryToVideo] = React.useState(false);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const [showVideo, setShowVideo] = React.useState(false);
  const [shareCopied, setShareCopied] = React.useState(false);

  // Reviews state with localStorage synchronization
  const [reviews, setReviews] = React.useState<Array<{ name: string; rating: number; comment: string; date: string }>>([]);
  const [reviewName, setReviewName] = React.useState('');
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');

  const isSaved = property ? savedPropertyIds.includes(property.id) : false;

  // Autofill name from profile
  React.useEffect(() => {
    if (user && !reviewName) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setReviewName(name);
    }
  }, [user]);

  // Synchronize reviews on property change
  React.useEffect(() => {
    if (!property) return;

    // Reviews state
    const localKey = `reviews_prop_${property.id}`;
    const storedReviews = localStorage.getItem(localKey);
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    } else {
      const defaultReviews = SEED_REVIEWS[property.id] || [];
      setReviews(defaultReviews);
      localStorage.setItem(localKey, JSON.stringify(defaultReviews));
    }

    // Reset tabs and video overlays
    setActiveTab('overview');
    setShowVideo(false);
    setShowGallery(false);
    setOpenGalleryToVideo(false);
    setGalleryIndex(0);
  }, [property]);

  if (!property) return null;

  // Compute live average rating and count
  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  // Handle Save
  const handleToggleSave = () => {
    if (property) {
      onToggleSave(property.id);
    }
  };

  // Handle Share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?property=${property.id}`;
    if (navigator.share && isMobile) {
      navigator.share({
        title: property.title,
        text: `Check out this premium property in Ooty: ${property.title}`,
        url: shareUrl
      }).catch((err) => console.log('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch((err) => console.error('Copy failed:', err));
    }
  };

  // Handle Review submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    if (!user) {
      if (property) {
        onTriggerAuth("Sign in to leave a review", {
          type: 'review',
          propertyId: property.id,
          reviewData: {
            name: reviewName.trim(),
            rating: reviewRating,
            comment: reviewComment.trim()
          }
        });
      }
      return;
    }

    const newReview = {
      name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: 'Just now'
    };

    const nextReviews = [newReview, ...reviews];
    setReviews(nextReviews);
    localStorage.setItem(`reviews_prop_${property.id}`, JSON.stringify(nextReviews));

    // Clear form
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setReviewName(name);
    } else {
      setReviewName('');
    }
    setReviewRating(5);
    setReviewComment('');
  };

  // Format currency with Indian style (₹85,00,000)
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Category visual labels
  const getCategoryDetails = (type: string) => {
    switch (type) {
      case 'land':
        return {
          label: 'Land Plot',
          color: '#8C6239',
          bgLight: 'bg-amber-50',
          borderLight: 'border-amber-200/50',
          textClass: 'text-amber-800'
        };
      case 'resort':
        return {
          label: 'Hospitality Resort',
          color: '#C97B4A',
          bgLight: 'bg-orange-50',
          borderLight: 'border-orange-200/50',
          textClass: 'text-brand-terracotta'
        };
      case 'tea_estate':
        return {
          label: 'Tea Garden Estate',
          color: '#2D5A3D',
          bgLight: 'bg-emerald-50',
          borderLight: 'border-emerald-200/50',
          textClass: 'text-emerald-800'
        };
      default:
        return {
          label: 'Property',
          color: '#222222',
          bgLight: 'bg-neutral-50',
          borderLight: 'border-neutral-200',
          textClass: 'text-neutral-800'
        };
    }
  };

  const cat = getCategoryDetails(property.type);

  // Specifications
  const areaLabel = property.type === 'land' || property.type === 'tea_estate'
    ? `${property.plotAreaSqft?.toLocaleString('en-IN')} sq.ft.`
    : `${property.builtUpAreaSqft?.toLocaleString('en-IN')} sq.ft.`;

  const specRows = [
    { label: 'Property Type', value: property.type === 'tea_estate' ? 'Tea Estate' : property.type === 'resort' ? 'Hospitality Resort' : 'Land Plot' },
    { label: 'Area Structure', value: areaLabel },
    { label: 'Regional Locality', value: property.locality },
    { label: 'Distance from Town Center', value: `${property.distanceFromTownKm} km from town` },
    { label: 'Current Status', value: property.status === 'available' ? 'Available' : property.status === 'sold' ? 'Sold' : 'Booked' }
  ];

  // Images list (ensure there are multiple fallback images for gallery)
  const imagesList = [...property.images];
  while (imagesList.length < 3) {
    const nextIdx = imagesList.length + 1;
    imagesList.push(`https://picsum.photos/800/600?random=${property.id}_${nextIdx}`);
  }

  // Handle gallery buttons
  const prevGalleryImage = () => {
    setGalleryIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };
  const nextGalleryImage = () => {
    setGalleryIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  // Video fallback source - relaxing forest stream
  const videoSourceUrl = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4";

  return (
    <>
      <AnimatePresence>
        {/* Backdrop for Desktop/Mobile (to dim the main screen) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/20 md:bg-transparent md:pointer-events-none z-40"
          id="detail-panel-backdrop"
        />

        {/* Sliding Main Panel */}
        <motion.div
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`fixed z-50 bg-white shadow-2xl flex flex-col font-sans overflow-hidden border-gray-100 ${
            isMobile 
              ? 'bottom-0 left-0 right-0 h-[88vh] rounded-t-3xl border-t' 
              : 'top-4 bottom-4 right-4 w-[55vw] lg:w-[450px] rounded-2xl border'
          }`}
          id="full-property-detail-panel"
        >
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pb-[80px] no-scrollbar">
            
            {/* 1. PHOTO HEADER SECTION */}
            <div className="relative w-full h-[220px] sm:h-[260px] bg-neutral-100 shrink-0 select-none overflow-hidden">
              <motion.img
                layoutId="property-hero-image"
                src={property.images[0]}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] hover:brightness-95 transition-all duration-300"
                id="panel-hero-image"
                onClick={() => {
                  setOpenGalleryToVideo(false);
                  setShowGallery(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

              {/* Close Button OVER photo */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-black border border-neutral-200/50 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer focus:outline-none"
                title="Close panel"
                id="btn-close-detail-panel"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photos Gallery and Video Pills */}
              <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                <button
                  onClick={() => {
                    setOpenGalleryToVideo(false);
                    setShowGallery(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md hover:bg-black/80 active:scale-95 transition-all flex items-center space-x-1.5 shadow-md border border-white/10 cursor-pointer"
                  id="btn-panel-see-photos"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>See all photos</span>
                </button>

                {property.videoUrl && (
                  <button
                    onClick={() => {
                      setOpenGalleryToVideo(true);
                      setShowGallery(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-md hover:bg-emerald-600 active:scale-95 transition-all flex items-center space-x-1.5 shadow-md border border-emerald-500/10 cursor-pointer"
                    id="btn-panel-watch-video"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch video</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. TITLE BLOCK */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100" id="panel-title-block">
              <div className="space-y-1.5">
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-brand-charcoal tracking-tight leading-tight">
                  {property.title}
                </h2>
                
                <div className="text-xs text-neutral-400 font-bold uppercase tracking-wide">
                  {cat.label} • {property.locality}
                </div>

                {/* Rating Row formatted like Google Reviews */}
                {reviews.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm font-semibold pt-0.5">
                    <span className="text-amber-500">{averageRating}</span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(averageRating) ? 'fill-current' : 'text-neutral-200'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-neutral-400 font-medium">({reviews.length})</span>
                  </div>
                )}

                {/* Price and status row */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xl font-display font-black text-brand-green tracking-tight">
                    {formatINR(property.price)}
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.bgLight} ${cat.borderLight} ${cat.textClass}`}>
                    {property.status === 'available' ? 'Available now' : property.status === 'sold' ? 'Sold' : 'Booked'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ACTION ICON ROW */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-around items-center select-none" id="panel-actions-row">
              {/* Directions */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center space-y-1 group focus:outline-none"
                id="btn-panel-action-directions"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-brand-green border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer">
                  <Navigation className="w-5 h-5 fill-current rotate-45 translate-x-[0.5px] -translate-y-[0.5px]" />
                </div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider group-hover:text-brand-green transition-colors">Directions</span>
              </a>

              {/* Save */}
              <button
                onClick={handleToggleSave}
                className="flex flex-col items-center space-y-1 group focus:outline-none cursor-pointer"
                id="btn-panel-action-save"
              >
                <div className={`w-11 h-11 rounded-full border active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                  isSaved 
                    ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100' 
                    : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:bg-neutral-100'
                }`}>
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider group-hover:text-neutral-800 transition-colors">
                  {isSaved ? 'Saved' : 'Save'}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center space-y-1 group focus:outline-none cursor-pointer"
                id="btn-panel-action-share"
              >
                <div className={`w-11 h-11 rounded-full border active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                  shareCopied 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:bg-neutral-100'
                }`}>
                  {shareCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider group-hover:text-neutral-800 transition-colors">
                  {shareCopied ? 'Copied' : 'Share'}
                </span>
              </button>
            </div>

            {/* 4. TABBED CONTENT SECTION */}
            <div className="w-full">
              {/* Tab headers */}
              <div className="flex space-x-6 border-b border-gray-200 px-6 overflow-x-auto no-scrollbar" id="panel-tabs-bar">
                {(['overview', 'specifications', 'documents', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-xs font-semibold tracking-wider uppercase border-b-2 -mb-px relative z-10 transition-all cursor-pointer focus:outline-none whitespace-nowrap shrink-0 ${
                      activeTab === tab
                        ? 'border-brand-green text-brand-green font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-300'
                    }`}
                    id={`btn-tab-${tab}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div className="p-6">
                
                {/* TAB: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn" id="tab-panel-overview">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Description</h4>
                      <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                        {property.description}
                      </p>
                    </div>

                    {/* Amenities Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Features & Amenities</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {property.amenities.map((amenity, idx) => (
                          <div 
                            key={`amenity-${property.id}-${amenity}-${idx}`}
                            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200/40 text-neutral-700 text-xs font-semibold"
                          >
                            {getAmenityIcon(amenity)}
                            <span className="truncate">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini Map Snippet (Static confirmation vector) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Plot Location Index</h4>
                      <div className="relative h-[150px] rounded-2xl border border-gray-150 bg-sky-50/40 overflow-hidden flex flex-col items-center justify-center select-none shadow-xs">
                        {/* Styled Compass Grid Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                        
                        {/* Graphic elements representing local zoning roads */}
                        <svg className="absolute inset-0 w-full h-full text-emerald-100/30 fill-none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M-20,50 Q150,70 500,60" stroke="#f0fdf4" strokeWidth="12" />
                          <path d="M100,-20 L150,200" stroke="#f0fdf4" strokeWidth="8" />
                          <path d="M280,-20 C320,80 220,130 310,200" stroke="#f5f5f4" strokeWidth="6" />
                          <circle cx="200" cy="75" r="50" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="4" />
                        </svg>

                        {/* Interactive or animated pin center element */}
                        <div className="relative flex flex-col items-center">
                          <div className="absolute w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 animate-ping scale-110" />
                          <div className={`w-9 h-9 rounded-full rounded-br-none rotate-45 overflow-hidden flex items-center justify-center shadow-md bg-white border-2 border-emerald-600 z-10`}>
                            <MapPin className="-rotate-45 w-4 h-4 text-emerald-700 fill-current" />
                          </div>
                        </div>

                        {/* Technical coordinates and prompt */}
                        <div className="absolute bottom-2.5 left-3 bg-white/95 border border-gray-200/50 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] font-mono text-neutral-500 flex flex-col z-10 leading-none shadow-xs">
                          <span className="font-semibold text-neutral-800">LAT: {property.latitude.toFixed(5)}</span>
                          <span className="mt-0.5">LNG: {property.longitude.toFixed(5)}</span>
                        </div>

                        <div className="absolute top-2.5 right-3 bg-neutral-900/80 text-white text-[8px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-md select-none">
                          Interactive map on left
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Specifications */}
                {activeTab === 'specifications' && (
                  <div className="space-y-4 animate-fadeIn" id="tab-panel-specifications">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Technical Registry</h4>
                    <div className="divide-y divide-gray-100 border border-neutral-100 rounded-2xl overflow-hidden shadow-xs">
                      {specRows.map((row, idx) => (
                        <div key={`spec-${property.id}-${row.label}-${idx}`} className="flex justify-between items-center py-3 px-4 bg-white hover:bg-neutral-50/50 transition-colors">
                          <span className="text-xs text-neutral-400 font-semibold">{row.label}</span>
                          <span className="text-xs text-neutral-800 font-bold">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: Documents */}
                {activeTab === 'documents' && (
                  <div className="space-y-4 animate-fadeIn" id="tab-panel-documents">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Verified Documents</h4>
                    {property.documents && property.documents.length > 0 ? (
                      <div className="space-y-2.5">
                        {property.documents.map((doc, idx) => (
                          <div 
                            key={`doc-${property.id}-${doc.name}-${idx}`}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              doc.isPublic 
                                ? 'bg-white border-gray-150 hover:shadow-md' 
                                : 'bg-neutral-50/60 border-neutral-200/55'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`p-2 rounded-xl ${doc.isPublic ? 'bg-emerald-50 text-brand-green' : 'bg-neutral-100 text-neutral-400'}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <span className={`text-xs font-bold truncate ${doc.isPublic ? 'text-neutral-800' : 'text-neutral-400 line-through'}`}>
                                  {doc.name}
                                </span>
                                {!doc.isPublic && (
                                  <span className="text-[10px] text-neutral-400 font-medium">
                                    Enquiry required for access
                                  </span>
                                )}
                              </div>
                            </div>

                            {doc.isPublic ? (
                              <button
                                onClick={() => {
                                  alert(`Mock download initiated for ${doc.name}. In production, this pulls securely from storage.`);
                                }}
                                className="w-8 h-8 rounded-full bg-emerald-50 text-brand-green hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center border border-emerald-100 cursor-pointer focus:outline-none"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center border border-neutral-200/40">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-neutral-400 select-none bg-neutral-50 rounded-2xl border border-dashed border-gray-200">
                        <FileText className="w-7 h-7 mx-auto mb-2 text-neutral-300" />
                        <p className="text-xs font-semibold">No documents uploaded yet for this property</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Reviews */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6 animate-fadeIn" id="tab-panel-reviews">
                    {/* Rating summary layout like Google Maps reviews */}
                    <div className="flex items-center space-x-5 bg-neutral-50 p-4 rounded-2xl border border-neutral-100" id="reviews-summary-card">
                      <div className="text-center flex flex-col items-center shrink-0 pr-4 border-r border-neutral-200">
                        <span className="text-3xl font-display font-black text-brand-charcoal">{averageRating || 'N/A'}</span>
                        <div className="flex text-amber-500 my-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(averageRating) ? 'fill-current' : 'text-neutral-200'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold">{reviews.length} reviews</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviews.filter((r) => r.rating === stars).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center text-[10px] font-bold text-neutral-500">
                              <span className="w-3 shrink-0">{stars}</span>
                              <div className="flex-1 h-1.5 bg-neutral-200 rounded-full mx-2 overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-4 text-right shrink-0">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scrollable list of reviews */}
                    <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar pr-1 divide-y divide-gray-100" id="reviews-list-container">
                      {reviews.map((r, idx) => (
                        <div key={`review-${property.id}-${r.name}-${r.date}-${idx}`} className={`pt-3 ${idx === 0 ? 'pt-0' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-neutral-800">{r.name}</h5>
                              <div className="flex text-amber-500 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-2.5 h-2.5 ${
                                      i < r.rating ? 'fill-current' : 'text-neutral-200'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] text-neutral-400 font-bold">{r.date}</span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1.5 font-sans leading-relaxed">
                            {r.comment}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Inline write a review form */}
                    <div className="pt-4 border-t border-gray-100 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200/30" id="write-review-form-container">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                        Write a review
                      </h4>
                      <form 
                        onSubmit={handleReviewSubmit} 
                        className="space-y-3"
                        onClick={(e) => {
                          if (!user) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (property) {
                              onTriggerAuth("Sign in to leave a review", {
                                type: 'review',
                                propertyId: property.id,
                                reviewData: {
                                  name: reviewName,
                                  rating: reviewRating,
                                  comment: reviewComment
                                }
                              });
                            }
                          }
                        }}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          {/* Name input */}
                          <input
                            type="text"
                            required
                            placeholder="Your full name"
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green font-sans"
                          />

                          {/* Star selector */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-neutral-500 font-semibold select-none">Rating:</span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="text-amber-500 focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star className={`w-4 h-4 ${star <= reviewRating ? 'fill-current' : 'text-neutral-200'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Comment box */}
                          <textarea
                            required
                            placeholder="Share your experience regarding this plantation/estate..."
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green font-sans resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit review</span>
                        </button>
                      </form>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>

          {/* 5. STICKY BOTTOM ENQUIRE CTA BAR */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[76px] bg-white border-t border-gray-150 px-6 py-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
            id="panel-sticky-cta"
          >
            <div className="flex flex-col min-w-0 pr-3">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Interested?</span>
              <span className="text-xs font-bold text-neutral-800 truncate leading-tight">
                {property.title}
              </span>
            </div>
            <button
              onClick={() => onOpenEnquiry(property.title)}
              className="px-6 py-3.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl text-xs font-display font-extrabold shadow-lg shadow-brand-green/20 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none shrink-0"
              id="btn-panel-sticky-enquire"
            >
              <span>Enquire Now</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* FULL-SCREEN GALLERY & VIDEO VIEWER OVERLAY */}
      <FullScreenGalleryViewer
        property={property}
        isOpen={showGallery}
        openToVideo={openGalleryToVideo}
        onBack={() => setShowGallery(false)}
        onClose={() => setShowGallery(false)}
        isMobile={isMobile}
      />
    </>
  );
}
