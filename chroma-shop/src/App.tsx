import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonToast, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, gridOutline, colorPaletteOutline, bagOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { ShopProvider, useShop } from './context/Shop';
import { Navigate, Route } from 'react-router-dom';
import { Home, Catalog, Detail } from './pages/Store';
import { Colors, Quiz, Translator, Advisor } from './pages/Beauty';
import { Cart, Checkout, Orders, OrderDetail } from './pages/Commerce';
import { Account, Favorites } from './pages/Account';
import { Admin } from './pages/Admin';
import { Stores } from './pages/Stores';
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
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/chroma.css';
import './theme/shop.css';
setupIonicReact();
function Shell() {
    const s = useShop();
    return <IonReactRouter>
    <IonTabs>
    <IonRouterOutlet>
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
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
        {[['home', 'Inicio', homeOutline], ['catalog', 'Tienda', gridOutline], ['colors', 'Mis colores', colorPaletteOutline], (s.admin ? ['admin', 'Administración', settingsOutline] : ['cart', 'Carrito', bagOutline]), ['account', 'Cuenta', personOutline]].map(([id, label, icon]) => <IonTabButton key={id} tab={id} href={'/' + id} className={id === 'colors' ? 'central' : ''}>
        <IonIcon icon={icon}/>
        <IonLabel>
        {label}
        {id === 'cart' && Object.values(s.cart).reduce((a, b) => a + b, 0) > 0 ? ' (' + Object.values(s.cart).reduce((a, b) => a + b, 0) + ')' : ''}
        </IonLabel>
        </IonTabButton>)}
    </IonTabBar>
    </IonTabs>
    <IonToast isOpen={!!s.notice} message={s.notice} duration={1800} onDidDismiss={() => s.setNotice('')}/>
    </IonReactRouter>;
}
export default function App() {
    return <IonApp>
    <ShopProvider>
    <Shell />
    </ShopProvider>
    </IonApp>;
}
