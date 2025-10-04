import React, { useState } from 'react';

interface ApiSettingsProps {
  onApiCredentials: (key: string, secret: string) => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ onApiCredentials }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey && apiSecret) {
      onApiCredentials(apiKey, apiSecret);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">API Configuration</h2>
      <p className="text-gray-400 mb-4">
        Enter your MEXC API credentials to start trading. Your credentials are stored locally in your browser.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your MEXC API key"
            required
          />
        </div>
        
        <div>
          <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-300 mb-2">
            API Secret
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              id="apiSecret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your MEXC API secret"
              required
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showSecret ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Configure API
          </button>
        </div>
      </form>
      
      <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-md">
        <h3 className="text-sm font-medium text-yellow-400 mb-2">Security Notice</h3>
        <ul className="text-sm text-yellow-300 space-y-1">
          <li>• Your API credentials are stored locally in your browser</li>
          <li>• Never share your API keys with anyone</li>
          <li>• Use API keys with trading permissions only</li>
          <li>• Consider using IP restrictions in your MEXC account</li>
        </ul>
      </div>
    </div>
  );
};
