import React, { useState } from 'react';
import { Box, TextField, MenuItem, Autocomplete, Button, Collapse, Stack, Chip } from '@mui/material';
import { FilterListRounded, ExpandMoreRounded } from '@mui/icons-material';
const date = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
export const today = () => date(new Date());
export function Selector({ label, options = [], value, onChange, getLabel = o => o.name || o.vehicleNumber || o.tripNumber }) {
  return <Autocomplete size="small" sx={{ minWidth: { xs: 0, sm: 190 }, width: '100%', flex: 1 }} options={options} value={options.find(o => String(o.id) === String(value)) || null} getOptionLabel={o => getLabel(o) || String(o.id)} isOptionEqualToValue={(a,b) => a.id === b.id} onChange={(_,v) => onChange(v?.id || '')} renderInput={params => <TextField {...params} label={label} />} />;
}
export default function Filters({ value, onChange, masters }) {
  const [expanded, setExpanded] = useState(false), [period, setPeriod] = useState('all');
  const set = (key, val) => onChange({ ...value, [key]: val });
  const count = ['vehicleId','partyId','ownerId','status','paymentStatus','ownerPaymentStatus'].filter(k => value[k]).length;
  const preset = name => {
    setPeriod(name);
    if (name === 'custom') return;
    const now = new Date(`${today()}T12:00:00+05:30`), start = new Date(now);
    if (name === 'week') start.setDate(now.getDate() - (now.getDay() + 6) % 7);
    if (name === 'month') start.setDate(1);
    if (name === 'year') { start.setFullYear(now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()); start.setMonth(3, 1); }
    onChange({ ...value, startDate: name === 'all' ? '' : date(start), endDate: name === 'all' ? '' : today() });
  };
  return <Box sx={{ mb: 3, p: 2, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
      <TextField select size="small" label="Period" value={period} sx={{ minWidth: 180 }} onChange={e => preset(e.target.value)}>{[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month'],['year','Financial Year'],['custom','Custom Dates']].map(([k,l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}</TextField>
      {period === 'custom' && ['startDate','endDate'].map(k => <TextField key={k} size="small" label={k === 'startDate' ? 'From Date' : 'To Date'} type="date" value={value[k] || ''} InputLabelProps={{ shrink: true }} onChange={e => set(k,e.target.value)} />)}
      <Button startIcon={<FilterListRounded />} endIcon={<ExpandMoreRounded sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />} onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>Vehicle / Company Filters {count ? `(${count})` : ''}</Button>
      {count > 0 && <Chip label="Clear Filters" size="small" onDelete={() => onChange({ startDate: value.startDate, endDate: value.endDate })} />}
    </Stack>
    <Collapse in={expanded}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, pt: 2 }}>
      <Selector label="Vehicle Number" options={masters.vehicles} value={value.vehicleId} onChange={v => set('vehicleId',v)} />
      <Selector label="Company" options={masters.companies} value={value.partyId} onChange={v => set('partyId',v)} />
      <Selector label="Vehicle Owner" options={masters.owners} value={value.ownerId} onChange={v => set('ownerId',v)} />
      <TextField select size="small" label="Trip status" value={value.status || ''} onChange={e => set('status', e.target.value)}>{['','Pending','Running','Completed','Cancelled'].map(s => <MenuItem key={s} value={s}>{s || 'All Trips'}</MenuItem>)}</TextField>
      {['paymentStatus','ownerPaymentStatus'].map(k => <TextField select size="small" key={k} label={k === 'paymentStatus' ? 'Company payment' : 'Owner Payment'} value={value[k] || ''} onChange={e => set(k,e.target.value)}>{[['','All'],['Unpaid','Unpaid'],['Partial','Partially Paid'],['Paid','Paid']].map(([s,l]) => <MenuItem key={s} value={s}>{l}</MenuItem>)}</TextField>)}
    </Box></Collapse>
  </Box>;
}
