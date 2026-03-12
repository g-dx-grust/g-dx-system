const fs = require('fs');

function patch03() {
  const f = 'docs/03-screens-and-flows.md';
  if (!fs.existsSync(f)) return;
  let txt = fs.readFileSync(f, 'utf8');

  // Terminology
  txt = txt.replace(/\* `accounts` と `companies` は共通マスタ/g, '* `companies` と `contacts` は共通マスタ');
  txt = txt.replace(/\* Accounts/g, '* Contacts');
  txt = txt.replace(/account \/ company \/ deal/g, 'company / contact / deal');
  txt = txt.replace(/\/customers\/accounts/g, '/customers/contacts');
  txt = txt.replace(/\[accountId\]/g, '[contactId]');
  txt = txt.replace(/\* \*\*Account Detail\*\*/g, '* **Contact Detail**');
  
  // Table C-01 to C-03
  txt = txt.replace(/Account List/g, 'Contact List');
  txt = txt.replace(/Account Create\/Edit/g, 'Contact Create/Edit');
  txt = txt.replace(/Account Detail/g, 'Contact Detail');
  txt = txt.replace(/account 一覧/g, 'contact 一覧');
  txt = txt.replace(/account は shared/g, 'contact は shared');
  txt = txt.replace(/account の新規/g, 'contact の新規');
  txt = txt.replace(/account の共通/g, 'contact の共通');
  txt = txt.replace(/account 基本/g, 'contact 基本');
  txt = txt.replace(/account 追加/g, 'contact 追加');
  txt = txt.replace(/account\/company/g, 'company/contact');
  txt = txt.replace(/linked account/g, 'linked contact');

  // Flows
  txt = txt.replace(/account または company/g, 'contact または company');

  // Roles
  // SUPER_ADMIN / ADMIN / MANAGER / OPERATOR / VIEWER に統一されているか？
  // The table currently has `営業担当、架電担当、マネージャー` etc. 
  // Wait, the standard 5 roles are SUPER_ADMIN, ADMIN, MANAGER, OPERATOR, VIEWER.
  // The table uses Japanese terms. Does the prompt want Japanese terms normalized to English?
  // "Normalize role names to the standard 5-role model."
  txt = txt.replace(/営業マネージャー、管理者/g, 'MANAGER, ADMIN');
  txt = txt.replace(/営業担当、架電担当、マネージャー、管理者/g, 'OPERATOR, MANAGER, ADMIN');
  txt = txt.replace(/営業担当、架電担当、マネージャー/g, 'OPERATOR, MANAGER');
  txt = txt.replace(/営業担当、架電担当、管理者/g, 'OPERATOR, ADMIN');
  txt = txt.replace(/営業担当、マネージャー、管理者/g, 'OPERATOR, MANAGER, ADMIN');
  txt = txt.replace(/営業担当、管理者/g, 'OPERATOR, ADMIN');
  txt = txt.replace(/営業担当、営業マネージャー/g, 'OPERATOR, MANAGER');
  txt = txt.replace(/架電リーダー、マネージャー、管理者/g, 'MANAGER, ADMIN');
  txt = txt.replace(/架電担当、マネージャー/g, 'OPERATOR, MANAGER');
  txt = txt.replace(/架電担当、営業担当/g, 'OPERATOR');
  txt = txt.replace(/全ユーザー/g, '全ユーザー'); // keep it?
  txt = txt.replace(/一般担当/g, 'OPERATOR');
  txt = txt.replace(/マネージャー/g, 'MANAGER');
  txt = txt.replace(/管理者/g, 'ADMIN');
  
  // Permissions
  // "Normalize permission references to granular permission keys."
  // Wait, in 03, permission considerations in table:
  // "shared master の create/edit 権限が必要。" -> "customer.company.create / customer.contact.create 権限が必要"
  txt = txt.replace(/shared master の create\/edit 権限が必要/g, '`customer.company.create` または `customer.contact.create` 権限が必要');
  txt = txt.replace(/shared company の create\/edit 権限が必要/g, '`customer.company.create` / `customer.company.update` 権限が必要');
  txt = txt.replace(/execute 権限が必要/g, '`call.log.create` 権限が必要');

  fs.writeFileSync(f, txt, 'utf8');
}

function patch04() {
  const f = 'docs/04-api-contracts.md';
  if (!fs.existsSync(f)) return;
  let txt = fs.readFileSync(f, 'utf8');

  // accounts -> companies, because in 04, accounts are companies.
  txt = txt.replace(/\/api\/v1\/accounts/g, '/api/v1/companies');
  txt = txt.replace(/Accounts and Contacts Endpoints/g, 'Companies and Contacts Endpoints');
  txt = txt.replace(/accountId/g, 'companyId');
  txt = txt.replace(/accountName/g, 'companyName');

  // Roles in 04
  txt = txt.replace(/"role": "SALES"/g, '"roles": ["OPERATOR"]');
  txt = txt.replace(/"role": "MANAGER"/g, '"roles": ["MANAGER"]');
  txt = txt.replace(/`SALES`/g, '`OPERATOR`');
  txt = txt.replace(/`BUSINESS_ADMIN`/g, '`ADMIN`');

  fs.writeFileSync(f, txt, 'utf8');
}

function patch05() {
  const f = 'docs/05-repo-plan.md';
  if (!fs.existsSync(f)) return;
  let txt = fs.readFileSync(f, 'utf8');

  txt = txt.replace(/accounts \/ contacts \/ companies/g, 'companies / contacts');
  txt = txt.replace(/├─ accounts\//g, '├─ companies/');
  txt = txt.replace(/├─ account\//g, '├─ company/');
  
  fs.writeFileSync(f, txt, 'utf8');
}

function patch06() {
  const f = 'docs/06-first-sprint.md';
  if (!fs.existsSync(f)) return;
  let txt = fs.readFileSync(f, 'utf8');
  txt = txt.replace(/accounts\/contacts/g, 'companies/contacts');
  txt = txt.replace(/accounts and contacts/g, 'companies and contacts');
  txt = txt.replace(/accounts, deals, and calls/g, 'companies, deals, and calls');
  txt = txt.replace(/account\/contact/g, 'company/contact');
  txt = txt.replace(/account creation/gi, 'company creation');
  txt = txt.replace(/\/api\/accounts/g, '/api/companies');

  fs.writeFileSync(f, txt, 'utf8');
}

patch03();
patch04();
patch05();
patch06();
console.log('Patch complete.');
