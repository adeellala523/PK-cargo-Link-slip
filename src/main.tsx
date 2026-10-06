import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Remove the truck loading splash once React has mounted
requestAnimationFrame(() => {
  setTimeout(() => {
    const splash = document.getElementById('pkcl-splash');
    if (splash) {
      splash.classList.add('pkcl-splash-hide');
      setTimeout(() => splash.remove(), 500);
    }
  }, 300);
});
