import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { 
    CheckCircle, 
    Calendar, 
    Clock, 
    ChartBar, 
    Heart, 
    Sparkles, 
    Sun, 
    Cloud, 
    CloudRain, 
    Snowflake, 
    Activity,
    ChevronLeft,
    ChevronRight,
    Plus,
    Brain,
    Bolt,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Star,
    Trophy,
    Target,
    Zap,
    TrendingUp,
    BarChart3,
    PieChart,
    LineChart,
    Users,
    Settings,
    Bell,
    Search,
    Menu,
    X,
    ArrowRight,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Play,
    Pause,
    RefreshCw,
    RotateCcw,
    Download,
    Upload,
    Share,
    Copy,
    Edit,
    Trash2,
    Save,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Shield,
    AlertCircle,
    Info,
    Check,
    XCircle,
    HelpCircle,
    ExternalLink,
    Link,
    Mail,
    Phone,
    MapPin,
    Globe,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow,
    Signal,
    SignalZero,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    Camera,
    Video,
    Image,
    File,
    Folder,
    FolderOpen,
    Archive,
    Bookmark,
    Tag,
    Filter,
    SortAsc,
    SortDesc,
    Grid,
    List,
    Layout,
    Maximize,
    Minimize,
    Move,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Focus,
    Crop,
    Scissors,
    Palette,
    Brush,
    Eraser,
    Pen,
    Pencil,
    Highlighter,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Terminal,
    Database,
    Server,
    Cpu,
    HardDrive,
    MemoryStick,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Headphones,
    Speaker,
    Radio,
    Tv,
    Gamepad2,
    Joystick,
    Dice1,
    Dice2,
    Dice3,
    Dice4,
    Dice5,
    Dice6,
    Puzzle,
    Gamepad,
    Mouse,
    Keyboard,
    MousePointer,
    Hand,
    Fingerprint,
    Scan,
    QrCode,
    Barcode,
    CreditCard,
    DollarSign,
    Euro,
    PoundSterling,
    Bitcoin,
    Wallet,
    ShoppingCart,
    ShoppingBag,
    Store,
    Building,
    Home,
    Building2,
    Factory,
    Warehouse,
    School,
    Hospital,
    Church,
    Landmark,
    Flag,
    Map,
    Compass,
    Navigation,
    Route,
    Car,
    Bus,
    Train,
    Plane,
    Ship,
    Truck,
    Bike,
    Rocket,
    Satellite,
    Space,
    Moon,
    Eclipse,
    Sunrise,
    Sunset,
    CloudSun,
    CloudMoon,
    CloudSnow,
    CloudLightning,
    CloudDrizzle,
    CloudFog,
    Wind,
    Thermometer,
    Droplets,
    Umbrella,
    Rainbow,
    Tornado,
    Mountain,
    Trees,
    TreePine,
    Flower,
    Rose,
    Cherry,
    Apple,
    Banana,
    Grape,
    TrendingUp as ArrowTrendingUp
} from 'lucide-react';

// A generic icon wrapper for props with improved type safety
type IconProps = React.SVGProps<SVGSVGElement> & {
  className?: string;
  size?: number;
};

// Enhanced Soen Logo with better proportions
// FIX: Convert SoenLogo to a motion.svg component to accept animation props like `variants`.
// FIX: Use a combined type for SoenLogo props to include standard SVG props and motion props.
export const SoenLogo: React.FC<IconProps & MotionProps> = ({ size = 24, ...props }) => (
    <motion.svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size}
        {...props}
    >
        <motion.path
            d="M25 25H75V40H60C52.268 40, 46 46.268, 46 54V75H25V25Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            fill="none"
        />
        <motion.path
            d="M54 75L54 60C54 54.4772, 58.4772 50, 64 50L75 50"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </motion.svg>
);

// Navigation Icons - Minimal Luxury Design
export const HomeIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        stroke="currentColor" 
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        stroke="currentColor" 
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        stroke="currentColor" 
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
    </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        stroke="currentColor" 
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

// Enhanced Mira Icon with better visual consistency
export const MiraIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>
        <path d="M16.5 7.5c-1.8-1.8-4.2-2.8-6.7-2.8" />
        <path d="M7.5 16.5c1.8 1.8 4.2 2.8 6.7 2.8" />
        <path d="M20.3 10.8c-1.1-2.9-3.2-5-5.8-6.3" />
        <path d="M3.7 13.2c1.1 2.9 3.2 5 5.8 6.3" />
    </svg>
);

export const BabyPenguinIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 100 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <defs>
            <linearGradient id="miraBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b3b3b" />
                <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
        </defs>
        
        {/* Body - Soft, rounded ellipse */}
        <ellipse cx="50" cy="70" rx="35" ry="40" fill="url(#miraBodyGradient)" />
        
        {/* Belly - Soft white/cream */}
        <ellipse cx="50" cy="75" rx="22" ry="28" fill="#fef3c7" />
        
        {/* Head - Soft, rounded circle */}
        <circle cx="50" cy="35" r="28" fill="url(#miraBodyGradient)" />
        
        {/* Left Eye - Large, friendly, dark */}
        <circle cx="42" cy="32" r="7" fill="#1f2937" />
        <circle cx="43.5" cy="30.5" r="3" fill="#ffffff" />
        
        {/* Right Eye - Large, friendly, dark */}
        <circle cx="58" cy="32" r="7" fill="#1f2937" />
        <circle cx="59.5" cy="30.5" r="3" fill="#ffffff" />
        
        {/* Beak - Soft orange/yellow */}
        <polygon points="50,40 46,44 54,44" fill="#fbbf24" />
        
        {/* Cheek blush - Soft pink */}
        <circle cx="35" cy="38" r="4" fill="#fbcfe8" opacity="0.6" />
        <circle cx="65" cy="38" r="4" fill="#fbcfe8" opacity="0.6" />
        
        {/* Left Foot - Soft orange */}
        <ellipse cx="40" cy="108" rx="8" ry="5" fill="#f59e0b" />
        
        {/* Right Foot - Soft orange */}
        <ellipse cx="60" cy="108" rx="8" ry="5" fill="#f59e0b" />
    </svg>
);

// Activity Icon for health metrics
export const ActivityIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <path 
            d="M22 12h-4l-3 9L9 3l-3 9H2" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

// Weather Icons
export const CloudIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <path 
            d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

export const RainIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <path 
            d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            d="M8 14l2 2 4-4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

export const SnowIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <path 
            d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

// Refined Action Icons
export const SparklesIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.25 18.5l1.188-.648a2.25 2.25 0 011.423-1.423L16.5 15.75l.648 1.188a2.25 2.25 0 011.423 1.423L19.75 18.5l-1.188.648a2.25 2.25 0 01-1.423 1.423z" />
    </svg>
);

// Simple Bell Icon for Notifications
export const BellIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        {...props}
    >
        <defs>
            <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </linearGradient>
        </defs>
        <path 
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.248 24.248 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="url(#bellGradient)"
        />
        <circle cx="18" cy="6" r="2.5" fill="currentColor" opacity="0.8" />
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Enhanced Check Icon with better stroke weight
export const CheckIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

// Enhanced Plus Icon with better visual weight
export const PlusIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Navigation Chevrons
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

// Calendar and Time Icons
export const CalendarDaysIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25m10.5-2.25v2.25m-10.5 0H3.75a2.25 2.25 0 00-2.25 2.25v11.25a2.25 2.25 0 002.25 2.25h16.5a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H17.25m-10.5 0h10.5m-10.5 0V3m10.5 0V3m0 0H6.75M7.5 11.25h9v5.25h-9z" />
    </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Enhanced Google Calendar Icon
export const GoogleCalendarIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        {...props}
    >
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
    </svg>
);

// Document and Content Icons
export const DocumentIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const DocumentPlusIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9h-3.75m3.75 0h3.75m-3.75 0v3.75m0-3.75V9.75M9.75 15.75H6m3.75 0v3.75m0-3.75v-3.75m0 3.75h3.75m-3.75 0h-3.75m2.25-4.5h-3.75m3.75 0V9M15 15.75H9.75m5.25 0v3.75m0-3.75v-3.75m0 3.75H18m-2.25 0h-3.75m-1.5-1.5-1.5-1.5-1.5 1.5-1.5-1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

// Interaction Icons
export const TrashIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Communication Icons
export const ChatBubbleLeftEllipsisIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.125 1.125 0 01-1.59 0l-3.72-3.72a2.474 2.474 0 01-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097m0 0A2.466 2.466 0 0012 6.25a2.466 2.466 0 00-2.25 2.261m0 0A2.466 2.466 0 007.5 6.25a2.466 2.466 0 00-2.25 2.261m0 0A2.466 2.466 0 003 10.608v4.286c0 1.136.847 2.1 1.98 2.193l3.72 3.72a1.125 1.125 0 001.59 0l3.72-3.72a2.474 2.474 0 001.98-2.193V10.608c0-.97-.616-1.813-1.5-2.097z" />
    </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
);

// Status and Action Icons
export const BrainCircuitIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.04 4.5a6.75 6.75 0 100 15 6.75 6.75 0 000-15zm.106 4.195a2.25 2.25 0 00-2.312 2.312v.001a2.25 2.25 0 102.312-2.312zm3.342 3.342a2.25 2.25 0 10-2.312 2.312v.001a2.25 2.25 0 002.312-2.312zm-4.394-1.03a2.25 2.25 0 10-2.312 2.312v.001a2.25 2.25 0 002.312-2.312zm-3.342-3.342a2.25 2.25 0 10-2.312 2.312v.001a2.25 2.25 0 002.312-2.312zm7.736 1.03a2.25 2.25 0 10-2.312 2.312v.001a2.25 2.25 0 002.312-2.312zM15.75 12a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"/>
    </svg>
);

export const FireIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" />
    </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

export const MinusIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);


// Text Formatting Icons
export const BoldIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        fill="none" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
    >
        <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
    </svg>
);

export const ItalicIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        fill="none" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
    >
        <line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line>
    </svg>
);

export const UnderlineIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        fill="none" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
    >
        <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M4 21h16"></path>
    </svg>
);

// List Icons
export const ListBulletIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const ListOrderedIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        fill="none" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="1.5" 
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
    >
        <path d="M11 6h10M11 12h10M11 18h10M4 6h1v4M4 12h1v4M4 18h1v4"></path>
    </svg>
);

// Media and File Icons
export const PhotoIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 017.5 0z" />
    </svg>
);

export const VideoCameraIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
);

export const PaperClipIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1118.375 8.25l-10.94 10.94a2.25 2.25 0 01-3.182-3.182m3.182 3.182l6.364-6.364" />
    </svg>
);

// System Icons
export const Cog6ToothIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.26.716.53 1.003l.867.867c.27.27.63.424 1.003.53l1.28.213c.542.09.94.56.94 1.11v2.594c0 .55-.398 1.02-.94 1.11l-1.28.213c-.374.063-.716.26-1.003.53l-.867.867c-.27.27-.424.63-.53 1.003l-.213 1.28c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.26-.716-.53-1.003l-.867-.867c-.27-.27-.63-.424-1.003-.53l-1.28-.213c-.542.09-.94-.56-.94-1.11v-2.594c0 .55.398 1.02.94 1.11l1.28-.213c.374-.063.716-.26 1.003-.53l.867-.867c.27.27.424-.63.53-1.003l.213-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

// Enhanced Grid Icon
export const GridIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
    >
        <circle cx="6" cy="6" r="1.5"/>
        <circle cx="12" cy="6" r="1.5"/>
        <circle cx="18" cy="6" r="1.5"/>
        <circle cx="6" cy="12" r="1.5"/>
        <circle cx="12" cy="12" r="1.5"/>
        <circle cx="18" cy="12" r="1.5"/>
        <circle cx="6" cy="18" r="1.5"/>
        <circle cx="12" cy="18" r="1.5"/>
        <circle cx="18" cy="18" r="1.5"/>
    </svg>
);

// Utility and Organization Icons
export const ArchiveBoxIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />
    </svg>
);

export const FlagIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25H5.996a2.25 2.25 0 01-2.25-2.25v-4.098m16.5 0a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5h-16.5A2.25 2.25 0 001.5 6.75v4.95a2.25 2.25 0 002.25 2.25M18.75 4.5v.75A2.25 2.25 0 0116.5 7.5h-9A2.25 2.25 0 015.25 5.25v-.75" />
    </svg>
);

// Movement and Expansion Icons
export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0l6 6m10.5-6v4.5m0-4.5h-4.5m4.5 0l-6 6M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0l6-6m10.5 6v-4.5m0 4.5h-4.5m4.5 0l-6-6" />
    </svg>
);

export const ArrowsPointingInIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
    </svg>
);

export const ArrowUturnLeftIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const ArrowDownTrayIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ArrowUpOnSquareIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);


export const ArrowPathIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992m0 0l-3.182 3.182a8.25 8.25 0 000 11.667l3.182 3.182" />
    </svg>
);

// FIX: Add missing ArrowRightIcon for use in Dashboard.
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
    </svg>
);

// Specialized Icons
export const GiftIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        width={size}
        height={size}
        stroke="currentColor" 
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15 6l-3-3m-6 0l-3 3" />
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

export const LightBulbIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.375 6.375 0 006.375-6.375H5.625a6.375 6.375 0 006.375 6.375z" />
    </svg>
);

export const RocketIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.18a14.98 14.98 0 00-2.17 5.85m12.12 6.16v-2.17a14.98 14.98 0 00-5.85-2.17m-6.16 0A14.98 14.98 0 002.18 9.63 14.98 14.98 0 007.5 21.75a14.98 14.98 0 007.38-5.84m-7.38 0a6 6 0 01-5.84-7.38" />
    </svg>
);

// User and Identity Icons
export const UserIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

// Communication and Send Icons
export const PaperAirplaneIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

// Media Controls
export const PlayIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" />
    </svg>
);

// Analytics Icons
export const ChartBarIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

export const ClipboardDocumentListIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// Weather Icons
export const SunIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);


export const BoltSlashIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 3.75l-2.012 5.03M21 21L3 3m18 0L3 21" />
    </svg>
);

// Enhanced Icon Set - Additional icons for complete coverage

// Status and Feedback Icons
export const ExclamationTriangleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Enhanced Menu and Layout Icons
export const Bars3Icon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const EllipsisVerticalIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);

export const EllipsisHorizontalIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
);

export const SortAscendingIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
    </svg>
);

export const SortDescendingIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25.75L17.25 18m0 0L21 15.25M17.25 18V6" />
    </svg>
);

// Task and Productivity Icons
export const ClipboardIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

// FIX: Add missing PencilIcon for the notes component.
export const PencilIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const TagIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const Squares2X2Icon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);


export const ViewColumnsIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125a1.125 1.125 0 00-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

export const GoogleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.657-11.303-8.653l-6.571,4.819C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.638,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export const AppleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" {...props}>
        <path d="M11.182.008C10.148-.03 9.07.238 8.07.715c-.995.48-1.96.983-3.038.983-.995 0-2.02-.483-2.95-.95-1.02-.513-2.06-.92-3.03-.55C-1.83.56.24 3.012.7 4.93c.47 1.93 2.13 4.54 3.92 4.54 1.75 0 2.45-1.31 4.52-1.31 2.06 0 2.59 1.31 4.51 1.31 1.76 0 3.32-2.31 3.84-4.24.52-1.94-.9-4.28-2.82-4.64zM8.07 1.635c.995-.48 2.02-.983 3.038-.983.995 0 2.02.483 2.95.95.89.43.92.54 1.13.54s.48-.11.48-.54c0-1.72-2.31-3.32-4.51-3.32-2.21 0-4.01 1.31-4.95 1.31-.95 0-2.21-1.31-4.02-1.31-2.02 0-4.12 1.48-4.12 3.32 0 .43.26.54.48.54s.24-.11.48-.54c.93-.467 1.955-.95 2.95-.95.995 0 2.05.483 3.038.983z"/>
    </svg>
);

// Additional missing icons
export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <ArrowTrendingUp size={size} {...props} />
);

// Eye Icon for viewing/visibility
export const EyeIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        width={size}
        height={size}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Layout Components Export
export default {
    // Core brand
    SoenLogo,
    
    // Navigation
    HomeIcon,
    CalendarIcon,
    DocumentTextIcon,
    UserCircleIcon,
    MiraIcon,
    
    // Actions
    SparklesIcon,
    CheckCircleIcon,
    CheckIcon,
    PlusIcon,
    PlusCircleIcon,
    TrashIcon,
    XMarkIcon,
    
    // Navigation controls
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    
    // Time & Calendar
    CalendarDaysIcon,
    ClockIcon,
    GoogleCalendarIcon,
    
    // Documents
    DocumentIcon,
    DocumentPlusIcon,
    BookOpenIcon,
    
    // Communication
    ChatBubbleLeftEllipsisIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    ChatBubbleLeftRightIcon,
    
    // Status
    BrainCircuitIcon,
    FireIcon,
    BoltIcon,
    MinusIcon,
    
    // System
    Cog6ToothIcon,
    MagnifyingGlassIcon,
    GridIcon,
    
    // Organization
    ArchiveBoxIcon,
    FlagIcon,
    BriefcaseIcon,
    
    // Movement
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    ArrowUturnLeftIcon,
    ArrowDownTrayIcon,
    ArrowUpOnSquareIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    
    // Specialized
    GiftIcon,
    LinkIcon,
    LightBulbIcon,
    RocketIcon,
    
    // User
    UserIcon,
    HeartIcon,
    ActivityIcon,
    MapPinIcon,
    
    // Weather
    CloudIcon,
    RainIcon,
    SnowIcon,
    
    // Media
    PhotoIcon,
    VideoCameraIcon,
    PaperClipIcon,
    PaperAirplaneIcon,
    PlayIcon,
    PauseIcon,
    
    // Analytics
    ChartBarIcon,
    ClipboardDocumentListIcon,
    
    // Weather
    SunIcon,
    BoltSlashIcon,
    
    // Status feedback
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    
    // Layout
    Bars3Icon,
    EllipsisVerticalIcon,
    EllipsisHorizontalIcon,
    Squares2X2Icon,
    ViewColumnsIcon,
    
    // Productivity
    ClipboardIcon,
    StarIcon,
    BookmarkIcon,
    PencilIcon,
    TagIcon,
    
    // Text formatting
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    ListBulletIcon,
    ListOrderedIcon,

    // Sorting
    SortAscendingIcon,
    SortDescendingIcon,

    // Social
    GoogleIcon,
    AppleIcon,

    // Additional missing icons
    ArrowTrendingUpIcon,
    EyeIcon
};