# Transport accounting upgrade

## Phase 1 — Existing application and database analysis

Inspected the React/Vite/MUI pages, Axios client, React Router, Express routes, JWT and role middleware, Joi validation, Sequelize models, CRUD controllers, ledgers, reports, dashboard, seeding and database startup. Inspected the local MySQL table definitions through `INFORMATION_SCHEMA` / `SHOW FULL COLUMNS` before writing the migration.

The database contains 17 existing tables. Company/customer records are `Parties`; market owners are `Owners`. `Vehicles` already belongs to `Owners`. `Trips` already references vehicle, driver, company, and source/destination `Locations`. Operational costs live in `Expenses`, `ExpenseHeads`, and `Diesels`; collections in `IncomeLogs`; driver advances in `DriverAdvances`. Existing auth uses Users and JWT with Super Admin, Admin, Manager, Accountant, Data Entry Operator roles.

Existing `Trips.advance`, `remainingPayment`, `commission`, `balanceHoldAmount`, `advanceDate`, and `balanceReceivedDate` are legacy aggregate fields. They do not identify validated company receipts vs owner advances. Existing reports mix collections and profit and do not distinguish fleet and brokerage activity. Receipt/POD storage infrastructure does not exist: the new forms store HTTPS document references rather than creating an unauthenticated upload server.

Existing uncommitted application/UI work was retained. No application replacement, new framework, or dependency was introduced.

## Phase 2 — Reuse and gaps

| Existing resource | Reuse / change |
| --- | --- |
| Owners, Parties, Drivers, Locations | Reused as masters; no duplicates |
| Vehicles | Add explicit Unclassified / Own / Market classification |
| Trips | Reused for all load identity, routing, parties, drivers, dates, status and POD state |
| IncomeLogs | Reused for company payments, including multiple partial collections |
| Expenses and ExpenseHeads | Reused for vehicle and broker-borne expenses, including non-trip vehicle expenses |
| Diesels | Include existing trip and non-trip fuel costs without creating a second diesel book |
| DriverAdvances | Reused as driver receivables; not P&L expenses |
| JWT / roles / MUI / routing / Axios / DataTable | Reused |
| Missing owner settlements, audited terms, duplicate submission controls | Added below |

## Phase 3 — Final schema

Only three new tables are introduced:

- **TripAccounts**: one-to-one with Trips (unique `tripId`), classification and owner snapshot, company and market freight, additional income, independently identified company / owner / broker deductions, commission paid to others, payment due dates, material/company references, POD requirement/submission/document, creator, version and timestamps. No receivable/payable balances are stored.
- **AccountingEntries**: owner advances, owner payments, and driver advance adjustments. Each references Trips and Users. Driver adjustments additionally reference the existing DriverAdvances and Expenses rows. DECIMAL(14,2) amount, payment date/method/reference, request key and payload hash, reversal metadata, timestamps. Unique request key and payment reference, and trip/date index.
- **AccountingAudits**: append-only application history with entity, identity, action, before/after JSON snapshots, actor and timestamp; entity/date index.

Existing Expenses, IncomeLogs, DriverAdvances and Diesels receive nullable creator, payment/recipient/document metadata, unique nullable request key, request hash and reversal metadata. Existing DECIMAL(10,2) money columns are preserved. API input is capped to their supported range. New models use foreign keys with RESTRICT deletion. IncomeLogs also receives a unique nullable payment-reference index. Default expense categories are inserted only when their name does not already exist.

Relationships:

```text
Owners -> Vehicles -> Trips <- Parties
                       |  |
                       |  +-> IncomeLogs / Expenses / Diesels / DriverAdvances
                       +----> TripAccounts (one)
                       +----> AccountingEntries (many)
DriverAdvances + salary Expenses -> driver-adjustment AccountingEntries
Users -> createdBy on accounting resources / AccountingAudits
```

Vehicle owner and classification become fixed once accounting history is enrolled. Trip freight revisions update the existing Trip freight and preserve before/after history. Original operational trip fields are not interpreted as extra accounting payments.

## Phase 4 — Migration and backend integration

Run commands from the repository root:

```sh
npm run db:accounting --prefix backend
npm run dev --prefix backend
npm run dev --prefix frontend
```

The local `tms_db` additive migration was applied during implementation. Other deployments must run the same command before restarting the updated application. It uses the existing `backend/.env`, including optional `DB_SOCKET`. Restart the backend to load the new route/model code. No new environment secrets are needed.

`accounting/migrate.js` checks existing tables, adds only missing columns/indexes, creates only the three accounting tables, and can be run again. MySQL DDL auto-commits; the script deliberately does not claim transactional DDL rollback. It never guesses ownership or rewrites existing money. Follow the deployment's normal backup process before upgrades. No destructive down migration is supplied for financial history.

Automatic `sync({ alter: true })` on startup was removed. `DB_SYNC=true` supports non-destructive initial table creation in development only. On a fresh development database, initialize the existing TMS schema with this flag first; then run the accounting migration. Seeding remains explicitly controlled by the existing `SEED_DB` flag and is disabled in production.

All new routes are mounted at `/api/v1/accounting` after existing JWT authentication and restricted to Super Admin, Admin, Manager and Accountant. Only managers/admins can classify vehicles.

| Method / path | Behavior |
| --- | --- |
| GET /masters | Existing vehicle, owner, company, trip and expense selectors |
| PUT /vehicles/:id/classification | Explicit ownership classification, audited |
| POST /vehicles/:id/expenses | Cost for an owned vehicle without a trip |
| POST /vehicles/:id/expenses/:expenseId/reverse | Preserve and reverse standalone vehicle cost |
| GET /loads | Search/filter/sort/page enrolled trip accounts |
| GET /loads/:id | Existing trip, terms, transactions, settlement totals, terms/POD audit history |
| PUT /loads/:id/terms | Enroll or revise freight terms; optimistic version check |
| POST /loads/:id/transactions | Company receipt, owner advance/payment, expense, driver advance/adjustment |
| POST /loads/:id/reverse/:resource/:transactionId | Audited reversal with reason; resource = income / expense / diesel / advance / entry |
| PUT /loads/:id/pod | Independent POD state and submission metadata |
| PATCH /loads/:id/status | Pending / Running / Completed with audit |
| POST /loads/:id/cancel | Requires all financial records to be reversed first |
| GET /dashboard | Fleet, brokerage, cash, obligations, overdue and POD figures |
| GET /reports/:name | Financial report, with optional format=csv or format=print for the full filtered statement |

All money in new mutation bodies is a decimal string, e.g. `"15000.00"`. Responses use existing `{status, data}` conventions. Paginated responses also include total/page/pages; list and report responses include the count of trips awaiting enrollment. Monetary calculation errors return useful 400 responses; unauthorized roles receive 403; stale term versions receive 409. All database queries use Sequelize parameters.

## Phase 5 — React integration and daily workflow

Open `/admin/accounting/dashboard` after logging in. The sidebar has a Transport Accounting group with dashboard, own vehicle accounts, brokerage & settlements, and financial reports & ledgers. Forms and tables reuse the existing theme, MUI components and DataTable. Selectors are searchable. Screens provide loading, error, empty and success states.

1. Create owners/companies/vehicles/drivers/routes using the existing masters. Classify a vehicle explicitly as Own or Market. Existing vehicles default to Unclassified; the application does not guess from owner names.
2. Create a trip/load through the existing trip register, retaining the existing required vehicle, driver, route and company fields.
3. Select **Enroll existing trip**. Review its existing collection logs, costs and advances. Reconcile legacy aggregate advances outside automatic conversion; if an actual payment is missing from the transaction logs, post it once with its correct type and reference. Confirm the reconciliation review, enter freight terms, due dates and POD requirements, then save.
4. Open the load account. Record company collections and owner payments/advances independently. Record operational vehicle expenses or market-load broker expenses using expense categories. Record maintenance, insurance and permits without a trip using **Vehicle expense**.
5. Record the complete driver salary as one expense. Record driver advances separately. Adjust the advance against that salary using the advance and salary selectors. An adjustment is not a new expense or new cash payment.
6. Update POD using the independent POD form. Approval requires a submission date. Company collections still require explicit payment entries.
7. Mark completed loads Completed to recognize earned brokerage. Edit freight through **Revise freight / income**; the previous values stay in the audit history. Reverse erroneous transactions and re-enter the correct transaction. Cancellation is available only after reversal of all financial activity.
8. Use **Voucher** on a transaction to print a payment voucher. Use report filters for owner/company statements and export all matching rows to CSV. PDF previews use the existing Petrol Pump ledger letterhead, table, totals panel, and authorized-signatory layout. PDF and CSV exports both include the complete filtered result.

The old operational pages remain available for unenrolled trips. Once enrolled, original CRUD mutations on that trip or its financial rows are rejected with a linkable explanation directing users to accounting; master deletion that would cascade into accounting costs is also blocked. Original financial-register delete actions now reverse records with an audit event instead of permanently deleting them. Reversed existing financial rows are excluded from legacy queries by default, while the accounting module explicitly reads their full history.

## Phase 6 — Accounting policies and safeguards

- All new accounting arithmetic uses BigInt minor units. JSON and MySQL receive decimal strings; binary floats are not added/subtracted for financial results.
- Company bill = company freight + additional income - company deductions. Company outstanding = bill - active collections.
- Owner entitlement = agreed market freight - owner deductions. Owner outstanding = entitlement - active owner advances/payments.
- Gross brokerage = company freight - agreed vehicle freight. Expected net brokerage = company bill - owner entitlement - recorded broker expenses - broker deductions - commission paid to others. The company collection is never itself brokerage income.
- Earned brokerage is expected net brokerage for Completed loads; pending/running loads retain expected figures only. Negative completed margins remain losses.
- Commission received uses a **conservative owner-first allocation**: collections above the full owner entitlement, capped at positive earned net margin after recorded costs. Commission receivable is the remaining positive earned margin. This is an explicit allocation policy, not a separate bank transaction or permission to withdraw funds.
- Own-vehicle P&L uses recognized freight/additional income less company deductions, operating expenses, fuel costs, broker deductions and any commission paid to others. Driver advances are assets; salary is recognized once; adjusting an advance does not add another expense.
- Funds available = company collections - owner cash payments - recorded costs - driver advances + salary advance adjustments - standalone fleet costs. It is before tax, pump-credit timing, loans, wages not entered, and other obligations; it is not a bank-account reconciliation.
- Every new trip financial write locks the same Trip row in a MySQL transaction. Payment retries use a request key plus canonical payload hash. A retry returns the original record; a changed payload with the same key fails. Overpayments are rejected inside the lock, including concurrent requests. Unique noncash references provide database protection across different loads. Use one stable idempotency key per submission; the UI retains it during a failed request retry.
- Expenses and payments have creator/timestamps. Reversal marks the original row and writes a separate before/after audit event; rows are retained. Reverse linked salary adjustments before reversing their advance or salary expense.
- POD received/approval and cash payment states are independent. POD eligibility is informational: a real company payment may still be recorded before POD approval.
- New managed balances never read `Trips.remainingPayment` or treat `Trips.advance` as a second payment. Existing reconciled IncomeLogs, Expenses, Diesels and DriverAdvances are included once by their source identity. Do not enter a fuel receipt in both Expenses and Diesels; both source books represent real costs.

## Phase 7 — Reports, dates and audit history

Implemented all twelve requested reports: vehicle P&L, expenses, vehicle income, company ledger, owner ledger, brokerage profit, load settlement, receivables, payables, payments, driver advances and pending POD. Also implemented company account summaries, owner account summaries and a detailed owned-vehicle ledger.

Reports support search, allowlisted sorting, pagination, date/vehicle/company/owner/status/company-payment/owner-payment filters, CSV and browser printing. CSV neutralizes spreadsheet formula prefixes. UI presets include Today, Monday-start week, month, April-start financial year, and custom dates in India time.

Balances are cumulative through the selected end date, including obligations from earlier loads. Cash and expense activity use their transaction date. Recognized freight uses the loading date, with completed status distinguishing earned vs expected brokerage. Entity summaries and outstanding reports are balances as of the cutoff, so start date does not discard prior unpaid loads. Ledger balances are calculated before date filtering/pagination and separately per company/owner/vehicle. Freight revisions and payment reversals appear as dated ledger adjustments. Terms/POD/status audit snapshots restore state for cutoff reports; cancellation is reconstructed for earlier cutoffs.

Historical reporting is at **daily** granularity. Imported/enrolled legacy terms open at their original loading date; metadata history starts when the accounting module is adopted. Existing pre-upgrade changes cannot be reconstructed. Active trip transactions on a cancelled load are prohibited; reverse before cancellation.

The original dashboard and original reports retain their pre-upgrade cash/operational semantics for compatibility. Use the Transport Accounting reports for fleet vs brokerage profit and settlement obligations.

## Phase 8 — Verification

Executed:

```sh
npm test --prefix backend
node --test frontend/tests/*.test.mjs
npm run build --prefix frontend
# Run from backend, using an unused isolated database name:
ACCOUNTING_MYSQL_TEST=true DB_NAME=tms_accounting_test_<unique_name> node --test tests/accounting-mysql.test.js
```

Tests cover decimal precision, the ₹50,000/₹43,000/₹7,000 example, owner partial payments, duplicate retries, altered request-key reuse, concurrent overpayment rejection, company partial collections, payment reversal, freight revision history/version conflicts, salary advance adjustment bounds and reversal dependencies, standalone fleet costs, all report endpoints, CSV, authentication/roles, legacy-route mutation protection, cancellation restrictions and independent POD/collection state. Integration tests create an unused temporary database and remove only the database they created. They refuse an existing database and do not write test payments to the business database.

The migration ran twice in the isolated test to verify repeatability and then ran successfully against the local existing installation. The frontend production build and existing frontend utility tests pass. Browser checks verified the existing login and new accounting/report navigation against real local APIs. A full visual walkthrough with real saved financial entries was intentionally performed through isolated API tests rather than adding test transactions to business records. Vite retains its existing large-bundle warning.

## Phase 9 — Changed files and deployment notes

New files:

```text
backend/accounting/models.js
backend/accounting/migrate.js
backend/accounting/money.js
backend/accounting/calculations.js
backend/accounting/validation.js
backend/accounting/service.js
backend/accounting/reports.js
backend/accounting/routes.js
backend/accounting/legacyGuard.js
backend/tests/accounting.test.js
backend/tests/accounting-mysql.test.js
frontend/src/services/accounting.js
frontend/src/components/accounting/Filters.jsx
frontend/src/pages/Accounting.jsx
docs/TRANSPORT_ACCOUNTING.md
```

Integration changes:

```text
backend/models/index.js       register accounting models and additive legacy model fields
backend/routes/api.js         mount financial-role routes and legacy mutation guard
backend/controllers/crudController.js  retain financial rows when legacy delete actions reverse them
backend/server.js             replace automatic alter with explicit migration workflow
backend/package.json          migration and test scripts
frontend/src/App.jsx          accounting routes
frontend/src/components/Layout.jsx  role-aware accounting navigation
README.md                     link to this guide
```

No npm dependency additions. Other existing working-tree changes predate this upgrade and should not be attributed to accounting. Do not roll them back when reviewing this work.

Deployment sequence: migrate the database, restart the API, build/deploy the frontend, log in as a financial role, classify vehicles, then reconcile/enroll existing trips. Do not automatically classify historical vehicles or duplicate legacy advances to make a dashboard nonzero.

Operational limits: no document-upload infrastructure or native .xlsx writer was introduced; HTTPS attachments and CSV are supported. Balances are linked to loads rather than introducing a duplicate invoice system. Report datasets currently load enrolled history into a consistent database transaction before aggregating/paginating; a large deployment should replace this with SQL aggregation/streaming exports while preserving tested accounting semantics. There is no statutory general ledger, bank reconciliation, tax filing, accounting-period closure or chart of accounts in the original application; these reports cover the requested transport subledgers.

Accounts PDF previews use the company contact settings and include report filters, all matching records, exact summary totals, and retained reversal statuses. Wide reports print in A4 landscape with repeating table headers. Load statements and individual vouchers use the same design. Choose **Print Statement / Save PDF** in the preview to open the browser print dialog.
