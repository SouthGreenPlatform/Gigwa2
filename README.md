# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```

## Technologies Used

- **React**: Library for building user interfaces.
- **TypeScript**: Superset of JavaScript with static typing.
- **Vite**: Fast build tool for modern web development.
- **Sass**: CSS preprocessor for better styling organization.
- **Bootstrap**: CSS framework for responsive design.

## Prerequisites

Make sure you have the following tools installed:

- **Node.js**: Version `22.0.0` or higher.
- **npm**: Version `10.5.1` or higher.
- **Bootstrap**: Version `5.3.5` or higher.
- **Sass**: Version `1.87.0`or higher.

## Sass as a Development Dependency

To use SCSS/Sass in your project and enable automatic compilation and hot reload with Vite, install Sass as a development dependency:

```bash
npm install -D sass
```

## Additional Dependencies for Login Page

If you are implementing a login page that uses API requests, you will need the following dependencies:

- **axios**: For making HTTP requests.

  ```bash
  npm install axios
  ```

- **@types/axios**: (Optional) Type definitions for axios.
  > Note: Recent versions of `axios` already include TypeScript types, so this may not be necessary.
  ```bash
  npm install --save-dev @types/axios
  ```

## IGV (Integrative Genomics Viewer)

This project uses [igv](https://www.npmjs.com/package/igv) for genome visualization.  
To install it, run:

```bash
npm install igv
```

## Other Common Dependencies

Depending on your project setup, you may also need:

- **react-router-dom**: For routing between pages.

  ```bash
  npm install react-router-dom
  ```

If using TypeScript:

```bash
npm install --save-dev @types/react-router-dom
```

- **react-bootstrap** and **bootstrap**: For UI components and styles.

  ```bash
  npm install react-bootstrap bootstrap
  ```

  If using TypeScript:

  ```bash
  npm install --save-dev @types/react-bootstrap
  ```

> **Tip:**  
> If you see errors like "module not found" when importing a package, install the corresponding dependency as shown above.

---

## How to Run the Project

1. **Clone the repository**

```bash
git clone
```

2. **Navigate to the project directory**

```bash
cd gigwareact
```

3. **Install dependencies**

```bash
npm install
```

4. **Compile SCSS files**
<!--Vite compiles automatically the scss file \-->

```bash
npm install -g sass
sass --quiet-deps d:/gigwareact/src/styles/App.scss d:/gigwareact/src/styles/App.css
```

<!-- quiet deps is used to turn off the issues tied to the scss migration -->

5. **Start the development server**

```bash
npm run dev
```

6. **Access the project in your browser**

```bash
http://localhost:5173
```

## Check code issues and formatting code

**Check and shows the fix issues**

```bash
npm run lint
```

**Check and automatically fix lint issues**

```bash
npm run lint:fix
```

**Format all code with Prettier**

```bash
npm run format
```

Alternatively, you can run Prettier directly

```bash
npx prettier --write .
```
