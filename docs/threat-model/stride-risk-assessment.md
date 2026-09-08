# NodeGoat STRIDE Threat Model and Risk Assessment

## 1. Risk Rating Method

A 3x3 risk matrix is used.

### Likelihood
- 1 = Low
- 2 = Medium
- 3 = High

### Impact
- 1 = Low
- 2 = Medium
- 3 = High

### Risk Score
Risk Score = Likelihood × Impact

- 1–2 = Low
- 3–4 = Medium
- 6–9 = High

---

## 2. STRIDE Threat Analysis

### Threat 1 - Authentication / Session Spoofing

**STRIDE Category:** Spoofing

**Affected Component:** NodeGoat Web Application

**Attack Scenario:**  
An attacker may attempt to impersonate another legitimate user by exploiting weaknesses in authentication or session handling.

**Likelihood:** 2 - Medium

**Impact:** 3 - High

**Risk Score:** 6 - High

**Justification:**  
Successful exploitation could allow an attacker to access another user's account and perform actions using that user's identity.

**Planned Mitigation:**  
Improve authentication and session validation and ensure sessions are securely handled.

**Control Location:**  
Authentication/session-related application code. The exact source file will be recorded after the vulnerable implementation is inspected.

---

### Threat 2 - Unauthorized Data Modification / Parameter Tampering

**STRIDE Category:** Tampering

**Affected Components:** NodeGoat Web Application and MongoDB

**Attack Scenario:**  
A malicious user may manipulate request parameters or identifiers in order to access or modify information that does not belong to them.

**Likelihood:** 3 - High

**Impact:** 3 - High

**Risk Score:** 9 - High

**Justification:**  
The application accepts user-controlled HTTP input which may eventually interact with stored user information. Missing server-side authorization checks could allow unauthorized modification or access.

**Planned Mitigation:**  
Perform server-side authorization checks, validate user-controlled parameters, and verify resource ownership before database operations.

**Control Location:**  
Application route/controller and database-access code. The exact source file will be identified during vulnerability analysis.

---

### Threat 3 - Sensitive Information Disclosure

**STRIDE Category:** Information Disclosure

**Affected Component:** NodeGoat Web Application

**Attack Scenario:**  
Detailed errors, application information, or sensitive user data may be exposed to an unauthorized user.

**Likelihood:** 2 - Medium

**Impact:** 2 - Medium

**Risk Score:** 4 - Medium

**Justification:**  
Application errors or insufficient access controls may expose information that helps an attacker understand the system or obtain sensitive data.

**Planned Mitigation:**  
Use safe error handling, prevent sensitive information from being returned to users, and enforce authorization before displaying protected data.

**Control Location:**  
Application error-handling and route/controller logic. The exact source file will be identified during secure coding work.

---

### Threat 4 - Malicious Input / Cross-Site Scripting

**STRIDE Category:** Tampering

**Affected Component:** NodeGoat Web Application / User Browser

**Attack Scenario:**  
An attacker may submit malicious content through application input fields. If the application displays this content without proper encoding or sanitization, malicious script content could execute in another user's browser.

**Likelihood:** 3 - High

**Impact:** 2 - Medium

**Risk Score:** 6 - High

**Justification:**  
The NodeGoat application receives and displays user-controlled data. Unsafe handling of this data could affect other application users.

**Planned Mitigation:**  
Apply input validation and safe output encoding/sanitization before displaying user-controlled content.

**Control Location:**  
Input-processing and output-rendering code. The exact file will be recorded after the vulnerability is verified.

---

## 3. Threat-to-Control Summary

| ID | Threat | STRIDE | Likelihood | Impact | Risk | Planned Control |
|---|---|---|---:|---:|---|---|
| T1 | Authentication/session impersonation | Spoofing | 2 | 3 | High (6) | Secure authentication and session validation |
| T2 | Unauthorized parameter/data modification | Tampering | 3 | 3 | High (9) | Authorization, ownership checks and validation |
| T3 | Sensitive information disclosure | Information Disclosure | 2 | 2 | Medium (4) | Safe error handling and access control |
| T4 | Malicious input / XSS | Tampering | 3 | 2 | High (6) | Input validation and output encoding |

---

## 4. Relationship to Architecture

The threats were identified using the system trust boundaries:

1. External User / Browser -> NodeGoat Web Application
2. NodeGoat Web Application -> MongoDB Database

Input crossing these trust boundaries must not automatically be trusted.

The threat model will be updated after the four assignment vulnerabilities are confirmed and the exact mitigation locations in the source code are identified.