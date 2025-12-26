# Atlas Vision Editor

The **Atlas Vision Editor** is a specialized internal tool designed to manage the `cameras.csv` database used by the [Atlas Vision Sensor Comparison Tool](https://github.com/HumanMint/atlas-vision).

It provides a hierarchical, drag-and-drop interface for editing camera brands, models, and sensor modes, ensuring data consistency and ease of updates.

## Features

- **Hierarchical Editing:** Organized view of Brands > Models > Sensor Modes.
- **Drag-and-Drop Sorting:** Easily reorder modes to prioritize common formats.
- **Data Validation:** Ensures `cameras.csv` adheres to the required format (`Brand, Model, Mode, Width, Height, Resolution, NativeAnamorphic, SupportedSqueezes`).
- **Interactive UI:** Toggle anamorphic support and select squeeze ratios visually.
- **Export:** Generates a formatted CSV file ready for the Atlas Vision tool.

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **CSV Parsing:** PapaParse
- **Drag & Drop:** dnd-kit
- **Icons:** Lucide React

## Local Development

To run the editor locally on your machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/HumanMint/atlas-vision-editor.git
    cd atlas-vision-editor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173`.

4.  **Build for production:**
    ```bash
    npm run build
    ```

## Deployment (GitHub Pages)

This project is configured to deploy to GitHub Pages.

### One-time Setup
1.  Ensure the `homepage` field in `package.json` matches your repository URL.
2.  Go to your GitHub repository settings > **Pages**.
3.  Under **Build and deployment**, select **Source** as `Deploy from a branch`.
4.  After the first deploy, select the `gh-pages` branch.

### To Deploy
Run the following command to build and deploy the application:

```bash
npm run deploy
```

This will push the build artifacts to the `gh-pages` branch, making the editor accessible on the web.
