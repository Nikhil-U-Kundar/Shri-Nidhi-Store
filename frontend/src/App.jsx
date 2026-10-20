import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminCatalog from './pages/AdminCatalog';
import AdminPayment from './pages/AdminPayment';
import Passbook from './pages/Passbook';
import Store from './pages/Store';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/store" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/store" element={<Store />} />
              <Route path="/passbook" element={<Passbook />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/items" element={<AdminCatalog />} />
              <Route path="/admin/payment/:id" element={<AdminPayment />} />
              <Route path="*" element={<Navigate to="/store" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
