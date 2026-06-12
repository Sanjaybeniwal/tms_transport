import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const DataTable = ({
  columns,
  data = [],
  total = 0,
  page = 0,
  limit = 10,
  loading = false,
  onPageChange,
  onLimitChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterComponent,
  actions
}) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
      <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        {onSearchChange && (
          <TextField
            size="small"
            variant="outlined"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 260 }}
          />
        )}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {filterComponent}
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: 600, position: 'relative' }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <CircularProgress />
          </Box>
        )}

        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.headerName}
                </TableCell>
              ))}
              {actions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id || index}>
                  {columns.map((col) => {
                    const value = row[col.field];
                    return (
                      <TableCell key={col.field} align={col.align || 'left'}>
                        {col.renderCell ? col.renderCell(row) : value}
                      </TableCell>
                    );
                  })}
                  {actions && (
                    <TableCell align="right">
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && onLimitChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={limit}
          page={page}
          onPageChange={(e, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        />
      )}
    </Paper>
  );
};

export default DataTable;
