const fs = require('fs');

function globalReplace(content, filename) {
    let txt = content;

    // General terminology replacements for 'account' where it means 'company' or 'contact'
    // But be careful not to replace 'user account'

    // Specific to 06-first-sprint.md
    if (filename.includes('06-first-sprint.md')) {
        txt = txt.replace(/accounts list and detail screens/g, 'companies list and detail screens');
        txt = txt.replace(/endpoints for accounts/g, 'endpoints for companies');
        txt = txt.replace(/contacts\/accounts/g, 'contacts/companies');
        txt = txt.replace(/account sync job/g, 'company sync job');
    }

    // Specific to 05-repo-plan.md
    if (filename.includes('05-repo-plan.md')) {
        txt = txt.replace(/account 作成/g, 'company/contact 作成');
        txt = txt.replace(/共有 account と事業別/g, '共有 company/contact と事業別');
        txt = txt.replace(/\* accounts\n/g, '* companies\n');
        txt = txt.replace(/account\/contact 一覧/g, 'company/contact 一覧');
        txt = txt.replace(/account\/contact 紐付け/g, 'company/contact 紐付け');
        txt = txt.replace(/accounts list/g, 'companies list');
        txt = txt.replace(/accounts create/g, 'companies create');
        txt = txt.replace(/account create use case/g, 'company create use case');
        txt = txt.replace(/account list query/g, 'company list query');
        txt = txt.replace(/account repository/g, 'company repository');
        txt = txt.replace(/accounts 一覧/g, 'companies 一覧');
        txt = txt.replace(/accounts を新規作成/g, 'companies を新規作成');
    }

    // Specific to 04-api-contracts.md
    if (filename.includes('04-api-contracts.md')) {
        txt = txt.replace(/（accounts, contacts）/g, '（companies, contacts）');
        txt = txt.replace(/account 単位の/g, 'company 単位の');
        txt = txt.replace(/"account": \{/g, '"company": {');
        txt = txt.replace(/account \/ contact 更新/g, 'company / contact 更新');
        txt = txt.replace(/共有 account\/contact/g, '共有 company/contact');

        // Roles in 04
        // Make sure no single string role except primaryRole or effectiveRole
        txt = txt.replace(/"role":/g, '"roles":');
        // Change string value to array if we just changed "role" to "roles"
        txt = txt.replace(/"roles": "OPERATOR"/g, '"roles": ["OPERATOR"]');
        txt = txt.replace(/"roles": "MANAGER"/g, '"roles": ["MANAGER"]');
        txt = txt.replace(/"roles": "ADMIN"/g, '"roles": ["ADMIN"]');
        txt = txt.replace(/"roles": "SUPER_ADMIN"/g, '"roles": ["SUPER_ADMIN"]');
        txt = txt.replace(/"roles": "VIEWER"/g, '"roles": ["VIEWER"]');

        // Fix existing arrays if we accidentally double arrayed them? No, we didn't.
    }

    // Specific to 03-screens-and-flows.md
    if (filename.includes('03-screens-and-flows.md')) {
        txt = txt.replace(/関連 account・商談/g, '関連 contact・商談');
        txt = txt.replace(/company\/account/g, 'company/contact');
        txt = txt.replace(/`accounts` `companies`/g, '`companies` `contacts`');
        txt = txt.replace(/`accounts`, `companies`/g, '`contacts`, `companies`');
    }

    // Specific to 02-domain-model.md
    if (filename.includes('02-domain-model.md')) {
        txt = txt.replace(/account\/company の正本/g, 'company の正本');
    }

    return txt;
}

const files = [
    'docs/02-domain-model.md',
    'docs/03-screens-and-flows.md',
    'docs/04-api-contracts.md',
    'docs/05-repo-plan.md',
    'docs/06-first-sprint.md',
    'docs/00-foundation.md'
];

for (const f of files) {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        const newContent = globalReplace(content, f);
        if (content !== newContent) {
            fs.writeFileSync(f, newContent, 'utf8');
            console.log(`Updated ${f}`);
        }
    }
}
