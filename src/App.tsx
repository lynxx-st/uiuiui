import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import {} from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import RTLLayout from './layouts/rtl';
import {
  ChakraProvider,
  // extendTheme
} from '@chakra-ui/react';
import initialTheme from './theme/theme'; //  { themeGreen }
import { useState } from 'react';
import { useEffect } from 'react';
import { getSession } from 'lib/api';
import supabase from 'lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
// Chakra imports

export default function Main() {
  // eslint-disable-next-line
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    getSession().then((s) => setAuthed(!!s));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setAuthed(true);
        navigate('/admin', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        setAuthed(false);
        navigate('/auth/sign-in', { replace: true });
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  return (
    <ChakraProvider theme={currentTheme}>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route
          path="admin/*"
          element={
            authed ? (
              <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
            ) : (
              <Navigate to="/auth/sign-in" replace />
            )
          }
        />
        <Route
          path="rtl/*"
          element={
            <RTLLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />
        <Route path="/" element={<Navigate to={authed ? '/admin' : '/auth/sign-in'} replace />} />
      </Routes>
    </ChakraProvider>
  );
}
