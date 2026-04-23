# AI Rules & Tech Stack

## Tech Stack
- **React 19**: Modern frontend library for building user interfaces.
- **TypeScript**: Strongly typed programming language that builds on JavaScript.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Lucide React**: Clean and consistent icon library for React.
- **Google Generative AI (@google/genai)**: Integration with Gemini models for advanced AI capabilities.
- **Firebase**: Backend-as-a-Service for Authentication, Firestore (database), and Storage.
- **Vite**: Fast build tool and development server.
- **React Router**: Declarative routing for React applications.
- **shadcn/ui & Radix UI**: High-quality, accessible UI components and primitives.

## Library Usage Rules
- **UI Components**: Always prioritize using **shadcn/ui** components. If a specific component is not available, use **Radix UI** primitives to build it.
- **Styling**: Use **Tailwind CSS** utility classes for all styling. Avoid writing custom CSS unless absolutely necessary.
- **Icons**: Use **Lucide React** for all icons to maintain visual consistency.
- **Navigation**: Use **React Router** for handling different pages and routes. Keep route definitions in `src/App.tsx`.
- **State Management**: Use standard React hooks (`useState`, `useContext`, `useReducer`) for state management. For complex global state, use React Context.
- **AI Integration**: Use the `@google/genai` package for all interactions with Gemini models.
- **Backend Services**: Use **Firebase** for user authentication, data persistence (Firestore), and file storage.
- **File Structure**: 
  - Put pages in `src/pages/`.
  - Put reusable components in `src/components/`.
  - Put services and utility functions in `src/services/`.
  - Put types and interfaces in `src/types.ts` or specific type files.
