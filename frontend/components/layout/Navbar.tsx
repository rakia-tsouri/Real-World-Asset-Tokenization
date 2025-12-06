'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Bell, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '@/lib/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      const notifs = response.data.data || [];
      setNotifications(notifs.slice(0, 5));
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold gradient-text">Carthage Gate</span>
              <span className="text-xs text-foreground-subtle">Premium Assets</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/marketplace"
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Marketplace
              </Link>
              <Link
                href="/my-assets"
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                My Assets
              </Link>
              <Link
                href="/portfolio"
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Portfolio
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin/kyc"
                  className="text-primary hover:text-primary-hover px-4 py-2 rounded-lg text-sm font-medium border border-primary-border bg-primary-muted transition-all"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-foreground-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-all"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-danger rounded-full pulse-glow">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-surface-elevated rounded-xl shadow-2xl border border-border z-50">
                      <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-accent hover:text-accent-hover transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-foreground-subtle">
                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => !notif.isRead && markAsRead(notif._id)}
                              className={`p-4 border-b border-border cursor-pointer hover:bg-surface-hover transition-colors ${
                                !notif.isRead ? 'bg-primary-muted border-l-2 border-l-primary' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!notif.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0 pulse-glow"></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {notif.title}
                                  </p>
                                  <p className="text-sm text-foreground-muted mt-1">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-foreground-subtle mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(notif.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-border">
                          <Link
                            href="/notifications"
                            className="block text-center text-sm text-accent hover:text-accent-hover py-2 transition-colors"
                            onClick={() => setShowNotifications(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile */}
                <Link href="/profile" className="hidden lg:flex items-center space-x-2 text-foreground-muted hover:text-foreground hover:bg-surface-hover px-3 py-2 rounded-lg transition-all">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="hidden lg:flex items-center space-x-1 text-danger hover:bg-danger-muted px-3 py-2 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden p-2 text-foreground-muted hover:text-foreground hover:bg-surface-hover rounded-lg"
                >
                  {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-foreground-muted hover:text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-white hover:bg-primary-hover px-5 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && user && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard" className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg transition-all">
                Dashboard
              </Link>
              <Link href="/marketplace" className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg transition-all">
                Marketplace
              </Link>
              <Link href="/my-assets" className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg transition-all">
                My Assets
              </Link>
              <Link href="/portfolio" className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg transition-all">
                Portfolio
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin/kyc" className="text-primary hover:text-primary-hover px-4 py-2 rounded-lg border border-primary-border bg-primary-muted transition-all">
                  Admin Panel
                </Link>
              )}
              <Link href="/profile" className="text-foreground-muted hover:text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg transition-all">
                Profile
              </Link>
              <button onClick={logout} className="text-danger hover:bg-danger-muted px-4 py-2 rounded-lg text-left transition-all">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}