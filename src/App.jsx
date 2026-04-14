import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  Book, 
  X, 
  ArrowRight, 
  User, 
  Quote, 
  LogOut, 
  Calendar,
  Mail,
  Github,
  UploadCloud,
  Image as ImageIcon,
  Shield,
  Edit,
  Trash2,
  Plus,
  Filter
} from 'lucide-react';

// --- Firebase Initialization using Environment Variables ---
const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_API_KEY) || "AIzaSyC4vCZUTpO6nK38buSfH_AuyOdAhCutiW8",
  authDomain: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_AUTH_DOMAIN) || "sharda-yearbook-2022-26.firebaseapp.com",
  projectId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_PROJECT_ID) || "sharda-yearbook-2022-26",
  storageBucket: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_STORAGE_BUCKET) || "sharda-yearbook-2022-26.firebasestorage.app",
  messagingSenderId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "159399947630",
  appId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_APP_ID) || "1:159399947630:web:359397a40cd9c9e3b0e57f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const appId = (typeof process !== 'undefined' && process.env.VITE_FIREBASE_PROJECT_ID) || "sharda-yearbook-2022-26";

const CATEGORIES = [
  'Computer Science', 
  'Electronics & Comm.', 
  'Mechanical', 
  'Civil', 
  'Biotechnology',
  'BCA / MCA',
  'Business / Management',
  'Other'
];

const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: Action took too long. Check if Firestore Database is created in your Firebase Console.")), ms)
    )
  ]);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState('home'); 
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'yearbook_profiles');
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProfiles(data);
    }, (error) => {
      console.error("Error fetching profiles:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminUnlock = () => {
    setIsAdmin(true);
    setView('admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse flex flex-col items-center">
          <Book className="w-8 h-8 text-zinc-300 mb-4" />
          <div className="text-sm font-medium tracking-widest text-zinc-400 uppercase">Loading</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      <Navigation 
        view={view} 
        setView={setView} 
        onAdminUnlock={handleAdminUnlock} 
        isAdmin={isAdmin}
      />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 w-full max-w-6xl mx-auto">
        {view === 'home' && <HomeView setView={setView} />}
        {view === 'directory' && <DirectoryView profiles={profiles} onSelectProfile={setSelectedProfile} />}
        {view === 'portal' && <PortalView profiles={profiles} user={user} />}
        {view === 'admin' && isAdmin && <AdminDashboard profiles={profiles} />}
      </main>

      {view === 'portal' && <Footer />}

      {selectedProfile && (
        <ProfileModal 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </div>
  );
}

// --- Components ---

function Navigation({ view, setView, onAdminUnlock, isAdmin }) {
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    if (clickCount >= 4) {
      const pwd = prompt("Enter Administrator Passcode:");
      if (pwd && btoa(pwd) === 'U2hhcmRhQDIwMjY=') {
        onAdminUnlock();
      } else if (pwd) {
        alert("Access Denied.");
      }
      setClickCount(0);
    } else {
      setClickCount(prev => prev + 1);
      setView('home');
      setTimeout(() => setClickCount(0), 2000);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={handleLogoClick}
        >
          <img 
            src="https://images.careerindia.com/college-logos/6/new-logo-2-1688116635-png" 
            alt="Sharda Logo" 
            className="h-8 object-contain"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.style.display = 'none'; 
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <Book className="w-5 h-5 hidden text-black" />
          <span className="font-bold tracking-tight text-lg text-black">Yearbook</span>
        </div>
        
        <div className="flex gap-4 sm:gap-6 text-sm font-medium text-zinc-500">
          <button 
            onClick={() => setView('directory')}
            className={`hover:text-black transition-colors ${view === 'directory' ? 'text-black' : ''}`}
          >
            Directory
          </button>
          <button 
            onClick={() => setView('portal')}
            className={`hover:text-black transition-colors ${view === 'portal' ? 'text-black' : ''}`}
          >
            Student Portal
          </button>
          {isAdmin && (
            <button 
              onClick={() => setView('admin')}
              className={`hover:text-black transition-colors flex items-center gap-1 ${view === 'admin' ? 'text-black' : ''}`}
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomeView({ setView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium uppercase tracking-widest text-zinc-500 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Digital Yearbook
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
        Preserve the <br /> <span className="text-zinc-400">memories.</span>
      </h1>
      <p className="text-lg text-zinc-500 max-w-md mx-auto mb-10 font-light">
        A minimalist space for the Batch of 2022-26 to leave their mark. Create your profile, share a quote, and remember the journey.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setView('directory')}
          className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          View Directory <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setView('portal')}
          className="bg-white text-black border border-zinc-200 px-8 py-3 rounded-full font-medium hover:bg-zinc-50 transition-colors"
        >
          Add Your Profile
        </button>
      </div>
    </div>
  );
}

function DirectoryView({ profiles, onSelectProfile }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProfiles = selectedCategory === 'All' 
    ? profiles 
    : profiles.filter(p => p.category === selectedCategory);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10 flex flex-col items-center text-center">
        <h2 className="text-4xl font-black tracking-tight mb-3 uppercase">BATCH 2022 - 26</h2>
        <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm">Sharda University</p>
        <div className="w-12 h-1 bg-black mt-8 mb-8"></div>
      </header>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-12">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${selectedCategory === 'All' ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          All Profiles
        </button>
        {CATEGORIES.map(category => (
          <button 
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${selectedCategory === category ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 bg-white border border-dashed border-zinc-200 rounded-2xl">
          <Book className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p>No profiles found in this category.</p>
          <p className="text-sm mt-1">Be the first to add your profile via the Student Portal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5 px-2 sm:px-4">
          {filteredProfiles.map((profile) => (
            <div 
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-black transition-all cursor-pointer group flex flex-col overflow-hidden h-full"
            >
              {/* Image Section: Perfectly Square */}
              <div className="w-full aspect-square bg-zinc-100 overflow-hidden relative shrink-0">
                <img 
                  src={profile.photoUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}`} 
                  alt={profile.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}`; }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none"></div>
              </div>
              
              {/* Text Section */}
              <div className="p-3 flex flex-col items-center justify-center text-center bg-white w-full flex-grow">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 line-clamp-1 w-full">
                  {profile.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] font-bold text-black uppercase tracking-wider mt-0.5 line-clamp-1 w-full">
                  {profile.category || 'Student'}
                </p>
                {/* Quote: Hidden on mobile (default), visible on medium screens (md:block) */}
                <p className="hidden md:-webkit-box md:line-clamp-3 text-[10px] md:text-xs text-zinc-500 italic mt-2 w-full px-1">
                  "{profile.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortalView({ profiles, user }) {
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    quote: ''
  });
  
  const [photoFile, setPhotoFile] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const isValidEmail = (email) => {
    if (!email) return false;
    return email.startsWith('2022') && email.endsWith('@ug.sharda.ac.in');
  };

  const isFullyAuthenticated = user && !user.isAnonymous && isValidEmail(user.email);
  const existingProfile = isFullyAuthenticated ? profiles.find(p => p.id === user.uid) : null;
  const isEditing = !!existingProfile;
  
  // Track edit limits
  const MAX_EDITS = 3;
  const editCount = existingProfile?.editCount || 0;
  const hasReachedEditLimit = isEditing && editCount >= MAX_EDITS;

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        name: existingProfile.name || '',
        category: existingProfile.category || CATEGORIES[0],
        quote: existingProfile.quote || ''
      });
      setExistingPhotoUrl(existingProfile.photoUrl || null);
    }
  }, [existingProfile]);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      
      if (!isValidEmail(email)) {
        await signOut(auth);
        setError("Access Denied: Email must start with '2022' and end with '@ug.sharda.ac.in'.");
      }
    } catch (err) {
      console.error(err);
      setError("Google Sign-In failed. If you blocked popups, please allow them.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPhotoFile(null);
    setPhotoPreview(null);
    setError('');
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if(hasReachedEditLimit) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processFile(file);
    else setError("Please drop a valid image file.");
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };
  
  const processFile = (file) => {
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(compressedBase64);
        setPhotoFile(compressedBase64);
      };
      img.onerror = () => setError("Failed to process image file.");
      img.src = reader.result;
    };
    reader.onerror = () => setError("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isFullyAuthenticated || hasReachedEditLimit) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      let finalPhotoUrl = existingPhotoUrl;
      if (photoFile) finalPhotoUrl = photoFile;

      const profileData = {
        name: formData.name,
        email: user.email, 
        category: formData.category,
        quote: formData.quote,
        photoUrl: finalPhotoUrl || '',
        updatedAt: serverTimestamp(),
        editCount: isEditing ? editCount + 1 : 0
      };

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'yearbook_profiles', user.uid);
      await withTimeout(setDoc(docRef, profileData, { merge: true }));
      
      alert(isEditing ? "Profile updated successfully!" : "Profile created successfully!");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message || 'Failed to save profile. Check Firestore connection.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isFullyAuthenticated) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Student Portal</h2>
          <p className="text-sm text-zinc-500 mb-8 px-4 leading-relaxed">
            Sign in with your Sharda University Google account to create or edit your yearbook profile. <br/><br/>
            <strong>Note:</strong> Email must start with "2022" and end with "@ug.sharda.ac.in".
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-black text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-zinc-200 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-zinc-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Profile & Settings</h2>
            <p className="text-sm text-zinc-500 mt-1 break-all">{user.email}</p>
          </div>
          <button 
            type="button" 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Profile Card Preview */}
        {existingProfile && (
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-zinc-100 text-center">
            <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 border-2 border-zinc-100 shadow-sm relative">
              <img 
                src={existingPhotoUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${existingProfile.name}`} 
                alt={existingProfile.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${existingProfile.name}`; }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">{existingProfile.name}</h3>
            <p className="text-sm font-bold text-black uppercase tracking-widest mt-1">{existingProfile.category}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{isEditing ? 'Update Details' : 'Create Profile'}</h3>
            {isEditing && (
               <span className={`text-xs font-bold px-3 py-1 rounded-full ${hasReachedEditLimit ? 'bg-red-100 text-red-700' : 'bg-zinc-200 text-zinc-800'}`}>
                 Edits: {editCount} / {MAX_EDITS}
               </span>
            )}
          </div>

          {hasReachedEditLimit && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium mb-6">
              You have reached the maximum number of allowed edits ({MAX_EDITS}). Your profile is now locked and cannot be changed.
            </div>
          )}

          <div className={`space-y-6 ${hasReachedEditLimit ? 'opacity-60 pointer-events-none' : ''}`}>
            <div>
               <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <ImageIcon className="w-3.5 h-3.5" /> Square Profile Photo
              </label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all text-center relative overflow-hidden group
                  ${hasReachedEditLimit ? '' : 'cursor-pointer'}
                  ${isDragging ? 'border-black bg-zinc-100' : 'border-zinc-200 hover:border-black hover:bg-zinc-50'}
                  ${(photoPreview || existingPhotoUrl) && !photoFile ? 'py-4' : 'py-8'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !hasReachedEditLimit && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="image/*" 
                  className="hidden" 
                  disabled={hasReachedEditLimit}
                />

                {(photoPreview || existingPhotoUrl) ? (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-xl overflow-hidden mb-3 bg-zinc-100 border-2 border-white shadow-sm">
                      <img 
                        src={photoPreview || existingPhotoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover object-top group-hover:opacity-75 transition-opacity"
                      />
                    </div>
                    <p className="text-sm font-medium text-zinc-700">Click or drag to change photo</p>
                    {photoFile && <p className="text-xs text-black mt-1 font-semibold">New photo ready to save</p>}
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700">Drag and drop your photo here</p>
                    <p className="text-xs text-zinc-400 mt-1">or click to browse from your device</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border-b-2 border-zinc-200 bg-transparent py-2 focus:border-black outline-none transition-colors"
                placeholder="John Doe"
                required
                disabled={hasReachedEditLimit}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <Filter className="w-3.5 h-3.5" /> Department / Category
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border-b-2 border-zinc-200 bg-transparent py-2 focus:border-black outline-none transition-colors appearance-none cursor-pointer"
                disabled={hasReachedEditLimit}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2"><Quote className="w-3.5 h-3.5" /> Yearbook Quote</span>
                <span className={formData.quote.length >= 150 ? 'text-red-500' : ''}>{formData.quote.length} / 150</span>
              </label>
              <textarea 
                value={formData.quote}
                onChange={(e) => setFormData({...formData, quote: e.target.value})}
                className="w-full border-b-2 border-zinc-200 bg-transparent py-2 focus:border-black outline-none transition-colors resize-none h-24"
                placeholder="Leave your mark on the batch of 2026..."
                maxLength={150}
                required
                disabled={hasReachedEditLimit}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting || hasReachedEditLimit}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isSubmitting && <UploadCloud className="w-5 h-5 animate-bounce" />}
              {isSubmitting ? 'Saving Profile...' : (isEditing ? 'Save Changes' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ profiles }) {
  const [editingProfile, setEditingProfile] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this profile as Admin?")) {
      try {
        await withTimeout(deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yearbook_profiles', id)));
      } catch (err) {
        alert(err.message || "Failed to delete.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'yearbook_profiles', editingProfile.id);
      await withTimeout(updateDoc(docRef, {
        name: editingProfile.name,
        email: editingProfile.email,
        category: editingProfile.category || CATEGORIES[0],
        quote: editingProfile.quote,
        photoUrl: editingProfile.photoUrl,
        editCount: editingProfile.editCount || 0
      }));
      setEditingProfile(null);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update profile.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-black" /> System Administration
          </h2>
          <p className="text-sm text-zinc-500">Manage all yearbook profiles ({profiles.length} total)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-sm text-zinc-500">
              <th className="pb-3 font-medium px-4">Student</th>
              <th className="pb-3 font-medium px-4">Category</th>
              <th className="pb-3 font-medium px-4">Quote</th>
              <th className="pb-3 font-medium px-4 text-center">Edits</th>
              <th className="pb-3 font-medium px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="py-4 px-4 font-medium flex items-center gap-3">
                  <img 
                    src={p.photoUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${p.name}`} 
                    className="w-10 h-10 rounded-xl object-cover bg-zinc-200 shadow-sm"
                    alt=""
                  />
                  <div>
                    <div>{p.name}</div>
                    <div className="text-xs text-zinc-400 font-normal">{p.email}</div>
                  </div>
                </td>
                <td className="py-4 px-4 text-zinc-600">{p.category}</td>
                <td className="py-4 px-4 text-zinc-500 max-w-[200px] truncate" title={p.quote}>{p.quote}</td>
                <td className="py-4 px-4 text-center text-zinc-500">{p.editCount || 0}/3</td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setEditingProfile(p)}
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-zinc-500">No profiles found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setEditingProfile(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Force Edit Profile</h3>
              <button onClick={() => setEditingProfile(null)}><X className="w-5 h-5 text-zinc-400 hover:text-black" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase">Name</label>
                <input 
                  type="text" value={editingProfile.name} 
                  onChange={e => setEditingProfile({...editingProfile, name: e.target.value})}
                  className="w-full border-b border-zinc-200 py-1 outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase">Category</label>
                <select 
                  value={editingProfile.category} 
                  onChange={e => setEditingProfile({...editingProfile, category: e.target.value})}
                  className="w-full border-b border-zinc-200 py-1 outline-none focus:border-black"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase">Quote</label>
                <textarea 
                  value={editingProfile.quote} 
                  onChange={e => setEditingProfile({...editingProfile, quote: e.target.value})}
                  className="w-full border-b border-zinc-200 py-1 outline-none focus:border-black resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase">Edit Count (Reset to 0 to unlock user)</label>
                <input 
                  type="number" value={editingProfile.editCount || 0} 
                  onChange={e => setEditingProfile({...editingProfile, editCount: parseInt(e.target.value)})}
                  className="w-full border-b border-zinc-200 py-1 outline-none focus:border-black"
                />
              </div>
              <div className="pt-4 flex gap-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-medium">Save Bypass</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileModal({ profile, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-zinc-200/50">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-40 h-40 rounded-2xl overflow-hidden mb-6 border-4 border-white shadow-xl relative">
            <img 
              src={profile.photoUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}`} 
              alt={profile.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}`; }}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tight mb-1 text-zinc-900">{profile.name}</h2>
          <p className="text-sm font-bold tracking-widest text-black uppercase mb-8">
            {profile.category}
          </p>
          
          <div className="relative w-full">
            <Quote className="w-8 h-8 text-zinc-100 absolute -top-4 -left-2 transform -scale-x-100" />
            <p className="text-lg text-zinc-700 font-serif italic leading-relaxed px-6 z-10 relative text-justify">
              "{profile.quote}"
            </p>
            <Quote className="w-8 h-8 text-zinc-100 absolute -bottom-4 -right-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 py-8 border-t border-zinc-100">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold tracking-tight">Know Your Creators</h3>
        <p className="text-sm text-zinc-500 mt-1">Built by B.Tech Batch 2022-26</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <a 
          href="https://github.com/Deepayan-Thakur" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 hover:border-black hover:bg-zinc-50 transition-all w-full sm:w-64 mx-auto sm:mx-0"
        >
          <div className="w-12 h-12 bg-zinc-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <img src="https://github.com/Deepayan-Thakur.png" alt="Deepayan Thakur" className="w-full h-full object-cover"/>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-zinc-900 group-hover:text-black transition-colors">Deepayan Thakur</h4>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Github className="w-3 h-3" /> View GitHub
            </p>
          </div>
        </a>
        
        <a 
          href="https://github.com/Joshinx17" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 hover:border-black hover:bg-zinc-50 transition-all w-full sm:w-64 mx-auto sm:mx-0"
        >
          <div className="w-12 h-12 bg-zinc-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <img src="https://github.com/Joshinx17.png" alt="Joshin Saju" className="w-full h-full object-cover"/>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-zinc-900 group-hover:text-black transition-colors">Joshin Saju</h4>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Github className="w-3 h-3" /> View GitHub
            </p>
          </div>
        </a>
      </div>
    </footer>
  );
}