import { Navigate, Route, Routes } from 'react-router-dom';
import { Home, Catalog, Detail } from '../pages/Store';
import { Colors, Quiz, Translator, Advisor } from '../pages/Beauty';
import { Cart, Checkout, Orders, OrderDetail } from '../pages/Commerce';
import { Account, Favorites } from '../pages/Account';
import { Admin } from '../pages/Admin';
import { Stores } from '../pages/Stores';
import { useShop } from '../context/Shop';
import type { ReactElement } from 'react';
function Guard({ children, admin = false }: {
    children: ReactElement;
    admin?: boolean;
}) {
    const s = useShop();
    if (!s.ready)
        return null;
    return s.user && (!admin || s.admin) ? children : <Navigate to="/account" replace/>;
}
export function AppRoutes() {
    const s = useShop();
    return <Routes>
    <Route path="/home" element={<Home />}/>
    <Route path="/catalog" element={<Catalog />}/>
    <Route path="/product/:id" element={<Detail />}/>
    <Route path="/colors" element={<Colors />}/>
    <Route path="/questionnaire" element={<Quiz />}/>
    <Route path="/translator" element={<Translator />}/>
    <Route path="/advisor" element={<Advisor />}/>
    <Route path="/cart" element={s.admin ? <Navigate to="/admin" replace/> : <Cart />}/>
    <Route path="/checkout" element={s.admin ? <Navigate to="/admin" replace/> : <Checkout />}/>
    <Route path="/account" element={<Account />}/>
    <Route path="/orders" element={<Guard>
        <Orders />
        </Guard>}/>
    <Route path="/orders/:id" element={<Guard>
        <OrderDetail />
        </Guard>}/>
    <Route path="/favorites" element={<Guard>
        <Favorites />
        </Guard>}/>
    <Route path="/admin" element={<Guard admin>
        <Admin />
        </Guard>}/>
    <Route path="/stores" element={<Stores />}/>
    <Route path="*" element={<Navigate to="/home" replace/>}/>
    </Routes>;
}
