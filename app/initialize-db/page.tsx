'use client';

import { useState } from 'react';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Credentials {
  admin?: {
    email: string;
    password: string;
  };
  teacher?: {
    email: string;
    password: string;
  };
}

export default function InitializeDBPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const initializeDatabase = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/seed?secret=initialize-database-2025');
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.data?.message || 'Database initialized successfully!');
        setCredentials(data.data?.credentials);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to initialize database');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Database className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Initialize Database</h1>
          <p className="text-gray-600">
            Set up your Fee Management System database with sample data
          </p>
        </div>

        {status === 'idle' && (
          <button
            onClick={initializeDatabase}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Initialize Database
          </button>
        )}

        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Initializing database...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">{message}</p>
                </div>
              </div>
            </div>

            {credentials && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Login Credentials</h3>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Admin Account</p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Email:</span> {credentials.admin?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Password:</span> {credentials.admin?.password}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Teacher Account</p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Email:</span> {credentials.teacher?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Password:</span> {credentials.teacher?.password}
                  </p>
                </div>

                <a
                  href="/login"
                  className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Go to Login
                </a>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Error</p>
                  <p className="text-sm text-red-700">{message}</p>
                </div>
              </div>
            </div>

            <button
              onClick={initializeDatabase}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This will create sample users, classes, and fee structures for testing.
            <br />
            Only run this once on a fresh database.
          </p>
        </div>
      </div>
    </div>
  );
}
