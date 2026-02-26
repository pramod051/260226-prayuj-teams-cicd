import React, { useRef, useEffect, useState } from 'react';
import { Box, Fab } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { scrollToBottom, scrollToTop, isScrolledToBottom, isScrolledToTop } from '../utils/scrollUtils';

const ScrollContainer = ({ children, autoScroll = true, showScrollButtons = true, ...props }) => {
  const scrollRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const element = scrollRef.current;
    setShowScrollDown(!isScrolledToBottom(element));
    setShowScrollUp(!isScrolledToTop(element));
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollToBottom(scrollRef.current);
    }
  }, [children, autoScroll]);

  return (
    <Box sx={{ position: 'relative', height: '100%', ...props.sx }}>
      <Box
        ref={scrollRef}
        sx={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4caf50',
            borderRadius: '3px',
            '&:hover': {
              background: '#388e3c',
            },
          },
        }}
        {...props}
      >
        {children}
      </Box>

      {showScrollButtons && (
        <>
          {showScrollUp && (
            <Fab
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                opacity: 0.8,
                '&:hover': { opacity: 1 },
              }}
              onClick={() => scrollToTop(scrollRef.current)}
            >
              <KeyboardArrowUp />
            </Fab>
          )}

          {showScrollDown && (
            <Fab
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 1000,
                opacity: 0.8,
                '&:hover': { opacity: 1 },
              }}
              onClick={() => scrollToBottom(scrollRef.current)}
            >
              <KeyboardArrowDown />
            </Fab>
          )}
        </>
      )}
    </Box>
  );
};

export default ScrollContainer;
