import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/HomePage';
import ItineraryPage from '../pages/ItineraryPage';
import BudgetPage from '../pages/BudgetPage';
import SettingsPage from '../pages/SettingsPage';
import ConnectionTestPage from '../pages/ConnectionTestPage';
import MapPage from '../pages/MapPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <HomePage />
      },

      {
        path: 'itinerary/:id?',
        element: <ItineraryPage />
      },
      {
        path: 'itineraries',
        element: <ItineraryPage />
      },
      {
        path: 'budget/:itineraryId',
        element: <BudgetPage />
      },
      {
        path: 'budgets/:itineraryId',
        element: <BudgetPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'connection-test',
        element: <ConnectionTestPage />
      },
      {
        path: 'map',
        element: <MapPage />
      }
    ]
  }
]);

export default router;