import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Map, 
  Eye, 
  Layers, 
  Compass, 
  Phone, 
  Compass as CompassIcon,
  Home, 
  Trees, 
  ShieldCheck, 
  HelpCircle,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { MapStyleId } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Map settings
  showBoundary: boolean;
  setShowBoundary: (val: boolean) => void;
  showSpotlight: boolean;
  setShowSpotlight: (val: boolean) => void;
  activeStyle: MapStyleId;
  setActiveStyle: (val: MapStyleId) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  showBoundary,
  setShowBoundary,
  showSpotlight,
  setShowSpotlight,
  activeStyle,
  setActiveStyle
}: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 md:bg-transparent md:pointer-events-none z-50"
            id="sidebar-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 bottom-0 left-0 w-full sm:w-11/12 md:w-2/3 lg:w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden font-sans border-r border-gray-100"
            id="sidebar-drawer"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-green/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center shadow-md shadow-brand-green/20">
                  <Trees className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-brand-charcoal tracking-tight leading-tight">
                    Ooty Estates
                  </h2>
                  <p className="text-xs text-brand-green font-medium tracking-wide">
                    MAP FOUNDATION v1.0
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-brand-charcoal hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
                aria-label="Close menu"
                id="btn-sidebar-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-6 px-6 space-y-7 scrollbar-thin">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  About the Platform
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">
                  This map foundation is designed exclusively for premium property search, zoning analysis, and administrative plotting across Udhagamandalam (Ooty) Taluk.
                </p>
              </div>

              {/* Map Preferences / Interactive Controls */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                  Map Layer Settings
                </h3>

                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {/* Toggle Boundary */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-sm font-semibold text-brand-charcoal">
                        Ooty Taluk Boundary
                      </span>
                      <span className="text-xs text-gray-500">
                        Red-white dashed administrative perimeter
                      </span>
                    </div>
                    <button
                      onClick={() => setShowBoundary(!showBoundary)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showBoundary ? 'bg-brand-green' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={showBoundary}
                      id="toggle-boundary-layer"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showBoundary ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="h-[1px] bg-gray-200 my-1" />

                  {/* Toggle Spotlight Overlay */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-sm font-semibold text-brand-charcoal">
                        Spotlight Overlay
                      </span>
                      <span className="text-xs text-gray-500">
                        Dim territories outside coverage bounds
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSpotlight(!showSpotlight)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showSpotlight ? 'bg-brand-green' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={showSpotlight}
                      id="toggle-spotlight-layer"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showSpotlight ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Real Estate Services (Placeholders) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Browse Properties (Module Stubs)
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-not-allowed group">
                    <div className="p-2 bg-brand-green/10 rounded-lg group-hover:bg-brand-green/20 transition-colors">
                      <Home className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-charcoal">Residential Estates</h4>
                      <p className="text-xs text-gray-400">Villas, cottages & bungalows</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-not-allowed group">
                    <div className="p-2 bg-brand-green/10 rounded-lg group-hover:bg-brand-green/20 transition-colors">
                      <Building2 className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-charcoal">Commercial Lots</h4>
                      <p className="text-xs text-gray-400">Hotels, homestays & spaces</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-not-allowed group">
                    <div className="p-2 bg-brand-green/10 rounded-lg group-hover:bg-brand-green/20 transition-colors">
                      <Trees className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-charcoal">Agricultural Lands</h4>
                      <p className="text-xs text-gray-400">Tea plantations & farming plots</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Resources / Local Regulations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Nilgiris District Zoning
                </h3>
                <div className="space-y-2 text-xs text-gray-600 bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Eco-Sensitive Regulations:</strong> The Nilgiris District operates under strict zoning laws protecting forest cover and tea plantations. All transactions require Hill Area Conservation Authority (HACA) approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-brand-green" />
                <span>Estates Office: Commercial Rd, Ooty</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span>RERA Registration No. TN-3329</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
