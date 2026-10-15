import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { labelFor, moneyFields, transactionLabels } from './labels';
import { formatDate } from '../../utils/dateFormatter';
import { today } from './Filters';
import './statement.css';
const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
const numeric = key => moneyFields.has(key) || ['debit','credit'].includes(key);
function cell(row, key) {
  const value = row[key];
  if (value === null || value === undefined || value === '') return '—';
  if (numeric(key)) return currency(value);
  if (['date','startDate','dueDate','ownerDueDate'].includes(key)) return formatDate(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return transactionLabels[value] || String(value);
}
export default function StatementPreview({ document, onClose }) {
  if (!document) return null;
  const landscape = document.fields.length > 8;
  const contact = document.contact || {};
  return <Dialog open onClose={onClose} maxWidth={landscape ? 'xl' : 'md'} fullWidth className="accounting-statement-dialog" aria-labelledby="accounting-statement-title">
    <DialogTitle id="accounting-statement-title" className="statement-controls" sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Statement Preview</DialogTitle>
    <DialogContent sx={{ p: 0 }}>
      <style>{`@media print { @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 12mm; } }`}</style>
      <article id="accounting-statement" className={landscape ? 'statement-landscape' : ''}>
        <header className="statement-letterhead"><h1>{contact.companyName}</h1><p className="statement-tagline">Leading Transport Contractors &amp; Fleet Operators</p><p className="statement-contact">{[contact.address, contact.phone && `Tel: ${contact.phone}`, contact.email && `Email: ${contact.email}`].filter(Boolean).join(' | ')}</p></header>
        <section className="statement-metadata"><div><h2>{document.title}</h2><h3>{document.subject || 'All Accounts'}</h3>{document.details?.map((text,i) => <p key={i}>{text}</p>)}</div><div className="statement-duration"><h2>Statement Duration</h2><strong>{document.startDate ? formatDate(document.startDate) : 'Beginning'} to {document.endDate ? formatDate(document.endDate) : 'Present'}</strong><p>Statement Generated on: {formatDate(today())}</p><p>{document.recordCount} {document.recordCount === 1 ? 'record' : 'records'}</p></div></section>
        <div className="statement-table-wrap"><table><thead><tr>{document.fields.map(key => <th className={numeric(key) ? 'statement-number' : ''} key={key}>{labelFor(key)}</th>)}</tr></thead><tbody>{document.rows.length ? document.rows.map((row,index) => <tr key={index}>{document.fields.map(key => <td className={numeric(key) ? 'statement-number' : ''} key={key}>{cell(row,key)}</td>)}</tr>) : <tr><td colSpan={document.fields.length} className="statement-empty">No transactions for the selected filters.</td></tr>}</tbody></table></div>
        {document.summary?.length > 0 && <section className="statement-summary">{document.summary.map((item,i) => <div key={item.label}><h2>{item.label}</h2><strong className={i === document.summary.length - 1 ? 'statement-balance' : ''}>{currency(item.value)}</strong></div>)}</section>}
        {document.note && <p className="statement-note">{document.note}</p>}
        <footer className="statement-signatures"><p>This is a computer-generated statement.</p><div><strong>Authorized Signatory</strong><span>{contact.companyName}</span></div></footer>
      </article>
    </DialogContent>
    <DialogActions className="statement-controls" sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><Button variant="outlined" onClick={onClose}>Close Preview</Button><Button variant="contained" onClick={() => window.print()}>Print Statement / Save PDF</Button></DialogActions>
  </Dialog>;
}
