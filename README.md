# TechFest Session Demand Board 📊

A real-time event session demand tracking, capacity management, and conflict resolution application built for conference organizers, session planners, and TechFest administrators. 

This interactive dashboard allows organizers to monitor session popularity, track room capacities, detect capacity overruns in real time, and adjust talk schedules dynamically.

---

## 🌟 Key Features

- **Session Talk Management**:
  - Add, edit, and delete tech talk sessions.
  - Define Talk ID, Name, Number of Instances, and Seats per Instance.
  - Automatic calculation of total talk capacity ($Capacity = Instances \times Seats$).

- **Attendee Interest Tracking**:
  - Record attendee session preferences (Attendee ID $\leftrightarrow$ Talk ID).
  - Add, edit, and remove individual attendee interest records.
  - Live aggregation of demand counts for each talk.

- **Real-Time Results & Demand Dashboard**:
  - **Demand Metrics**: Live calculation of $\Delta = Demand - Capacity$.
  - **Automated Status Badging**:
    - 🔴 `OVER_CAPACITY` ($\Delta > 0$): Highlights sessions needing extra instances or larger rooms.
    - 🟡 `FULL` ($\Delta = 0$): Indicates sessions filled exactly to capacity.
    - 🟢 `SPARE` ($\Delta < 0$): Identifies sessions with open seat capacity.
  - **Prioritized Sorting**: Automatic ranking by Status Priority (`OVER_CAPACITY` $\rightarrow$ `FULL` $\rightarrow$ `SPARE`), then by Demand (descending), then by Talk ID (ascending).
  - **Visual Capacity Bars**: Progress indicator displaying demand relative to maximum capacity limit.
  - **Status Overview Pills**: Quick summary counter of sessions by status category.

- **Strict Input Validation & Error Handling**:
  - Real-time error detection with actionable feedback banners.
  - Prevents blank or duplicate Talk IDs.
  - Enforces positive integer constraints for instances and seat capacities.
  - Prevents duplicate attendee interest pairings.
  - Rejects interest entries mapped to non-existent Talk IDs (`UNKNOWN_TALK`).

- **Demo State & One-Click Reset**:
  - Pre-loaded sample dataset featuring clinic, workshop, critique, and debugging sessions.
  - Instant reset button to restore default demonstration state.

- **Modern Glassmorphism UI & Dual Theme Toggle**:
  - Toggle seamlessly between **Dark Mode** and **Light Mode** using the header toggle button (`#theme-toggle-btn`).
  - Persistent theme preference saved in `localStorage` (`techfest_theme`) with intelligent fallback to system preferences (`prefers-color-scheme`).
  - Fluid 300ms CSS transitions for smooth theme switching without visual jumps.
  - Custom glassmorphic design tailored for both dark (glowing deep slate glass) and light (soft translucent white cards with crisp slate typography) modes.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with custom glassmorphism components
- **Linting**: [Oxlint](https://oxc.rs/)
- **Typography**: [Inter Font](https://fonts.google.com/specimen/Inter)

---

## 📁 Project Structure

```
TechFest Session Demand Board/
├── index.html              # HTML shell & Google Fonts configuration
├── package.json            # Scripts and project dependencies
├── postcss.config.js       # PostCSS plugins for Tailwind CSS
├── tailwind.config.js      # Tailwind theme extensions & utility config
├── vite.config.js          # Vite server and React plugin setup
├── .oxlintrc.json          # Oxlint configuration
├── public/                 # Static public assets
└── src/
    ├── App.jsx             # Main application, state management, validation & calculation logic
    ├── index.css           # Tailwind base styles, custom glass UI classes, scrollbar styles
    └── main.jsx            # Application entry point
```

Key Source Files:
- [src/App.jsx](file:///Users/varunshankar/Desktop/TechFest%20Session%20Demand%20Board/src/App.jsx): Contains components (`App`, `Modal`, `TalkFormModal`, `InterestFormModal`, `StatusBadge`, `DemandBar`) and pure utility functions (`validateTalks`, `validateInterests`, `validateAll`, `calculateResults`, `sortResults`).
- [src/index.css](file:///Users/varunshankar/Desktop/TechFest%20Session%20Demand%20Board/src/index.css): Defines design tokens, glass card variants, glass input controls, and custom button utilities.

---

## 📐 Calculation & Sorting Logic

### Capacity & Delta Computation
For each talk $t$:
$$Capacity(t) = Instances(t) \times Seats(t)$$
$$Delta(t) = Demand(t) - Capacity(t)$$

### Status Classification
$$\text{Status}(t) = \begin{cases} \text{OVER\_CAPACITY} & \text{if } Delta(t) > 0 \\ \text{FULL} & \text{if } Delta(t) = 0 \\ \text{SPARE} & \text{if } Delta(t) < 0 \end{cases}$$

### Priority Sorting Hierarchy
1. **Status Priority Group**: `OVER_CAPACITY` (Priority 0) $\rightarrow$ `FULL` (Priority 1) $\rightarrow$ `SPARE` (Priority 2)
2. **Demand Volume**: Higher demand counts ranked first.
3. **Talk ID Alphabetical**: Ascending sort by Talk ID string (e.g., `T01` before `T02`).

---

## 📋 Data Schemas & Validation Rules

### Data Schemas

#### Talk Object
```json
{
  "id": "T01",
  "name": "Line Follower Clinic",
  "instances": 2,
  "seats": 2
}
```

#### Interest Object
```json
{
  "attendeeId": "A01",
  "talkId": "T01"
}
```

#### Result Object
```json
{
  "talkId": "T01",
  "talkName": "Line Follower Clinic",
  "demand": 5,
  "capacity": 4,
  "delta": 1,
  "status": "OVER_CAPACITY"
}
```

### Validation Error Codes

| Error Code | Trigger Condition | Example Error Message |
| :--- | :--- | :--- |
| `INVALID_TALK` | Talk ID is empty or whitespace-only | `INVALID_TALK — Row 1 has a blank Talk ID.` |
| `DUPLICATE_TALK_ID` | Multiple talks share the same ID | `DUPLICATE_TALK_ID — "T01" appears in rows 1 and 3.` |
| `INVALID_CAPACITY` | `instances` or `seats` is non-integer or $\le 0$ | `INVALID_CAPACITY — Row 1 ("T01"): instances must be a positive integer, got "0".` |
| `INVALID_INTEREST` | Attendee ID is blank | `INVALID_INTEREST — Row 2 has a blank Attendee ID.` |
| `DUPLICATE_INTEREST` | Duplicate `(attendeeId, talkId)` pair exists | `DUPLICATE_INTEREST — Row 4: pair (A01, T01) already exists.` |
| `UNKNOWN_TALK` | `talkId` does not match any entry in Talks table | `UNKNOWN_TALK — Row 5: talk "T99" does not exist in the Talks table.` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone or download the repository directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Server

Start the local dev server with HMR (Hot Module Replacement):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Building for Production

Build optimized production assets:
```bash
npm run build
```
Output files will be generated in the `dist/` folder.

To preview the production build locally:
```bash
npm run preview
```

### Linting

Run Oxlint to check code quality and syntax rules:
```bash
npm run lint
```

---

## 💻 Usage Guide

1. **Viewing Initial Board**: Upon launch, default talks (`T01`-`T04`) and sample attendee interests (`A01`-`A08`) are loaded into the tables.
2. **Toggling Themes**: Click **"Light Mode"** or **"Dark Mode"** in the top navigation header (`#theme-toggle-btn`) to toggle visual themes. Your preference is automatically saved.
3. **Adding a Talk**: Click the **"+ Add"** button in the Talks section header to launch the modal form. Provide ID, Name, Instances, and Seats/Instance.
4. **Modifying Capacity**: Click the edit icon on any talk row to change its instances or seat count. Results will update instantly.
5. **Recording Attendee Interest**: Click **"+ Add"** in the Interests section header to register an attendee's session preference.
6. **Handling Errors**: If an invalid entry is created (e.g. referencing an invalid Talk ID or entering negative capacity), an error banner appears and results calculations pause safely until corrected.
7. **Resetting Data**: Click **"Reset"** in the top navigation header at any time to revert back to default demo state.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

