// Example integration of NotionSyncWidget into Notes component
// This shows how to add Notion sync functionality to the existing Notes component

import React, { useState, useEffect } from 'react';
import { NotionSyncWidget } from './NotionSyncWidget';
import { auth } from '../src/lib/supabase-client';

// Add this to the Notes component's JSX where you want to show the sync widget
// For example, in the note detail view or as a sidebar widget

const NotesWithNotionSync = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // ... existing Notes component code ...

  return (
    <div className="notes-container">
      {/* Existing Notes UI */}
      
      {/* Add Notion Sync Widget */}
      {selectedNote && currentUser && (
        <div className="notion-sync-sidebar">
          <NotionSyncWidget
            userId={currentUser.id}
            noteId={selectedNote.id}
            onSyncComplete={(success) => {
              if (success) {
                showToast('Note synced to Notion successfully!');
              } else {
                showToast('Failed to sync note to Notion', {
                  label: 'Retry',
                  onClick: () => {
                    // Retry sync logic
                  }
                });
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotesWithNotionSync;
