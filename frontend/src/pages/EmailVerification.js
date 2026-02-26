import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        
        if (response.data.token) {
          login(response.data.token, response.data.user);
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to chat...');
          setTimeout(() => navigate('/chat'), 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, login, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={3}
    >
      {status === 'verifying' && (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Verifying your email...</Typography>
        </>
      )}
      
      {status === 'success' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      {status === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default EmailVerification;
