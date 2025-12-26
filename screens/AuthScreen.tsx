
import React, { useState } from 'react';
import { Auth } from '../types';
import { login, register, mockLogin, mockRegister } from '../services/firebase';
import { Lock, User, ArrowRight, UserPlus, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  auth: Auth | null;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ auth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userIdInput, setUserIdInput] = useState('smartelectronics22111@gmail.com');
  const [password, setPassword] = useState('Smart@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const formatEmail = (input: string) => {
    if (input.includes('@')) return input;
    return `${input.replace(/\s+/g, '').toLowerCase()}@smart.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const email = formatEmail(userIdInput);

    try {
      if (isLogin) {
        if (auth) {
           try {
             await login(auth, email, password);
           } catch (onlineErr: any) {
             console.warn("Online login failed, attempting offline fallback...");
             try {
                await mockLogin(email, password);
             } catch (offlineErr) {
                throw onlineErr; 
             }
           }
        } else {
           await mockLogin(email, password);
        }
      } else {
        if (auth) {
          try {
            await register(auth, email, password);
          } catch (onlineErr: any) {
             console.warn("Online register failed, attempting offline...");
             await mockRegister(email, password);
          }
        } else {
           await mockRegister(email, password);
        }
        setSuccessMsg("Account ready! Logging you in...");
      }
    } catch (err: any) {
      let msg = "Authentication failed.";
      const errorCode = err.code;
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        msg = "Invalid User ID or Password.";
      } else if (errorCode === 'auth/email-already-in-use') {
        msg = "This User ID is already taken.";
      } else if (errorCode === 'auth/weak-password') {
        msg = "Password must be at least 6 characters.";
      } else if (errorCode === 'auth/invalid-email') {
        msg = "Invalid User ID format.";
      } else if (errorCode === 'auth/network-request-failed') {
        msg = "Network error. Please check your connection.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/30">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase">Smart Electronics</h1>
            <p className="text-indigo-200 text-sm mt-2 font-medium">Business Management Portal</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
              isLogin ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
              !isLogin ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">User ID (or Email)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                  placeholder="admin or email@domain.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-start">
                <span className="mr-2 font-bold">!</span> {error}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-start">
                <span className="mr-2 font-bold">✓</span> {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white transition-all transform active:scale-95 ${
                loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {loading ? "Processing..." : isLogin ? "Access Dashboard" : "Register Account"}
              {!loading && <LogIn className="ml-2 w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isLogin ? (
                <>New here? <span className="text-indigo-600 font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(false); setError(''); }}>Create ID</span></>
              ) : (
                <>Have an ID? <span className="text-indigo-600 font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(true); setError(''); }}>Login here</span></>
              )}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
           <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Smart Electronics - Inventory & Billing</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
