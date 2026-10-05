import {
  lazy,
  Suspense,
  useState,
} from "react";

import {
  adminLogoutApi,
} from "./api/authApi";


/* =========================================
   LAZY LOAD PAGES

   Login page first load lo AdminLayout,
   MenuPage, OrdersPage load avvakunda
   lazy loading.
========================================= */

const Login = lazy(() =>
  import("./pages/Login")
);

const AdminLayout = lazy(() =>
  import("./components/AdminLayout")
);


/* =========================================
   APP
========================================= */

export default function App() {

  /* =========================================
     CHECK ADMIN TOKEN
  ========================================= */

  const [loggedIn, setLoggedIn] =
    useState(() => {

      const token =
        localStorage.getItem(
          "admin_token"
        );

      return Boolean(token);

    });


  /* =========================================
     LOGIN SUCCESS
  ========================================= */

  const handleLogin = () => {

    setLoggedIn(true);

  };


  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = async () => {

    try {

      /*
       * Logout API call
       */
      await adminLogoutApi();

    } catch (error) {

      /*
       * Even if backend logout API fails,
       * remove frontend authentication.
       */
      console.error(
        "Logout API error:",
        error
      );

    } finally {

      localStorage.removeItem(
        "admin_token"
      );

      setLoggedIn(false);

    }

  };


  /* =========================================
     LOADING SCREEN
  ========================================= */

  const loader = (

    <div className="flex min-h-screen items-center justify-center bg-slate-50">

      <div className="text-center">

        <div
          className="
            mx-auto
            h-9
            w-9
            animate-spin
            rounded-full
            border-4
            border-slate-200
            border-t-orange-500
          "
        />

        <p className="mt-3 text-sm font-semibold text-slate-500">
          Loading...
        </p>

      </div>

    </div>

  );


  /* =========================================
     NOT LOGGED IN
  ========================================= */

  if (!loggedIn) {

    return (

      <Suspense fallback={loader}>

        <Login
          onLogin={handleLogin}
        />

      </Suspense>

    );

  }


  /* =========================================
     LOGGED IN
  ========================================= */

  return (

    <Suspense fallback={loader}>

      <AdminLayout
        onLogout={handleLogout}
      />

    </Suspense>

  );

}

// import {
//   useState,
// } from "react";

// import Login from "./pages/Login";
// import AdminLayout from "./components/AdminLayout";

// export default function App() {
//   const [
//     loggedIn,
//     setLoggedIn,
//   ] = useState(
//     Boolean(
//       localStorage.getItem(
//         "admin_token"
//       )
//     )
//   );

//   const handleLogin =
//     () => {
//       setLoggedIn(true);
//     };

//   const handleLogout =
//     () => {
//       localStorage.removeItem(
//         "admin_token"
//       );

//       setLoggedIn(false);
//     };

//   if (!loggedIn) {
//     return (
//       <Login
//         onLogin={
//           handleLogin
//         }
//       />
//     );
//   }

//   return (
//     <AdminLayout
//       onLogout={
//         handleLogout
//       }
//     />
//   );
// }