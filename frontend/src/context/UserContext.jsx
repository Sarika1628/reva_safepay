import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAccessibility } from './AccessibilityContext';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setFontSize, setContrastMode, setVoiceEnabled, setSlowMode, speak, triggerVisualAlert } = useAccessibility();

  // Load initial demo users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userList = await api.getUsers();
      setUsers(userList);

      const savedUserId = localStorage.getItem('easypay_active_user_id');
      const found = userList.find(u => u.id === Number(savedUserId)) || userList[0];
      if (found) {
        setActiveUser(found);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Sync user's stored accessibility defaults when switching user
  const switchUser = useCallback((userId) => {
    const selected = users.find(u => u.id === Number(userId));
    if (selected) {
      setActiveUser(selected);
      localStorage.setItem('easypay_active_user_id', selected.id);

      if (selected.preferred_font_size) setFontSize(selected.preferred_font_size);
      if (selected.high_contrast) setContrastMode('high-contrast');
      else setContrastMode('normal');
      if (selected.voice_guidance !== undefined) setVoiceEnabled(selected.voice_guidance);
      if (selected.slow_mode !== undefined) setSlowMode(selected.slow_mode);

      speak(`Switched profile to ${selected.name}. ${selected.persona}.`);
      triggerVisualAlert('info', `Active persona: ${selected.name}`);
    }
  }, [users, setFontSize, setContrastMode, setVoiceEnabled, setSlowMode, speak, triggerVisualAlert]);

  // Refetches active user from API
  const refreshUserData = useCallback(async () => {
    if (!activeUser) return;
    try {
      const refreshed = await api.getUser(activeUser.id);
      setActiveUser(refreshed);
      // Also update in users array
      setUsers(prev => prev.map(u => (u.id === refreshed.id ? refreshed : u)));
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [activeUser]);

  // Emergency Freeze
  const emergencyFreeze = useCallback(async (reason) => {
    if (!activeUser) return;
    try {
      const res = await api.freezeWallet(activeUser.id, reason, true);
      await refreshUserData();
      speak('EMERGENCY ALERT! Your wallet has been frozen. Outgoing payments are locked.', true);
      triggerVisualAlert('danger', 'EMERGENCY SOS: Wallet is now LOCKED');
      return res;
    } catch (err) {
      console.error('Freeze failed:', err);
      throw err;
    }
  }, [activeUser, refreshUserData, speak, triggerVisualAlert]);

  // Unfreeze
  const unfreezeWallet = useCallback(async () => {
    if (!activeUser) return;
    try {
      const res = await api.unfreezeWallet(activeUser.id);
      await refreshUserData();
      speak('Wallet unlocked successfully. Simulated payments are available again.');
      triggerVisualAlert('success', 'Wallet UNLOCKED');
      return res;
    } catch (err) {
      console.error('Unfreeze failed:', err);
      throw err;
    }
  }, [activeUser, refreshUserData, speak, triggerVisualAlert]);

  // Reset Balance to ₹15,000
  const resetDemoBalance = useCallback(async () => {
    if (!activeUser) return;
    try {
      const res = await api.resetDemoBalance(activeUser.id);
      await refreshUserData();
      speak('Simulated balance replenished to 15,000 rupees.');
      triggerVisualAlert('success', 'Demo balance reset to ₹15,000');
      return res;
    } catch (err) {
      console.error('Reset balance failed:', err);
      throw err;
    }
  }, [activeUser, refreshUserData, speak, triggerVisualAlert]);

  return (
    <UserContext.Provider
      value={{
        users,
        activeUser,
        loading,
        error,
        switchUser,
        refreshUserData,
        emergencyFreeze,
        unfreezeWallet,
        resetDemoBalance
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
