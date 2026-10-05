import {
  useState,
} from "react";

import {
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  adminLoginApi,
} from "../api/authApi";


export default function Login({
  onLogin,
}) {

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  const handleSubmit =
    async (e) => {

    e.preventDefault();

    setError("");


    if (!email || !password) {

      setError(
        "Enter email and password."
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await adminLoginApi({
          email,
          password,
        });


      const token =
        response.data
          ?.data
          ?.token;


      if (!token) {

        throw new Error(
          "Token not received."
        );

      }


      localStorage.setItem(
        "admin_token",
        token
      );


      onLogin();


    } catch (error) {

      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to login."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">

      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="mb-7 text-center">
<div className="flex flex-col items-center">

  <img
    src="/vaibhavi.png"
    alt="Wardrobe"
    className="h-[110px] w-auto max-w-[220px] object-contain"
  />

  <h1 className="mt-3 text-2xl font-black text-[#ee027e]">
    Admin Login
  </h1>

</div>
          {/* <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
            <UtensilsCrossed
              size={25}
            />
          </div>


          <h1 className="mt-4 text-2xl font-black text-slate-900">
           wardrobe
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Admin Login
          </p> */}

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Email
          </label>


          <div className="relative">

            <Mail
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10"
              placeholder="Enter admin email"
              
            />

          </div>


          <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
            Password
          </label>


          <div className="relative">

            <LockKeyhole
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10"
              // className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none focus:border-orange-500"
              placeholder="Password"
            />

          </div>


          {error && (

            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>

          )}


          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-12 w-full rounded-xl bg-[#ee027e] text-sm font-bold text-white transition hover:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-60"
            // className="mt-6 h-12 w-full rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >

            {loading
              ? "Signing in..."
              : "Login"}

          </button>

        </form>

      </div>

    </main>
  );
}

