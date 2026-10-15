import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Checkbox, Grid, MenuItem, Stack, TextField, Typography, Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import Overview from '../components/accounting/Overview';
import { labelFor, moneyFields, transactionLabels } from '../components/accounting/labels';
import StatementPreview from '../components/accounting/StatementPreview';
import { reportStatement, tripStatement } from '../utils/accountingStatement';
import API from '../services/api';
import AdminHeader from '../components/AdminHeader';
import DataTable from '../components/DataTable';
import Filters, { Selector, today } from '../components/accounting/Filters';
import { accounting as api } from '../services/accounting';
import { AuthContext } from '../context/AuthContext';
const labels = { 'company-accounts':'Company Accounts', 'owner-accounts':'Vehicle Owner Accounts', 'vehicle-ledger':'Owned Vehicle Ledger', 'vehicle-pl':'Vehicle Profit & Loss', expenses:'Vehicle Expense Report', income:'Vehicle Income Report', 'company-ledger':'Company Ledger', 'owner-ledger':'Vehicle Owner Ledger', 'brokerage-profit':'Brokerage Profit Report', settlements:'Load-wise Settlement Report', receivables:'Outstanding Receivables', payables:'Outstanding Payables', payments:'Payment History', 'driver-advances':'Driver Advance Report', 'pod-pending':'POD Pending Report' };
const titleCase = labelFor;
const rupees = v => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(v || 0);
const amountFields = ['companyFreight','vehicleFreight','additionalIncome','companyDeduction','ownerDeduction','brokerDeduction','commissionExpense'];
const summaryFields = ['companyBilled','companyCollected','companyOutstanding','ownerFreight','ownerAdvances','ownerPayments','ownerOutstanding','expectedMargin','earnedMargin','commissionReceived','commissionReceivable','ownedIncome','totalExpenses','ownedProfit','netBrokerageProfit'];
const columnsByReport = {
  'company-accounts':['name','contact','totalLoads','totalFreight','additionalIncome','deductions','totalBilled','received','outstanding','overdue','pendingPODs','expectedBrokerage','earnedBrokerage'],
  'owner-accounts':['name','contact','totalLoads','totalFreight','advances','additionalPayments','deductions','settled','remainingPayable','pendingPODs'],
  'vehicle-ledger':['date','vehicle','tripNumber','type','amount','cashAmount','runningBalance','remarks'],
  'vehicle-pl':['vehicle','totalTrips','freightIncome','additionalIncome','fuelExpenses','tollExpenses','driverAdvances','driverSalary','advanceAdjustments','maintenanceExpenses','otherExpenses','totalExpenses','netProfit','incomeReceived','incomeOutstanding'],
  expenses:['date','vehicle','tripNumber','category','amount','paymentMethod','recipient','transactionStatus'],
  income:['tripNumber','vehicle','company','source','destination','freightIncome','additionalIncome','companyCollected','companyOutstanding'],
  'company-ledger':['date','company','tripNumber','vehicle','type','amount','runningBalance','reference','remarks'],
  'owner-ledger':['date','owner','tripNumber','vehicle','type','amount','runningBalance','reference','remarks'],
  'brokerage-profit':['tripNumber','company','owner','companyBilled','ownerFreight','grossMargin','expectedMargin','earnedMargin','commissionReceived','commissionReceivable','totalExpenses','netBrokerageProfit'],
  settlements:['tripNumber','vehicle','company','owner','companyBilled','companyCollected','companyOutstanding','ownerFreight','ownerAdvances','ownerPayments','ownerOutstanding','paymentStatus','ownerPaymentStatus'],
  receivables:['company','tripNumber','companyBilled','companyCollected','companyOutstanding','dueDate','overdue','podStatus'],
  payables:['owner','ownerContact','vehicle','tripNumber','ownerFreight','ownerAdvances','ownerPayments','ownerOutstanding','ownerDueDate'],
  payments:['date','tripNumber','company','owner','category','amount','paymentMethod','paymentReference','transactionStatus'],
  'driver-advances':['date','driver','vehicle','tripNumber','amount','adjusted','unadjusted','transactionStatus'],
  'pod-pending':['tripNumber','company','vehicle','podStatus','paymentEligibility']
};
function Table({ rows, fields, ...props }) {
  return <DataTable {...props} data={rows} columns={fields.map(field => ({ field, headerName: titleCase(field), renderCell: row => field==='attachment' && String(row[field] || '').startsWith('https://') ? <a href={row[field]} target="_blank" rel="noreferrer">View receipt</a> : moneyFields.has(field) && row[field] != null ? <Typography component="span" fontSize="inherit" fontWeight={600} color={String(row[field]).startsWith('-') ? 'error.main' : 'inherit'}>{rupees(row[field])}</Typography> : transactionLabels[row[field]] || (typeof row[field] === 'boolean' ? row[field] ? 'Yes' : 'No' : String(row[field] ?? '—')) }))} />;
}
export default function Accounting() {
  const { section = 'dashboard' } = useParams();
  const navigate = useNavigate(), { user } = useContext(AuthContext);
  const allowed = ['Super Admin','Admin','Manager','Accountant'].includes(user?.role);
  const [masters,setMasters] = useState({}), [filters,setFilters] = useState({}), [rows,setRows] = useState([]), [stats,setStats] = useState(null), [total,setTotal] = useState(0), [page,setPage] = useState(0), [limit,setLimit] = useState(25), [search,setSearch] = useState(''), [sort,setSort] = useState(''), [order,setOrder] = useState('ASC');
  const [report,setReport] = useState('company-accounts'), [loading,setLoading] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState(''), [unclassified,setUnclassified] = useState(0), [refresh,setRefresh] = useState(0);
  const [reportDetailed,setReportDetailed] = useState(false);
  const [detailTab,setDetailTab] = useState(0), [paymentKind,setPaymentKind] = useState('company_payment');
  const [voucher,setVoucher] = useState(null), [printDocument,setPrintDocument] = useState(null);
  const [dialog,setDialog] = useState(''), [selected,setSelected] = useState(''), [detail,setDetail] = useState(null), [form,setForm] = useState({}), [busy,setBusy] = useState(false), [confirm,setConfirm] = useState(null), [reason,setReason] = useState('');
  const params = Object.fromEntries(Object.entries({ ...filters, page:page+1, limit, search, sortBy:sort, sortOrder:order, ...(section === 'own-vehicles' ? {classification:'Own'} : section === 'brokerage' ? {classification:'Market'} : {}) }).filter(([,v]) => v !== '' && v !== undefined));
  const reload = () => setRefresh(v => v+1);
  useEffect(() => { if (!allowed) return; let active = true; api.masters().then(r => { if(active) setMasters(r.data.data); }).catch(e => { if(active) setError(e.response?.data?.message || e.message); }); return () => {active=false;}; },[allowed,refresh]);
  useEffect(() => { setPage(0); setSort(''); },[section,report,filters,search]);
  useEffect(() => {
    if(!allowed) return;
    let active=true; setLoading(true); setError('');
    const request = section === 'dashboard' ? api.dashboard(params) : section === 'reports' ? api.report(report,params) : api.loads(params);
    request.then(r => { if(!active) return; if(section === 'dashboard') {setStats(r.data.data); setUnclassified(r.data.data.unclassifiedTrips);} else {setRows(r.data.data);setTotal(r.data.total);setUnclassified(r.data.unclassifiedTrips);} }).catch(e => {if(active) {setError(e.response?.data?.message || e.message);setRows([]);setStats(null);}}).finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[allowed,section,report,JSON.stringify(params),refresh]);
  async function run(fn, close=true, message='Entry saved successfully.') {setBusy(true);setError('');try {await fn();setNotice(message);reload();if(close)setDialog('');return true;}catch(e){setError(e.response?.data?.message || e.message);return false;}finally{setBusy(false);}}
  async function open(id, mode='detail', kind='company_payment') {
    setBusy(true);setError('');try {const r=await api.load(id), d=r.data.data;setSelected(id);setDetail(d);setDetailTab(0);setDialog(mode);
      if(mode === 'terms')setForm({ classification:d.account?.classification || (masters.vehicles?.find(v => v.id === d.trip.vehicleId)?.classification === 'Market' ? 'Market' : 'Own'), ...Object.fromEntries(amountFields.map(k => [k,d.account?.[k] || (k === 'companyFreight' ? d.trip.freightAmount : '0.00')])), dueDate:d.account?.dueDate || today(),ownerDueDate:d.account?.ownerDueDate || today(),podRequired:d.account?.podRequired ?? true,companyReference:d.account?.companyReference || '',material:d.account?.material || '',remarks:d.account?.remarks || '',version:d.account?.version, reconcileLegacy:Boolean(d.account) });
      if(mode === 'payment')setForm({kind,amount:'',date:today(),paymentMethod:'Cash',paymentReference:'',remarks:'',idempotencyKey:crypto.randomUUID()});
      if(mode === 'pod')setForm({podStatus:d.trip.podStatus,podSubmissionDate:d.account?.podSubmissionDate || '',podDocument:d.account?.podDocument || '',version:d.account?.version});
    }catch(e){setError(e.response?.data?.message || e.message);}finally{setBusy(false);}
  }
  const change = (key,value) => setForm(f=>{ const next={...f,[key]:value};if(key==='classification'&&value==='Own'){next.vehicleFreight='0.00';next.ownerDeduction='0.00';}if(key==='kind'){delete next.expenseHeadId;delete next.advanceId;delete next.expenseId;}return next;});
  const field = (key, options={}) => <TextField key={key} fullWidth margin="dense" label={titleCase(key)} value={form[key] ?? ''} onChange={e=>change(key,e.target.value)} {...options} />;
  const exportCSV = () => run(async()=>{const r=await api.export(report,params);const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=`${report}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},false,'Report downloaded successfully.');
  async function previewStatement(source='report') {
    setBusy(true);setError('');
    try {
      const [contactResponse, reportResponse] = await Promise.all([
        API.settings.getPublicContactInfo(),
        source==='report' ? api.report(report,{...params,format:'print'}) : Promise.resolve(null)
      ]);
      const {companyName,address,phone,email} = contactResponse.data.data;
      const contact = {companyName,address,phone,email};
      let document;
      if(source==='report') {
        const subject = masters.companies?.find(c=>c.id===filters.partyId)?.name || masters.owners?.find(o=>o.id===filters.ownerId)?.name || masters.vehicles?.find(v=>v.id===filters.vehicleId)?.vehicleNumber || 'All Accounts';
        const details = [filters.status&&`Trip Status: ${filters.status}`,filters.paymentStatus&&`Company Payment: ${filters.paymentStatus}`,filters.ownerPaymentStatus&&`Owner Payment: ${filters.ownerPaymentStatus}`,search&&`Search: ${search}`].filter(Boolean);
        document=reportStatement(report,labels[report],reportResponse.data.data,fields,{subject,details,startDate:filters.startDate,endDate:filters.endDate});
        if(reportResponse.data.unclassifiedTrips)document.note+=` ${reportResponse.data.unclassifiedTrips} ${reportResponse.data.unclassifiedTrips===1?'trip awaiting accounting setup is':'trips awaiting accounting setup are'} excluded.`;
      } else document=tripStatement(detail,masters,source==='voucher'?voucher:null);
      setPrintDocument({...document,contact});
    }catch(e){setError(e.response?.data?.message || e.message);}finally{setBusy(false);}
  }
  const compactFields = { 'company-accounts':['name','totalLoads','totalBilled','received','outstanding'], 'owner-accounts':['name','totalLoads','totalFreight','settled','remainingPayable'], 'vehicle-pl':['vehicle','totalTrips','totalIncome','totalExpenses','netProfit'], 'brokerage-profit':['tripNumber','company','expectedMargin','earnedMargin','netBrokerageProfit'], settlements:['tripNumber','vehicle','companyOutstanding','ownerOutstanding'], receivables:['company','tripNumber','companyOutstanding','dueDate'], payables:['owner','vehicle','ownerOutstanding','ownerDueDate'] };
  const fields = section === 'reports' ? (!reportDetailed && compactFields[report] || columnsByReport[report]) : section === 'own-vehicles' ? ['tripNumber','vehicle','company','companyOutstanding','ownedProfit'] : ['tripNumber','vehicle','company','companyOutstanding','ownerOutstanding','expectedMargin'];
  const choosePayment = kind => {setPaymentKind(kind);setSelected('');setDialog('choose-payment');};
  const goReport = name => {setReport(name);navigate('/admin/accounting/reports');};
  const addExpense = () => {setForm({kind:'expense',amount:'',date:today(),paymentMethod:'Cash',idempotencyKey:crypto.randomUUID()});setDialog('vehicle-expense');};
  if(!allowed)return <Alert severity="error">Accounting access requires an Admin, Manager, or Accountant role.</Alert>;
  return <>
    <AdminHeader title={section === 'dashboard' ? 'Accounting Overview' : section === 'reports' ? 'Accounts & Reports' : section === 'own-vehicles' ? 'Owned Vehicle Accounts' : 'Market Vehicle Accounts'} description="Payments, expenses and earnings in one place." action={<Button variant="contained" startIcon={<AddRounded />} onClick={()=>{setDialog('enroll');setSelected('');}}>Add Trip Account</Button>} />
    {error && <Alert severity="error" sx={{mb:2}} onClose={()=>setError('')}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{mb:2}} onClose={()=>setNotice('')}>{notice}</Alert>}
    {unclassified > 0 && <Alert severity="info" sx={{mb:2}} action={<Button color="inherit" onClick={()=>{setDialog('enroll');setSelected('');}}>Get Started</Button>}>{unclassified} {unclassified===1?'trip needs':'trips need'} accounting setup. Review existing payments before adding them.</Alert>}
    <Tabs value={['dashboard','own-vehicles','brokerage','reports'].includes(section) ? section : 'dashboard'} onChange={(_,path)=>navigate(`/admin/accounting/${path}`)} variant="scrollable" scrollButtons="auto" sx={{mb:2,borderBottom:1,borderColor:'divider'}}>{[['dashboard','Overview'],['own-vehicles','Owned Vehicles'],['brokerage','Market Vehicles'],['reports','Accounts & Reports']].map(([path,label])=><Tab key={path} value={path} label={label} />)}</Tabs>
    <Filters value={filters} onChange={setFilters} masters={masters} />
    {loading && section==='dashboard' && <CircularProgress aria-label="Loading accounts" />}
    {section==='dashboard' && stats && <Overview stats={stats} onPayment={choosePayment} onExpense={()=>setDialog('choose-expense')} onReport={goReport} />}
    {section!=='dashboard' && <>
      {section==='reports' && <Stack direction="row" gap={2} flexWrap="wrap" sx={{mb:2}}><TextField select label="Select Report" value={report} onChange={e=>setReport(e.target.value)} sx={{minWidth:280}}>{Object.entries(labels).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField><FormControlLabel control={<Checkbox checked={reportDetailed} onChange={e=>setReportDetailed(e.target.checked)} />} label="Show All Details" /><Button disabled={busy||loading} onClick={exportCSV}>Export CSV</Button><Button disabled={busy||loading} onClick={()=>previewStatement()}>Print / Save PDF</Button></Stack>}
      <Accordion elevation={0} disableGutters sx={{mb:2,'&:before':{display:'none'}}}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Sort Records</Typography></AccordionSummary><AccordionDetails><Stack direction="row" gap={2}><TextField select size="small" label="Sort By" value={sort} onChange={e=>setSort(e.target.value)} sx={{minWidth:180}}><MenuItem value="">Default order</MenuItem>{fields.map(k=><MenuItem key={k} value={k}>{titleCase(k)}</MenuItem>)}</TextField><Button onClick={()=>setOrder(v=>v==='ASC'?'DESC':'ASC')}>{order==='ASC'?'Ascending':'Descending'}</Button></Stack></AccordionDetails></Accordion>
      <Box className="accounting-print"><Typography variant="h6">{section==='reports'?labels[report]:'Trip Accounts'}</Typography><Typography variant="caption">{filters.startDate || 'Beginning'} — {filters.endDate || 'Current'} · {masters.owners?.find(o=>o.id===filters.ownerId)?.name || ''} {masters.companies?.find(o=>o.id===filters.partyId)?.name || ''}</Typography>
      <Table rows={rows} fields={fields} total={total} page={page} limit={limit} loading={loading} error={Boolean(error)} onRetry={reload} onPageChange={setPage} onLimitChange={v=>{setLimit(v);setPage(0);}} searchQuery={search} onSearchChange={setSearch} actions={section!=='reports' ? row=><Button disabled={busy} onClick={()=>open(row.id)}>Open Account</Button> : report==='expenses' ? row=><Button disabled={Boolean(row.voidedAt)||busy} onClick={()=>{if(row.tripId)open(row.tripId);else {setReason('');setConfirm({vehicleId:row.vehicleId,id:row.transactionId});}}}>Review / reverse</Button> : undefined} />
      <Typography variant="caption">PDF and CSV exports include all matching records. Ledger running balances include transactions before the date range.</Typography></Box>
    </>}
    <Dialog open={Boolean(dialog)} onClose={()=>!busy&&setDialog('')} fullWidth maxWidth={dialog==='detail'?'lg':'sm'}>
      <DialogTitle>{({voucher:'Payment Voucher',detail:'Trip Account',terms:'Trip Freight',payment:transactionLabels[form.kind] || 'Record Payment',pod:'Proof of Delivery',enroll:'Set Up Trip Account','choose-payment':'Record Payment','choose-expense':'Choose Expense Type',classify:'Classify Vehicle','vehicle-expense':'Vehicle Expense'})[dialog]} {detail&&['detail','terms','payment','pod'].includes(dialog)?`· ${detail.trip.tripNumber}`:''}</DialogTitle>
      <DialogContent dividers>
        {error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}
        {dialog==='choose-expense'&&<Stack gap={2}><Button variant="outlined" fullWidth sx={{p:2,justifyContent:'flex-start'}} onClick={()=>choosePayment('expense')}>Trip Expense · Fuel, Tolls, Loading</Button><Button variant="outlined" fullWidth sx={{p:2,justifyContent:'flex-start'}} onClick={addExpense}>Vehicle Expense · Repairs, Insurance, Permits</Button></Stack>}
        {['enroll','choose-payment'].includes(dialog) && <><Typography color="text.secondary" variant="body2" mb={2}>{dialog==='enroll'?'Select a trip, then review its freight and existing payments.':'Select the trip for this entry.'}</Typography><Selector label="Select Trip / Vehicle" options={masters.trips} value={selected} onChange={setSelected} getLabel={t=>`${t.tripNumber} · ${masters.vehicles?.find(v=>v.id===t.vehicleId)?.vehicleNumber || ''} · ${masters.companies?.find(c=>c.id===t.partyId)?.name || ''}`} />{dialog==='enroll'&&<Button sx={{mt:2}} onClick={()=>navigate('/admin/trips')}>Create New Trip →</Button>}</>}
        {dialog==='classify' && <><Selector label="Vehicle" options={masters.vehicles} value={form.vehicleId} onChange={v=>change('vehicleId',v)} />{field('classification',{select:true,children:['Own','Market'].map(s=><MenuItem value={s} key={s}>{s}</MenuItem>)})}</>}
        {dialog==='terms' && <>
          <Typography variant="body2" color="text.secondary" mb={2}>Enter the freight amounts. Balances will be calculated automatically.</Typography>
          {!detail?.account && field('classification',{select:true,helperText:'The vehicle ownership type will be saved with this setup.',children:[['Own','Owned Vehicle'],['Market','Market Vehicle']].map(([k,l])=><MenuItem key={k} value={k}>{l}</MenuItem>)})}
          {field('companyFreight',{required:true,inputProps:{inputMode:'decimal'}})}
          {form.classification==='Market'&&field('vehicleFreight',{required:true,inputProps:{inputMode:'decimal'}})}
          {field('dueDate',{type:'date',InputLabelProps:{shrink:true}})}
          {form.classification==='Market'&&field('ownerDueDate',{type:'date',InputLabelProps:{shrink:true}})}
          <Accordion elevation={0} disableGutters sx={{my:2}}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Extra Charges, Deductions & Material Details (Optional)</Typography></AccordionSummary><AccordionDetails sx={{px:0}}>{amountFields.filter(k=>!['companyFreight','vehicleFreight'].includes(k)&&(form.classification==='Market'||k!=='ownerDeduction')).map(k=>field(k,{inputProps:{inputMode:'decimal'},helperText:k==='commissionExpense'?'Commission paid to another person.':undefined}))}{['companyReference','material','remarks'].map(k=>field(k))}</AccordionDetails></Accordion>
          <FormControlLabel control={<Checkbox checked={form.podRequired||false} onChange={e=>change('podRequired',e.target.checked)} />} label="The company requires POD / a delivery receipt" />
          {!detail?.account&&<Box sx={{p:2,mt:2,bgcolor:'#f5f8f5',borderRadius:2}}><Typography variant="subtitle2">Review Existing Payments</Typography><Typography variant="body2" sx={{my:1}}>Existing trip advance: {rupees(detail?.trip.advance)} · Payment entries: {detail?.incomes?.length || 0}</Typography><Typography variant="caption" color="text.secondary">Do not record existing payments again. The legacy trip advance is not automatically posted as a payment.</Typography><FormControlLabel control={<Checkbox checked={form.reconcileLegacy||false} onChange={e=>change('reconcileLegacy',e.target.checked)} />} label="I have reviewed the existing payments" /></Box>}
        </>}
        {['payment','vehicle-expense'].includes(dialog) && <>
          {dialog==='payment'&&detail?.totals&&['company_payment','owner_payment','owner_advance'].includes(form.kind)&&<Alert severity="info" sx={{mb:2}}>{form.kind==='company_payment'?'Outstanding Receivables':'Outstanding Payables'}: <strong>{rupees(detail.totals[form.kind==='company_payment'?'companyOutstanding':'ownerOutstanding'])}</strong></Alert>}
          {dialog==='vehicle-expense' && <Selector label="Select Owned Vehicle" options={masters.vehicles?.filter(v=>v.classification==='Own')} value={form.vehicleId} onChange={v=>change('vehicleId',v)} />}
          {dialog==='payment' && !detail?.account && <Alert severity="info" action={<Button onClick={()=>open(selected,'terms')}>Add Freight Details</Button>}>Add freight details for this trip before recording payments.</Alert>}
          {dialog==='payment' && <>
          {field('kind',{select:true,children:Object.entries(transactionLabels).filter(([k])=>detail?.account?.classification==='Market'?!k.startsWith('driver_'):!k.startsWith('owner_')).map(([k,l])=><MenuItem key={k} value={k}>{l}</MenuItem>)})}
          </>}
          {field('amount',{required:true,inputProps:{inputMode:'decimal'}})}{field('date',{type:'date',InputLabelProps:{shrink:true}})}
          {field('paymentMethod',{select:true,children:['Cash','UPI','Bank','Cheque'].map(k=><MenuItem key={k} value={k}>{k}</MenuItem>)})}
          {form.kind!=='driver_adjustment'&&field('paymentReference',{helperText:form.paymentMethod!=='Cash'?'A bank / UPI reference is required.':'Optional for cash payments.'})}
          {form.kind==='expense'&&<Selector label="Expense Category" options={masters.expenseHeads} value={form.expenseHeadId} onChange={v=>change('expenseHeadId',v)} />}
          {form.kind==='driver_adjustment'&&<><Alert severity="info">Record the full salary or trip expense once. Adjustment reduces the outstanding advance without adding a second expense.</Alert><Selector label="Advance" options={detail.advances.filter(a=>!a.voidedAt)} value={form.advanceId} onChange={v=>change('advanceId',v)} getLabel={a=>`#${a.id} · ${a.date} · ${rupees(a.amount)}`} /><Selector label="Salary / trip settlement expense" options={detail.expenses.filter(a=>!a.voidedAt)} value={form.expenseId} onChange={v=>change('expenseId',v)} getLabel={a=>`#${a.id} · ${a.expenseHead?.name} · ${rupees(a.amount)}`} /></>}
          <Accordion elevation={0} disableGutters sx={{mt:2}}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Notes & Receipt Details (Optional)</Typography></AccordionSummary><AccordionDetails sx={{px:0}}>{form.kind!=='company_payment'&&field('recipient')}{field('attachment',{helperText:'Optional HTTPS link to the receipt.'})}{field('remarks')}</AccordionDetails></Accordion>
        </>}
        {dialog==='pod'&&<>{field('podStatus',{select:true,children:['Pending','Received','Approved'].map(k=><MenuItem key={k} value={k}>{k}</MenuItem>)})}{field('podSubmissionDate',{type:'date',InputLabelProps:{shrink:true}})}{field('podDocument',{label:'POD document URL (HTTPS)'})}<Alert severity="info">POD approval changes payment eligibility. Record collections separately.</Alert></>}
        {dialog==='voucher'&&voucher&&<Box className="accounting-print"><Typography variant="h5">BUTS Express · Payment Voucher</Typography><Typography>Trip {detail?.trip.tripNumber}</Typography>{Object.entries(voucher).filter(([k,v])=>['id','date','amount','totalAmount','kind','paymentMethod','paymentReference','recipient','remarks','createdBy','createdAt','voidReason'].includes(k)&&v).map(([k,v])=><Typography key={k}><strong>{titleCase(k)}:</strong> {String(v)}</Typography>)}{voucher.attachment?.startsWith('https://')&&<Button component="a" href={voucher.attachment} target="_blank" rel="noreferrer">View Bill / Receipt</Button>}<Typography sx={{mt:4}}>Authorized signature: ____________________</Typography><Button className="no-print" disabled={busy} onClick={()=>previewStatement('voucher')}>Print Voucher / Save PDF</Button></Box>}
        {dialog==='detail'&&detail&&<Box className="accounting-print">
          <Typography variant="h6">{masters.vehicles?.find(v=>v.id===detail.trip.vehicleId)?.vehicleNumber} · {masters.companies?.find(c=>c.id===detail.trip.partyId)?.name}</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>{detail.account?.classification==='Market'?`Vehicle owner: ${masters.owners?.find(o=>o.id===detail.account.ownerId)?.name || '—'}`:'Owned Vehicle'} · {detail.trip.status}</Typography>
          {!detail.account?<Alert severity="info" action={<Button onClick={()=>open(selected,'terms')}>Add Freight Details</Button>}>Accounting has not been set up for this trip yet.</Alert>:<>
            <Grid container spacing={2} sx={{mb:2}}>{['companyOutstanding',...(detail.account.classification==='Market'?['ownerOutstanding','expectedMargin']:['ownedProfit'])].map(k=><Grid item xs={12} sm={detail.account.classification==='Market'?4:6} key={k}><Box sx={{p:2,bgcolor:'#f1f6f2',borderRadius:2}}><Typography variant="body2" color="text.secondary">{titleCase(k)}</Typography><Typography variant="h5" fontWeight={700}>{rupees(detail.totals[k])}</Typography></Box></Grid>)}</Grid>
            <Stack direction="row" gap={1} className="no-print" flexWrap="wrap" sx={{mb:2}}>
              <Button variant="contained" disabled={detail.trip.status==='Cancelled'} onClick={()=>open(selected,'payment','company_payment')}>Receive Company Payment</Button>
              {detail.account.classification==='Market'&&<Button variant="outlined" disabled={detail.trip.status==='Cancelled'} onClick={()=>open(selected,'payment','owner_payment')}>Pay Vehicle Owner</Button>}
              <Button disabled={detail.trip.status==='Cancelled'} onClick={()=>open(selected,'payment','expense')}>Add Expense</Button>
            </Stack>
            <Accordion elevation={0} disableGutters sx={{mb:2}}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Freight, Payments & Earnings Details</Typography></AccordionSummary><AccordionDetails><Grid container spacing={2}>{summaryFields.filter(k=>detail.account.classification==='Market'?!['ownedIncome','ownedProfit'].includes(k):!['ownerFreight','ownerAdvances','ownerPayments','ownerOutstanding','expectedMargin','earnedMargin','commissionReceived','commissionReceivable','netBrokerageProfit'].includes(k)).map(k=><Grid item xs={6} md={4} key={k}><Typography variant="caption" color="text.secondary">{titleCase(k)}</Typography><Typography fontWeight={700}>{rupees(detail.totals[k])}</Typography></Grid>)}</Grid></AccordionDetails></Accordion>
          </>}
          <Tabs value={detailTab} onChange={(_,v)=>setDetailTab(v)} variant="scrollable" scrollButtons="auto" sx={{mb:2}} className="no-print"><Tab label="Payment history" /><Tab label="Expenses & Driver" /><Tab label="Trip Details" /></Tabs>
          {detailTab<2&&(()=>{
            const resources=detailTab===0?['incomes','entries']:['expenses','diesels','advances'];
            const history=resources.flatMap(resource=>(detail[resource]||[]).filter(row=>resource!=='entries'||row.kind!=='driver_adjustment').map(row=>({...row,id:`${resource}-${row.id}`,transactionId:row.id,resource,amount:row.amount||row.totalAmount,type:resource==='incomes'?'Receive Company Payment':resource==='advances'?'Driver Advance':resource==='diesels'?'Diesel':resource==='expenses'?row.expenseHead?.name||'Expense':transactionLabels[row.kind],transactionStatus:row.voidedAt?'Reversed':'Posted'}))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
            return <><Typography variant="body2" color="text.secondary" mb={1}>{detailTab===0?'All company collections and owner payments appear here.':'Driver advances are tracked separately. Adjusting them against salary does not create another expense.'}</Typography><Table rows={history} fields={['date','type','amount','paymentMethod','paymentReference','transactionStatus']} actions={row=><Stack direction="row" className="no-print"><Button onClick={()=>{setVoucher({...row,id:row.transactionId});setDialog('voucher');}}>Receipt</Button>{!row.voidedAt&&<Button color="error" onClick={()=>{setReason('');setConfirm({resource:({incomes:'income',entries:'entry',expenses:'expense',diesels:'diesel',advances:'advance'})[row.resource],id:row.transactionId});}}>Reverse Entry</Button>}</Stack>} />
              {detailTab===1&&detail.account?.classification==='Own'&&<Stack direction="row" gap={1} className="no-print" flexWrap="wrap"><Button onClick={()=>open(selected,'payment','driver_advance')}>Pay Driver Advance</Button><Button onClick={()=>open(selected,'payment','driver_adjustment')}>Adjust Advance</Button></Stack>}
              {detailTab===1&&(detail.entries||[]).some(e=>e.kind==='driver_adjustment')&&<Accordion elevation={0}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Advance Adjustments</Typography></AccordionSummary><AccordionDetails><Table rows={detail.entries.filter(e=>e.kind==='driver_adjustment')} fields={['date','amount','remarks','voidReason']} actions={row=>!row.voidedAt&&<Button color="error" onClick={()=>{setReason('');setConfirm({resource:'entry',id:row.id});}}>Reverse Adjustment</Button>} /></AccordionDetails></Accordion>}
            </>;
          })()}
          {detailTab===2&&<Stack gap={2}>
            <Box><Typography variant="subtitle2">Delivery receipt (POD)</Typography><Typography variant="body2" color="text.secondary">{detail.trip.podStatus==='Approved'?'POD has been submitted':detail.trip.podStatus==='Received'?'POD has been received':'POD is pending'}</Typography><Button onClick={()=>open(selected,'pod')} disabled={!detail.account}>Update POD</Button>{detail.account?.podDocument?.startsWith('https://')&&<Button component="a" href={detail.account.podDocument} target="_blank" rel="noreferrer">View Document</Button>}</Box>
            <Stack direction="row" gap={1} className="no-print" flexWrap="wrap"><Button onClick={()=>open(selected,'terms')}>Edit Freight / Extra Charges</Button><Button disabled={busy} onClick={()=>previewStatement('trip')}>Print Statement / Save PDF</Button></Stack>
            {detail.account&&<TextField select size="small" label="Trip Status" value={detail.trip.status} disabled={detail.trip.status==='Cancelled'} onChange={e=>run(()=>api.status(selected,e.target.value)).then(ok=>ok&&open(selected))}>{[['Pending','Pending'],['Running','In Progress'],['Completed','Completed'],['Cancelled','Cancelled']].map(([k,l])=><MenuItem key={k} value={k} disabled={k==='Cancelled'}>{l}</MenuItem>)}</TextField>}
            <Accordion elevation={0} disableGutters><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2">Change History</Typography></AccordionSummary><AccordionDetails>{(detail.audit||[]).length?(detail.audit||[]).map(a=><Box key={a.id} sx={{mb:2}}><Typography variant="body2" fontWeight={600}>{{enroll:'Trip account created',revise:'Freight / charges updated',pod:'POD updated'}[a.action]||a.action}</Typography><Typography variant="caption" color="text.secondary">{new Date(a.createdAt).toLocaleString('en-IN')} · User #{a.createdBy}</Typography></Box>):<Typography variant="body2">No changes recorded yet.</Typography>}<Typography variant="caption" color="text.secondary">Use “Reverse Entry” to correct a payment. The original record is retained.</Typography></AccordionDetails></Accordion>
            {detail.account&&<Accordion elevation={0} disableGutters className="no-print"><AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2" color="error.main">Cancel This Trip?</Typography></AccordionSummary><AccordionDetails><Typography variant="body2" mb={1}>Reverse all payment and expense entries before cancelling this trip.</Typography><Button color="error" variant="outlined" onClick={()=>{setReason('');setConfirm({cancel:true});}}>Cancel Trip</Button></AccordionDetails></Accordion>}
          </Stack>}
        </Box>}

      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={()=>setDialog('')}>Close</Button>
        {['voucher','payment','pod','terms'].includes(dialog)&&detail?.account&&<Button disabled={busy} onClick={()=>setDialog('detail')}>← Back to Trip Account</Button>}
        {dialog==='detail'&&!detail?.account&&<Button onClick={()=>open(selected,'terms')}>Set accounting terms</Button>}

        {['enroll','choose-payment'].includes(dialog)&&<Button variant="contained" disabled={!selected||busy} onClick={()=>open(selected,dialog==='enroll'?'terms':'payment',paymentKind)}>Continue</Button>}
        {dialog==='classify'&&<Button disabled={busy||!form.vehicleId||!form.classification} onClick={()=>run(()=>api.classify(form.vehicleId,form.classification))}>Save classification</Button>}
        {['terms','payment','pod','vehicle-expense'].includes(dialog)&&<Button variant="contained" disabled={busy||(dialog==='terms'&&!form.reconcileLegacy)||(dialog==='payment'&&!detail?.account)||(['payment','vehicle-expense'].includes(dialog)&&(!/^\d+(\.\d{1,2})?$/.test(form.amount||'')||Number(form.amount)<=0||!form.date||(form.kind==='expense'&&!form.expenseHeadId)||(form.kind==='driver_adjustment'&&(!form.advanceId||!form.expenseId))||(dialog==='vehicle-expense'&&!form.vehicleId)||(form.kind!=='driver_adjustment'&&form.paymentMethod!=='Cash'&&!form.paymentReference)))} onClick={()=>run(()=>dialog==='vehicle-expense'?api.vehicleExpense(form.vehicleId,Object.fromEntries(Object.entries(form).filter(([k])=>k!=='vehicleId'))):dialog==='terms'?(async()=>{const v=masters.vehicles?.find(v=>v.id===detail.trip.vehicleId);if(v?.classification==='Unclassified')await api.classify(v.id,form.classification);return api.terms(selected,form);})():dialog==='payment'?api.post(selected,form):api.pod(selected,{...form,podSubmissionDate:form.podSubmissionDate||null})).then(ok=>ok&&dialog!=='vehicle-expense'&&open(selected))}>{busy?'Saving…':dialog==='terms'?'Save Freight Details':'Save Entry'}</Button>}
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(confirm)} onClose={()=>!busy&&setConfirm(null)} fullWidth maxWidth="xs"><DialogTitle>{confirm?.cancel?'Cancel This Trip?':'Reverse This Entry?'}</DialogTitle><DialogContent><Typography variant="body2">Reverse only an incorrect entry. The original record will be retained and balances will be recalculated.</Typography><TextField fullWidth margin="dense" label="Reason for Reversal" value={reason} onChange={e=>setReason(e.target.value)} />{error&&<Alert severity="error">{error}</Alert>}</DialogContent><DialogActions><Button onClick={()=>setConfirm(null)} disabled={busy}>Back</Button><Button color="error" disabled={busy||reason.trim().length<3} onClick={()=>run(()=>confirm.vehicleId?api.reverseVehicleExpense(confirm.vehicleId,confirm.id,reason):confirm.cancel?api.cancel(selected,reason):api.reverse(selected,confirm.resource,confirm.id,reason),false).then(ok=>{if(ok){const standalone=confirm.vehicleId;setConfirm(null);if(!standalone)open(selected);}})}>Confirm</Button></DialogActions></Dialog>
    <StatementPreview document={printDocument} onClose={()=>setPrintDocument(null)} />
  </>;
}
