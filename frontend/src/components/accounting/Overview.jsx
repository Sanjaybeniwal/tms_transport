import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { labelFor } from './labels';
const rupees = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);
export default function Overview({ stats, onPayment, onExpense, onReport }) {
  const cards = [
    ['companyReceivables','Company Receivables','Payments pending from companies','#236355','receivables'],
    ['ownerPayables','Owner Payables','Payments pending to vehicle owners','#a16523','payables'],
    ['ownedFleetProfit','Owned Fleet Profit','Income after vehicle expenses','#236355','vehicle-pl'],
    ['brokerageNetProfit','Brokerage Earnings','Net profit from completed loads','#465b9c','brokerage-profit']
  ];
  return <>
    <Typography variant="h6" mb={1.5}>Quick Actions</Typography>
    <Grid container spacing={2} sx={{ mb: 3 }}>{[
      ['Receive Company Payment','Record a collection',ArrowDownwardRounded,() => onPayment('company_payment')],
      ['Pay Vehicle Owner','Record an advance or balance payment',ArrowUpwardRounded,() => onPayment('owner_payment')],
      ['Add Expense','Fuel, tolls, repairs or other costs',ReceiptLongRounded,onExpense]
    ].map(([title,desc,Icon,action]) => <Grid item xs={12} md={4} key={title}><Button onClick={action} fullWidth variant="outlined" sx={{ p: 2, justifyContent: 'flex-start', textAlign: 'left', gap: 1.5, height: '100%', bgcolor: 'white', borderColor: 'divider' }}><Box sx={{ p: 1, bgcolor: '#e9f2ed', borderRadius: 2, display: 'flex' }}><Icon /></Box><Box><Typography fontWeight={700}>{title}</Typography><Typography variant="caption" color="text.secondary">{desc}</Typography></Box></Button></Grid>)}</Grid>
    <Typography variant="h6" mb={1.5}>Account Summary</Typography>
    <Grid container spacing={2}>{cards.map(([key,title,desc,color,report]) => <Grid item xs={12} sm={6} key={key}><Card variant="outlined"><CardContent><Typography color="text.secondary" variant="body2">{title}</Typography><Typography variant="h4" fontWeight={750} color={String(stats[key]).startsWith('-') ? 'error.main' : color} sx={{ my: 1 }}>{rupees(stats[key])}</Typography><Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}><Typography variant="caption" color="text.secondary">{desc}</Typography><Button size="small" endIcon={<ArrowForwardRounded />} onClick={() => onReport(report)}>View Account</Button></Stack></CardContent></Card></Grid>)}</Grid>
    <Accordion disableGutters elevation={0} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography fontWeight={600}>More Details · Collections, POD & Commission</Typography></AccordionSummary><AccordionDetails><Grid container spacing={2}>{Object.entries(stats).filter(([k]) => ![...cards.map(c => c[0]),'unclassifiedTrips'].includes(k)).map(([key,val]) => <Grid item xs={12} sm={6} md={4} key={key}><Typography variant="caption" color="text.secondary">{labelFor(key)}</Typography><Typography fontWeight={700}>{typeof val === 'number' ? val : rupees(val)}</Typography></Grid>)}</Grid><Typography variant="body2" color="text.secondary" mt={2}>Commission is calculated after owner freight and expenses. The full company collection is not your income.</Typography></AccordionDetails></Accordion>
  </>;
}
