import React from 'react';
import { Landing } from './Landing';

export const AuthGuard = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Landing />;
};
