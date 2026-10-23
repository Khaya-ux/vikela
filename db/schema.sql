-- Vikela schema. Plain Postgres so it runs locally and on Supabase unchanged.
-- Re-runnable: drops everything first. Never point this at a database you care about.

drop table if exists outreach_messages, case_events, cases, transactions, accounts, customers cascade;

create table customers (
  id          text primary key,           -- short readable ids for the demo, e.g. 'c_lerato'
  full_name   text not null,
  phone_last4 text not null,
  created_at  timestamptz not null default now()
);

create table accounts (
  id            text primary key,
  customer_id   text not null references customers(id),
  account_no    text not null unique,
  kind          text not null check (kind in ('cheque', 'savings', 'ewallet')),
  balance_cents bigint not null default 0
);

-- Every payment, including the ones we hold. Held payments never reach the recipient.
create table transactions (
  id               bigserial primary key,
  from_account_id  text references accounts(id),  -- null for salary and other inbound credits
  to_account_id    text not null references accounts(id),
  amount_cents     bigint not null check (amount_cents > 0),
  reference        text not null default '',
  channel          text not null default 'eft' check (channel in ('eft', 'payshap', 'ewallet', 'salary', 'debit_order')),
  status           text not null default 'posted' check (status in ('posted', 'held', 'released', 'blocked')),
  created_at       timestamptz not null default now()
);
create index on transactions (to_account_id, created_at desc);
create index on transactions (from_account_id, created_at desc);

-- One case per (sender, recipient) pair. New signals attach to the open case.
create table cases (
  id                 bigserial primary key,
  sender_customer_id text not null references customers(id),
  recipient_customer_id text not null references customers(id),
  risk_score         int not null default 0 check (risk_score between 0 and 100),
  status             text not null default 'open' check (status in ('open', 'outreach_sent', 'closed_no_action', 'closed_supported')),
  summary            text not null default '',
  opened_at          timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (sender_customer_id, recipient_customer_id)
);

-- Timeline of everything that happened on a case: flags, pattern hits, analyst actions.
create table case_events (
  id              bigserial primary key,
  case_id         bigint not null references cases(id) on delete cascade,
  transaction_id  bigint references transactions(id),
  kind            text not null check (kind in ('reference_flag', 'pattern_hit', 'analyst_note', 'outreach', 'status_change')),
  severity        int check (severity between 0 and 5),
  category        text,
  language        text,
  translation     text,
  rationale       text,
  detector        text,                     -- 'llm', 'rules', 'pattern:salary_sweep', ...
  actor           text not null default 'system',
  created_at      timestamptz not null default now()
);
create index on case_events (case_id, created_at);

-- Discreet in-app messages. Shown in the Secure Inbox only, never pushed or sent by SMS.
create table outreach_messages (
  id           bigserial primary key,
  case_id      bigint not null references cases(id) on delete cascade,
  customer_id  text not null references customers(id),
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
