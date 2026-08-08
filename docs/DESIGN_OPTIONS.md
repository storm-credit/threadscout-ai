# Four Design Options

| Option | Core flow | Complexity | Automation | Largest risk | Best for |
|---|---|---:|---:|---|---|
| A. Sheet-assisted validation | AI drafts → Google Sheet approval → manual/third-party scheduler | Low | 50–60% | fragmented workflow and weak analytics | proving demand quickly |
| B. Personal approval dashboard | manual candidates → four drafts → risk check → approve/schedule | Medium | 70–80% | building UI before discovery quality is proven | long-term personal use |
| C. Scout and learning dashboard | automated candidates → scoring → four drafts → approval → analytics feedback | Medium-high | 80–85% | noisy data creates misleading recommendations | account growth and affiliate testing |
| D. Multi-agent multi-user platform | scout/verifier/writer/compliance/publisher/analyst agents | High | 90%+ | premature complexity, cost, and policy exposure | a validated future SaaS |

## Option A — Sheet-assisted validation

### First screen

A spreadsheet view with candidate, evidence, draft, status, and link columns.

### Strengths

- fastest path to testing
- low engineering cost
- easy manual correction

### Weaknesses

- poor mobile experience
- weak product-evidence model
- analytics and status handling become fragile

## Option B — Personal approval dashboard

### First screen

Five cards showing product, reasons, risks, and `Create 4 drafts`.

### Strengths

- strong mobile workflow
- explicit truth, rights, and approval records
- manageable scope

### Weaknesses

- candidates may still be entered manually
- discovery quality is not yet automated

## Option C — Scout and learning dashboard

### First screen

Five ranked candidates selected from twenty, with purchase-intent, saturation, exact-match, visual-fit, and risk signals.

### Strengths

- targets the hardest user problem: what to post
- performance data can improve later recommendations
- supports a repeatable daily routine

### Weaknesses

- public-data availability and API permissions may constrain discovery
- scoring can create false confidence

## Option D — Multi-agent platform

### First screen

A cross-account operations inbox with agent status, approvals, incidents, and analytics.

### Strengths

- scalable separation of responsibilities
- traceable failures

### Weaknesses

- expensive and complex before product-market fit
- much larger security and platform-policy surface

## Recommendation

Start with a B+C hybrid:

- build the approval and integrity model from B
- begin with manual or semi-automatic candidate input
- add C's discovery pipeline only after scoring can be validated against real outcomes
