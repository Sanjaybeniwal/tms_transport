import React from 'react';
import { Card, CardContent, Grid, Box, Typography, Avatar } from '@mui/material';

const AdminHeader = ({ title, description, icon, action }) => {
  return (
    <Card
      sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Deep dark-slate premium gradient
        color: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
        <Grid container alignItems="center" spacing={2} justifyContent="space-between">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              {icon && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(37, 99, 235, 0.1)', 
                    color: '#3b82f6',
                    width: 56, 
                    height: 56,
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  {icon}
                </Avatar>
              )}
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
                  {title}
                </Typography>
                {description && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    {description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          {action && (
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
              {action}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AdminHeader;
