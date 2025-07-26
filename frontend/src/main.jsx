import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import NotFound from './components/Notfound.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
  },
  // {
  //   path: "products",
  //   element: <Products />,
  //   errorElement: <NotFound />,
  // },
  // {
  //   path: "products/:id",
  //   element: <Product />,
  //   errorElement: <NotFound />,
  // },
  // {
  //   path: "login",
  //   element: <Login />,
  //   errorElement: <NotFound />,
  // },
  // {
  //   path: "register",
  //   element: <Register />,
  //   errorElement: <NotFound />,
  // },
  // {
  //   path: "cart/:userId",
  //   element: <Cart />,
  //   errorElement: <NotFound />,
  // },
  // {
  //   path: "profile/:userId",
  //   element: <Profile />,
  //   errorElement: <NotFound />,
  // },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
