import React, { useState, useEffect } from 'react';
import { notionSyncService } from '../services/notionSyncService';
import { NotionIntegration, NotionSyncLog } from '../types';

interface NotionSyncWidgetProps {
  userId: string;
  noteId: number;
  onSyncComplete?: (success: boolean) => void;
}

export const NotionSyncWidget: React.FC<NotionSyncWidgetProps> = ({
  userId,
  noteId,
  onSyncComplete
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [syncStatus, setSyncStatus] = useState<NotionSyncLog[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    loadSyncStatus();
  }, [userId]);

  const checkConnectionStatus = async () => {
    // In a real implementation, this would check if the user has an active Notion integration
    // For now, we'll simulate this
    setIsConnected(false);
  };

  const loadSyncStatus = async () => {
    try {
      const status = await notionSyncService.getSyncStatus(userId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSetupIntegration = async () => {
    if (!apiKey.trim() || !workspaceId.trim()) {
      alert('Please enter both API key and workspace ID');
      return;
    }

    setIsLoading(true);
    try {
      const success = await notionSyncService.setupNotionIntegration(
        userId,
        apiKey,
        workspaceId
      );

      if (success) {
        setIsConnected(true);
        setShowSetup(false);
        setApiKey('');
        setWorkspaceId('');
        await loadSyncStatus();
      } else {
        alert('Failed to setup Notion integration. Please check your API key.');
      }
    } catch (error) {
      console.error('Error setting up integration:', error);
      alert('Error setting up integration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToNotion = async () => {
    setIsLoading(true);
    try {
      const success = await notionSyncService.syncNoteToNotion(userId, noteId);
      await loadSyncStatus();
      onSyncComplete?.(success);
      
      if (success) {
        alert('Note synced to Notion successfully!');
      } else {
        alert('Failed to sync note to Notion. Check the sync log for details.');
      }
    } catch (error) {
      console.error('Error syncing to Notion:', error);
      alert('Error syncing to Notion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLastSyncStatus = () => {
    const lastSync = syncStatus.find(log => log.note_id === noteId);
    if (!lastSync) return null;
    
    return {
      status: lastSync.sync_status,
      direction: lastSync.sync_direction,
      time: new Date(lastSync.created_at).toLocaleString(),
      error: lastSync.error_message
    };
  };

  const lastSync = getLastSyncStatus();

  if (!isConnected) {
    return (
      <div className="notion-sync-widget p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Notion Sync</h3>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showSetup ? 'Cancel' : 'Setup'}
          </button>
        </div>

        {showSetup ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Notion API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Notion integration token"
                className="w-full px-2 py-1 text-xs border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Workspace ID
              </label>
              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="Enter your Notion workspace ID"
                className="w-full px-2 py-1 text-xs border rounded"
              />
            </div>
            <button
              onClick={handleSetupIntegration}
              disabled={isLoading}
              className="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Connect to Notion'}
            </button>
            <p className="text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Notion Integrations
              </a>
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Connect to Notion to sync your notes
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="notion-sync-widget p-4 border rounded-lg bg-green-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Notion Sync</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600">Connected</span>
        </div>
      </div>

      <button
        onClick={handleSyncToNotion}
        disabled={isLoading}
        className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mb-3"
      >
        {isLoading ? 'Syncing...' : 'Sync to Notion'}
      </button>

      {lastSync && (
        <div className="text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Last sync:</span>
            <span className={lastSync.status === 'success' ? 'text-green-600' : 'text-red-600'}>
              {lastSync.status}
            </span>
          </div>
          <div className="text-gray-500">
            {lastSync.time} ({lastSync.direction})
          </div>
          {lastSync.error && (
            <div className="text-red-500 mt-1">
              Error: {lastSync.error}
            </div>
          )}
        </div>
      )}

      {syncStatus.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">
            View sync history
          </summary>
          <div className="mt-2 max-h-32 overflow-y-auto">
            {syncStatus.slice(0, 5).map((log, index) => (
              <div key={index} className="text-xs text-gray-500 py-1 border-b">
                <div className="flex justify-between">
                  <span>{log.sync_direction}</span>
                  <span className={log.sync_status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {log.sync_status}
                  </span>
                </div>
                <div>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
