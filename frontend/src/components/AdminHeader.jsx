import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const AdminHeader = ({ title, description, icon, action }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4,
        pb: 3,
        borderBottom: '1px solid #e2e8f0'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        {icon && (
          <Avatar 
            sx={{ 
              bgcolor: '#eff6ff', 
              color: '#2563eb',
              width: 48, 
              height: 48,
              border: '1px solid #dbeafe',
            }}
          >
            {icon}
          </Avatar>
        )}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', mb: 0.5 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      {action && (
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default AdminHeader;
