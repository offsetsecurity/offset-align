# Collecting evidence from the cloud

Most of the proof a customer, insurer or assessor wants already exists in your
cloud console. The work is exporting it, dating it, and attaching it to the
right outcome.

Export as PDF or CSV, name it so the date is obvious, and record the collected
date in **Evidence**. Collect it again every quarter; anything older than 90
days is flagged here.

## Microsoft 365 and Entra ID

| Proof | Where | Subcategories |
|---|---|---|
| Multi-factor authentication is enforced | Entra ID → Conditional Access → policy, exported | PR.AA-03 |
| Who has admin roles | Entra ID → Roles and administrators | PR.AA-05 |
| Access review results | Entra ID Governance → Access reviews | PR.AA-05 |
| Leavers disabled | Entra ID → Users, filtered by sign-in status | PR.AA-01 |
| Audit log kept | Purview → Audit search, exported | PR.PS-04, DE.CM-03 |
| Data loss prevention rules | Purview → Data loss prevention | PR.DS-01, PR.DS-02 |
| Device compliance | Intune → Devices → Compliance | PR.PS-01, ID.AM-01 |

## AWS

| Proof | Where | Subcategories |
|---|---|---|
| Root account has MFA and is unused | IAM → Credential report | PR.AA-03, PR.AA-05 |
| Who can do what | IAM → Access Analyzer findings, policy export | PR.AA-05 |
| Logging is on and kept | CloudTrail → Trails, S3 lifecycle rules | PR.PS-04 |
| Encryption at rest | KMS key list, S3 bucket settings | PR.DS-01 |
| Backups run and restore | AWS Backup → Jobs, and a restore test record | PR.DS-11, RC.RP-03 |
| Patch level | Systems Manager → Patch compliance | PR.PS-02, ID.RA-01 |
| Network exposure | Security Groups, Config rules | PR.IR-01 |

## Google Workspace and Google Cloud

| Proof | Where | Subcategories |
|---|---|---|
| Two-step verification enforced | Admin console → Security → Authentication | PR.AA-03 |
| Admin activity | Admin console → Reporting → Audit | PR.PS-04, DE.CM-03 |
| Sharing rules | Admin console → Apps → Drive → Sharing settings | PR.AA-05, PR.DS-01 |
| Who has project access | IAM & Admin → IAM, exported | PR.AA-05 |
| Logging and retention | Cloud Logging → Log buckets | PR.PS-04 |

## What makes an export good evidence

**It shows the date it was taken.** A screenshot with no date proves nothing.

**It shows the whole setting, not the part that flatters you.** A reviewer who
finds the crop will ask what else was cropped.

**It says who took it.** The evidence record does that for you.

**It matches what the profile claims.** If the current profile says reviews
happen quarterly, the export should show four of them.
