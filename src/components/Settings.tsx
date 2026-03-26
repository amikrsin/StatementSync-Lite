import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Key, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySave: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onKeySave }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    onKeySave(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Your key is stored locally in your browser and never sent to our servers.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={!apiKey}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  saved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Saved Successfully
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
