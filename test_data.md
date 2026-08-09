# TechFest Session Demand Test Data (Alternative Dataset)

This document contains an alternative, fresh test dataset for testing the TechFest Session Demand Board with diverse status classifications (`OVER_CAPACITY`, `FULL`, and `SPARE`).

## 1. Talk Sessions

| Talk ID | Talk Name | Talk Instances | Seats per Instance | Total Capacity |
| :--- | :--- | :---: | :---: | :---: |
| T10 | AI & Neural Networks | 2 | 3 | 6 |
| T11 | Cloud Native DevOps | 2 | 4 | 8 |
| T12 | Cybersecurity Defense | 1 | 4 | 4 |
| T13 | Rust & Systems Architecture | 2 | 2 | 4 |
| T14 | Mobile UI/UX Masterclass | 3 | 3 | 9 |
| T15 | Quantum Computing Fundamentals | 1 | 2 | 2 |

## 2. Attendee Interests

### Aggregated View

| Attendee ID | Interested Talk IDs |
| :--- | :--- |
| A101 | T10, T11, T12 |
| A102 | T10, T11, T12, T13 |
| A103 | T10, T11, T12 |
| A104 | T10, T11, T12, T13 |
| A105 | T10, T11, T12 |
| A106 | T10, T11, T13 |
| A107 | T10, T12, T14 |
| A108 | T10, T12, T14 |
| A109 | T11, T14 |
| A110 | T11, T14 |
| A111 | T13, T15 |
| A112 | T14 |

### Expanded (Attendee ID, Talk ID) Interest Pairs

Each listed talk creates one `(Attendee ID, Talk ID)` interest pair:

| Attendee ID | Talk ID |
| :--- | :--- |
| A101 | T10 |
| A101 | T11 |
| A101 | T12 |
| A102 | T10 |
| A102 | T11 |
| A102 | T12 |
| A102 | T13 |
| A103 | T10 |
| A103 | T11 |
| A103 | T12 |
| A104 | T10 |
| A104 | T11 |
| A104 | T12 |
| A104 | T13 |
| A105 | T10 |
| A105 | T11 |
| A105 | T12 |
| A106 | T10 |
| A106 | T11 |
| A106 | T13 |
| A107 | T10 |
| A107 | T12 |
| A107 | T14 |
| A108 | T10 |
| A108 | T12 |
| A108 | T14 |
| A109 | T11 |
| A109 | T14 |
| A110 | T11 |
| A110 | T14 |
| A111 | T13 |
| A111 | T15 |
| A112 | T14 |

## 3. Expected Calculation Results

| Priority Rank | Talk ID | Talk Name | Demand | Capacity | Delta ($\Delta$) | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | T12 | Cybersecurity Defense | 7 | 4 | +3 | 🔴 `OVER_CAPACITY` |
| 2 | T10 | AI & Neural Networks | 8 | 6 | +2 | 🔴 `OVER_CAPACITY` |
| 3 | T11 | Cloud Native DevOps | 8 | 8 | 0 | 🟡 `FULL` |
| 4 | T13 | Rust & Systems Architecture | 4 | 4 | 0 | 🟡 `FULL` |
| 5 | T14 | Mobile UI/UX Masterclass | 5 | 9 | -4 | 🟢 `SPARE` |
| 6 | T15 | Quantum Computing Fundamentals | 1 | 2 | -1 | 🟢 `SPARE` |

## 4. Error Validation Test Cases

These test cases cover all strict input validation rules and error conditions handled by the system.

### Overview Table

| Test Case ID | Error Code | Category | Scenario / Invalid Input | Expected Validation Error Message |
| :---: | :--- | :--- | :--- | :--- |
| `ERR-01` | `INVALID_TALK` | Talk Data | Talk ID is empty string or whitespace (`""`) | `INVALID_TALK — Row X has a blank Talk ID.` |
| `ERR-02` | `DUPLICATE_TALK_ID` | Talk Data | Two talk rows share the exact same ID (`T10`) | `DUPLICATE_TALK_ID — "T10" appears in rows 1 and 3.` |
| `ERR-03` | `INVALID_CAPACITY` | Talk Data | Talk `instances` is 0 or negative (`instances: 0`) | `INVALID_CAPACITY — Row X ("T10"): instances must be a positive integer, got "0".` |
| `ERR-04` | `INVALID_CAPACITY` | Talk Data | Talk `seats` is non-integer or negative (`seats: -2`) | `INVALID_CAPACITY — Row X ("T10"): seats must be a positive integer, got "-2".` |
| `ERR-05` | `INVALID_INTEREST` | Interest Data | Attendee ID is empty string or whitespace (`""`) | `INVALID_INTEREST — Row X has a blank Attendee ID.` |
| `ERR-06` | `DUPLICATE_INTEREST` | Interest Data | Duplicate `(attendeeId, talkId)` pair (`A101`, `T10`) | `DUPLICATE_INTEREST — Row X: pair (A101, T10) already exists.` |
| `ERR-07` | `UNKNOWN_TALK` | Interest Data | Interest references non-existent Talk ID (`T99`) | `UNKNOWN_TALK — Row X: attendee "A101" registered for unknown talk "T99".` |

---

### Detailed Test Payload Specifications

#### Test Case ERR-01: Blank Talk ID (`INVALID_TALK`)
**Talk Data:**
| Talk ID | Talk Name | Instances | Seats/Instance |
| :--- | :--- | :---: | :---: |
| *(blank)* | Unnamed Session | 2 | 3 |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays: `INVALID_TALK — Row 1 has a blank Talk ID.`

---

#### Test Case ERR-02: Duplicate Talk ID (`DUPLICATE_TALK_ID`)
**Talk Data:**
| Talk ID | Talk Name | Instances | Seats/Instance |
| :--- | :--- | :---: | :---: |
| T10 | AI & Neural Networks | 2 | 3 |
| T10 | Duplicate AI Track | 1 | 2 |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays: `DUPLICATE_TALK_ID — "T10" appears in rows 1 and 2.`

---

#### Test Case ERR-03 & ERR-04: Invalid Capacity Constraints (`INVALID_CAPACITY`)
**Talk Data:**
| Talk ID | Talk Name | Instances | Seats/Instance | Invalid Field |
| :--- | :--- | :---: | :---: | :--- |
| T10 | Zero Instances Session | **0** | 3 | `instances = 0` |
| T11 | Negative Seats Session | 2 | **-4** | `seats = -4` |
| T12 | Non-Integer Capacity | **1.5** | 2 | `instances = 1.5` |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays all 3 `INVALID_CAPACITY` error lines simultaneously.

---

#### Test Case ERR-05: Blank Attendee ID (`INVALID_INTEREST`)
**Attendee Interest Data:**
| Attendee ID | Talk ID |
| :--- | :--- |
| *(blank)* | T10 |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays: `INVALID_INTEREST — Row 1 has a blank Attendee ID.`

---

#### Test Case ERR-06: Duplicate Interest Pairing (`DUPLICATE_INTEREST`)
**Attendee Interest Data:**
| Row | Attendee ID | Talk ID | Notes |
| :---: | :--- | :--- | :--- |
| 1 | A101 | T10 | First registration |
| 2 | A101 | T10 | **Duplicate pair** |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays: `DUPLICATE_INTEREST — Row 2: pair (A101, T10) already exists.`

---

#### Test Case ERR-07: Registration for Non-Existent Talk (`UNKNOWN_TALK`)
**Valid Talks:** `T10`, `T11`  
**Attendee Interest Data:**
| Attendee ID | Talk ID | Status |
| :--- | :--- | :--- |
| A101 | **T99** | `T99` does not exist in Talks table |

**Expected Outcome:**
- Validation Fails (`valid: false`)
- Banner displays: `UNKNOWN_TALK — Row 1: attendee "A101" registered for unknown talk "T99".`
