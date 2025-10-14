import React from 'react';
import { motion } from 'framer-motion';
import { NotificationItem } from '../types';

interface NotificationsProps {
  items?: NotificationItem[];
}

function Notifications({ items = [] }: NotificationsProps) {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your recent app updates and Mira nudges will appear here.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-center mt-4">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {items.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{n.title}</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{n.timestamp.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                {n.action && (
                  <button
                    onClick={n.action.onClick}
                    className="mt-2 px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {n.action.label}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;