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
4. **Modifying Data**: Add, edit, or delete talks and interests using the respective table actions.
5. **Calculating Demand**: Click **"Calculate Demand"** (`#calculate-btn`) in the top navigation header to run validations and recompute board results manually.
6. **Handling Errors**: If an invalid entry exists (e.g. referencing an invalid Talk ID or entering negative capacity), an error banner appears displaying validation messages with attendee and talk details.
7. **Resetting Data**: Click **"Reset"** in the top navigation header at any time to revert back to default demo state and recalculate metrics.

---