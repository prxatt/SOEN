# Supabase Project Activation & Backend Setup Guide

## 🚀 **Step 1: Activate Your Supabase Project**

### **1.1 Access Your Supabase Dashboard**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Find your project: `afowfefzjonwbqtthacq`
4. Click on the project to open the dashboard

### **1.2 Reactivate Paused Project**
If your project is paused due to inactivity:
1. In the dashboard, look for a "Resume" or "Activate" button
2. Click to reactivate the project
3. Wait for the project to come back online (usually 1-2 minutes)

### **1.3 Get Your Project Credentials**
Once active, go to **Settings → API** and copy:
- **Project URL**: `https://afowfefzjonwbqtthacq.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔧 **Step 2: Set Up Environment Variables**

### **2.1 Create .env File**
```bash
# Copy the example file
cp soen.env.example .env
```

### **2.2 Update .env with Your Supabase Credentials**
```env
# Supabase Configuration
SUPABASE_URL=https://afowfefzjonwbqtthacq.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration
SUPABASE_DB_HOST=db.afowfefzjonwbqtthacq.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Development Settings
NODE_ENV=development
DEBUG_MODE=true
```

## 🗄️ **Step 3: Set Up Database Schema**

### **3.1 Run Security Migration**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-security-migration.sql`
3. Paste and run the migration
4. Verify all tables and functions are created successfully

### **3.2 Verify Database Setup**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'notebooks', 'notes', 'tasks', 'projects', 'goals');

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'notebooks', 'notes', 'tasks', 'projects', 'goals');
```

## 🔐 **Step 4: Configure Authentication**

### **4.1 Enable Authentication Providers**
In Supabase Dashboard → **Authentication → Providers**:
1. **Email**: Enable email/password authentication
2. **Google**: Optional - for future OAuth integration
3. **Magic Link**: Optional - for passwordless login

### **4.2 Set Up Auth Policies**
The security migration already includes RLS policies, but verify they're working:

```sql
-- Test RLS policies
SET ROLE authenticated;
SELECT * FROM public.profiles; -- Should only return current user's data
```

## 🛠️ **Step 5: Create Backend API**

### **5.1 Install Supabase Client**
```bash
npm install @supabase/supabase-js
```

### **5.2 Create Supabase Client Configuration**
Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afowfefzjonwbqtthacq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}
```

### **5.3 Update Authentication Component**
Update `components/auth/Auth.tsx` to use Supabase:

```typescript
import { supabase, auth } from '../lib/supabase'

// Add Supabase authentication alongside the bypass
const handleSupabaseLogin = async (email: string, password: string) => {
  try {
    const { data, error } = await auth.signIn(email, password)
    if (error) throw error
    
    if (data.user) {
      localStorage.setItem('soen-authenticated', 'true')
      localStorage.setItem('soen-user-id', data.user.id)
      onLogin()
    }
  } catch (error) {
    console.error('Login error:', error)
    // Show error message to user
  }
}

const handleSupabaseSignup = async (email: string, password: string, fullName: string) => {
  try {
    const { data, error } = await auth.signUp(email, password, fullName)
    if (error) throw error
    
    if (data.user) {
      localStorage.setItem('soen-authenticated', 'true')
      localStorage.setItem('soen-user-id', data.user.id)
      onLogin()
    }
  } catch (error) {
    console.error('Signup error:', error)
    // Show error message to user
  }
}
```

## 🎯 **Step 6: Maintain Developer Bypass**

### **6.1 Keep C+1+0 Bypass Active**
The existing bypass in `components/auth/Auth.tsx` will continue to work:

```typescript
// This code is already in your Auth.tsx and should remain
useEffect(() => {
  // Check if C, 1, and 0 are all pressed
  if (keysPressed.has('c') && keysPressed.has('1') && keysPressed.has('0')) {
    console.log('🚀 Testing bypass activated!');
    onLogin();
  }
}, [keysPressed, onLogin]);
```

### **6.2 Add Development Mode Indicator**
Add a visual indicator when bypass is used:

```typescript
const [isDevMode, setIsDevMode] = useState(false)

useEffect(() => {
  if (keysPressed.has('c') && keysPressed.has('1') && keysPressed.has('0')) {
    console.log('🚀 Testing bypass activated!');
    setIsDevMode(true)
    onLogin()
  }
}, [keysPressed, onLogin])

// Show dev mode indicator
{isDevMode && (
  <div className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">
    DEV MODE
  </div>
)}
```

## 🔄 **Step 7: Update API Configuration**

### **7.1 Update API Client**
Update `src/config/api.ts` to use Supabase:

```typescript
import { supabase } from '../lib/supabase'

// Update authAPI to use Supabase
export const authAPI = {
  async login(email: string, password: string) {
    const { data, error } = await auth.signIn(email, password)
    if (error) throw error
    return { user: data.user, token: data.session?.access_token }
  },

  async register(userData: { email: string; password: string; fullName: string }) {
    const { data, error } = await auth.signUp(userData.email, userData.password, userData.fullName)
    if (error) throw error
    return { user: data.user, token: data.session?.access_token }
  },

  async logout() {
    const { error } = await auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const user = await auth.getCurrentUser()
    return { user }
  }
}
```

## 🧪 **Step 8: Test the Setup**

### **8.1 Test Supabase Connection**
```bash
# Start your development server
npm run dev

# Test the connection by checking browser console for Supabase client
```

### **8.2 Test Authentication**
1. **Test Real Authentication**:
   - Try signing up with a real email
   - Check Supabase dashboard → Authentication → Users
   - Verify user appears in the database

2. **Test Developer Bypass**:
   - Press C+1+0 simultaneously
   - Verify you can still bypass authentication
   - Check that dev mode indicator appears

### **8.3 Test Database Operations**
```typescript
// Test database operations
const testDatabase = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Database test failed:', error)
  } else {
    console.log('Database test successful:', data)
  }
}
```

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

1. **Project Still Paused**:
   - Check your Supabase dashboard
   - Look for billing issues
   - Contact Supabase support if needed

2. **Authentication Not Working**:
   - Verify environment variables are correct
   - Check Supabase project URL and keys
   - Ensure RLS policies are properly set up

3. **Database Connection Issues**:
   - Verify database password is correct
   - Check if security migration ran successfully
   - Ensure tables exist in the database

4. **C+1+0 Bypass Not Working**:
   - Check browser console for errors
   - Verify the Auth component is properly loaded
   - Test with different key combinations

### **Debug Commands**
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
console.log('Supabase client created successfully');
"
```

## 📊 **Monitoring & Maintenance**

### **Supabase Dashboard Monitoring**
- **Authentication**: Monitor user signups and logins
- **Database**: Check query performance and errors
- **API**: Monitor API usage and rate limits
- **Logs**: Review error logs and performance metrics

### **Development Workflow**
1. **Daily Development**: Use C+1+0 bypass for quick testing
2. **Testing**: Use real authentication for integration testing
3. **Production**: Disable bypass in production builds

This setup ensures your Supabase project is active and functional while maintaining your developer bypass for efficient development workflow.
