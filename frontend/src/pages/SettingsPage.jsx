import {
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  PackageCheck,
  Save,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getSettingsApi,
  saveRazorpayApi,
  saveShiprocketApi,
  testRazorpayApi,
  testShiprocketApi,
} from "../api/settingsApi";


/* =========================================================
   BRAND
========================================================= */

const BRAND_COLOR = "#ee027e";
const BRAND_DARK = "#d60272";


/* =========================================================
   TOGGLE
========================================================= */

const Toggle = ({
  enabled,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!enabled);
        }
      }}
      className={`
        relative
        h-6
        w-11
        shrink-0
        rounded-full
        transition-all
        duration-300
        focus:outline-none
        focus:ring-4
        focus:ring-[#ee027e]/10
        disabled:cursor-not-allowed
        disabled:opacity-60

        ${
          enabled
            ? "bg-[#ee027e]"
            : "bg-slate-200"
        }
      `}
    >
      <span
        className={`
          absolute
          top-1
          h-4
          w-4
          rounded-full
          bg-white
          shadow-sm
          transition-all
          duration-300

          ${
            enabled
              ? "left-6"
              : "left-1"
          }
        `}
      />
    </button>
  );
};


/* =========================================================
   NORMAL INPUT
========================================================= */

const Field = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  return (
    <label className="block">
      <span
        className="
          mb-1.5
          block
          text-xs
          font-semibold
          text-slate-700
        "
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="
          h-10
          w-full
          rounded-lg
          border
          border-slate-200
          bg-slate-50
          px-3.5
          text-[13px]
          text-slate-800
          outline-none
          transition-all
          duration-200

          placeholder:text-slate-400

          hover:border-slate-300

          focus:border-[#ee027e]
          focus:bg-white
          focus:ring-4
          focus:ring-[#ee027e]/10

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-500
        "
      />
    </label>
  );
};


/* =========================================================
   PASSWORD / SECRET INPUT
========================================================= */

const SecretField = ({
  label,
  value,
  onChange,
  show,
  setShow,
  placeholder,
  disabled = false,
}) => {
  return (
    <div>
      <label
        className="
          mb-1.5
          block
          text-xs
          font-semibold
          text-slate-700
        "
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          disabled={disabled}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          className="
            h-10
            w-full
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            px-3.5
            pr-10
            text-[13px]
            text-slate-800
            outline-none
            transition-all
            duration-200

            placeholder:text-slate-400

            hover:border-slate-300

            focus:border-[#ee027e]
            focus:bg-white
            focus:ring-4
            focus:ring-[#ee027e]/10

            disabled:cursor-not-allowed
            disabled:bg-slate-100
          "
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setShow(
              (current) => !current
            )
          }
          className="
            absolute
            right-2
            top-1/2
            flex
            h-7
            w-7
            -translate-y-1/2
            items-center
            justify-center
            rounded-md
            text-slate-400
            transition

            hover:bg-[#ee027e]/5
            hover:text-[#ee027e]
          "
        >
          {show ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>
    </div>
  );
};


/* =========================================================
   INTEGRATION CARD HEADER
========================================================= */

const IntegrationHeader = ({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  disabled,
}) => {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-slate-100
        px-4
        py-3.5
        sm:px-5
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-[#ee027e]/10
            text-[#ee027e]
          "
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <h2
              className="
                text-sm
                font-bold
                text-slate-900
                sm:text-[15px]
              "
            >
              {title}
            </h2>

            {enabled && (
              <span
                className="
                  rounded-full
                  bg-[#ee027e]/10
                  px-2
                  py-0.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#ee027e]
                "
              >
                Enabled
              </span>
            )}
          </div>

          <p
            className="
              mt-0.5
              hidden
              text-[11px]
              leading-4
              text-slate-500
              sm:block
            "
          >
            {description}
          </p>
        </div>
      </div>

      <Toggle
        enabled={enabled}
        disabled={disabled}
        onChange={onToggle}
      />
    </div>
  );
};


/* =========================================================
   SETTINGS PAGE
========================================================= */

export default function SettingsPage() {

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    testing,
    setTesting,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState(null);

  const [
    showRazorpaySecret,
    setShowRazorpaySecret,
  ] = useState(false);

  const [
    showShiprocketPassword,
    setShowShiprocketPassword,
  ] = useState(false);


  /* =======================================================
     RAZORPAY
  ======================================================= */

  const [
    razorpay,
    setRazorpay,
  ] = useState({
    enabled: false,
    key_id: "",
    key_secret: "",
    has_secret: false,
  });


  /* =======================================================
     SHIPROCKET
  ======================================================= */

  const [
    shiprocket,
    setShiprocket,
  ] = useState({
    enabled: false,
    email: "",
    password: "",
    pickup_location: "",
    channel_id: "",
    has_password: false,
  });


  /* =======================================================
     MESSAGE
  ======================================================= */

  const showMessage = (
    type,
    text
  ) => {
    setMessage({
      type,
      text,
    });

    window.setTimeout(
      () => {
        setMessage(null);
      },
      4000
    );
  };


  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  const loadSettings =
    async () => {

      try {
        setLoading(true);

        const result =
          await getSettingsApi();

        const data =
          result?.data || {};


        setRazorpay({
          enabled:
            Boolean(
              data?.razorpay
                ?.enabled
            ),

          key_id:
            data?.razorpay
              ?.key_id || "",

          // key_secret: "",
          key_secret:
  data?.razorpay?.key_secret || "",

          has_secret:
            Boolean(
              data?.razorpay
                ?.has_secret
            ),
        });


        setShiprocket({
          enabled:
            Boolean(
              data?.shiprocket
                ?.enabled
            ),

          email:
            data?.shiprocket
              ?.email || "",

          // password: "",
          password:
  data?.shiprocket?.password || "",

          pickup_location:
            data?.shiprocket
              ?.pickup_location ||
            "",

          channel_id:
            data?.shiprocket
              ?.channel_id || "",

          has_password:
            Boolean(
              data?.shiprocket
                ?.has_password
            ),
        });

      } catch (error) {

        console.error(
          "LOAD SETTINGS ERROR:",
          error
        );

        showMessage(
          "error",
          error?.response
            ?.data
            ?.message ||
            "Unable to load settings."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadSettings();
  }, []);


  /* =======================================================
     TEST RAZORPAY
  ======================================================= */

  const handleTestRazorpay =
    async () => {

      try {
        setTesting("razorpay");

        const result =
          await testRazorpayApi();

        showMessage(
          "success",
          result?.message ||
            "Razorpay connection successful."
        );

      } catch (error) {

        console.error(
          "TEST RAZORPAY ERROR:",
          error
        );

        showMessage(
          "error",
          error?.response
            ?.data
            ?.message ||
            "Razorpay connection failed."
        );

      } finally {
        setTesting("");
      }
    };


  /* =======================================================
     TEST SHIPROCKET
  ======================================================= */

  const handleTestShiprocket =
    async () => {

      try {
        setTesting("shiprocket");

        const result =
          await testShiprocketApi();

        showMessage(
          "success",
          result?.message ||
            "Shiprocket connection successful."
        );

      } catch (error) {

        console.error(
          "TEST SHIPROCKET ERROR:",
          error
        );

        showMessage(
          "error",
          error?.response
            ?.data
            ?.message ||
            "Shiprocket connection failed."
        );

      } finally {
        setTesting("");
      }
    };


  /* =======================================================
     SAVE BOTH INTEGRATIONS
  ======================================================= */

  const saveAllIntegrations =
    async () => {

      try {
        setSaving(true);


        /* ===============================
           SAVE RAZORPAY
        =============================== */

        await saveRazorpayApi({
          enabled:
            razorpay.enabled,

          key_id:
            razorpay.key_id,

          key_secret:
            razorpay.key_secret,
        });


        /* ===============================
           SAVE SHIPROCKET
        =============================== */

        await saveShiprocketApi({
          enabled:
            shiprocket.enabled,

          email:
            shiprocket.email,

          password:
            shiprocket.password,

          pickup_location:
            shiprocket
              .pickup_location,

          channel_id:
            shiprocket.channel_id,
        });


        /*
         * User friendly success message.
         */

        showMessage(
          "success",
          "Settings saved successfully."
        );


        await loadSettings();

      } catch (error) {

        console.error(
          "SAVE SETTINGS ERROR:",
          error
        );

        showMessage(
          "error",
          error?.response
            ?.data
            ?.message ||
            "Unable to save settings. Please check the entered details."
        );

      } finally {
        setSaving(false);
      }
    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[300px]
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <Loader2
            size={26}
            className="
              mx-auto
              animate-spin
              text-[#ee027e]
            "
          />

          <p
            className="
              mt-2
              text-xs
              text-slate-500
            "
          >
            Loading settings...
          </p>
        </div>
      </div>
    );
  }


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1400px]
      "
    >

      {/* ===============================================
          PAGE TITLE
      =============================================== */}

      <div className="mb-4">
        <h1
          className="
            text-xl
            font-bold
            tracking-tight
            text-slate-900
            sm:text-2xl
          "
        >
          Settings
        </h1>

        <p
          className="
            mt-1
            text-xs
            text-slate-500
            sm:text-[13px]
          "
        >
          Manage payment and shipping settings for The Wardrobe.
        </p>
      </div>


      {/* ===============================================
          SUCCESS / ERROR MESSAGE
      =============================================== */}

      {message && (
        <div
          className={`
            mb-4
            flex
            items-center
            gap-2.5
            rounded-lg
            border
            px-3.5
            py-2.5
            text-xs
            font-medium

            ${
              message.type ===
              "success"

                ? `
                    border-emerald-200
                    bg-emerald-50
                    text-emerald-700
                  `

                : `
                    border-red-200
                    bg-red-50
                    text-red-700
                  `
            }
          `}
        >
          <CheckCircle2
            size={16}
            className="shrink-0"
          />

          <span>
            {message.text}
          </span>
        </div>
      )}


      {/* ===============================================
          MAIN CONTAINER
      =============================================== */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        <div
          className="
            space-y-5
            p-4
            sm:p-5
            lg:p-6
          "
        >

          {/* ===========================================
              PAYMENT GATEWAY / RAZORPAY
          =========================================== */}

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-[0_1px_2px_rgba(15,23,42,0.03)]
              transition

              hover:border-[#ee027e]/20
              hover:shadow-sm
            "
          >
            <IntegrationHeader
              icon={CreditCard}
              title="Payment Gateway (Razorpay)"
              description="Configure secure online payment processing."
              enabled={razorpay.enabled}
              disabled={saving}
              onToggle={(value) => {
                setRazorpay(
                  (previous) => ({
                    ...previous,
                    enabled: value,
                  })
                );
              }}
            />


            <div
              className="
                p-4
                sm:p-5
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                "
              >
                <Field
                  label="Key ID"
                  value={
                    razorpay.key_id
                  }
                  disabled={saving}
                  onChange={(value) => {
                    setRazorpay(
                      (previous) => ({
                        ...previous,
                        key_id: value,
                      })
                    );
                  }}
                  placeholder="rzp_test_... or rzp_live_..."
                />


                <SecretField
                  label="Key Secret"
                  value={
                    razorpay.key_secret
                  }
                  disabled={saving}
                  show={
                    showRazorpaySecret
                  }
                  setShow={
                    setShowRazorpaySecret
                  }
                  onChange={(value) => {
                    setRazorpay(
                      (previous) => ({
                        ...previous,
                        key_secret:
                          value,
                      })
                    );
                  }}
                  placeholder={
                    razorpay.has_secret
                      ? "Secret already saved — enter only to change"
                      : "Enter Razorpay Key Secret"
                  }
                />
              </div>


              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={
                    handleTestRazorpay
                  }
                  disabled={
                    testing ===
                      "razorpay" ||
                    saving
                  }
                  className="
                    flex
                    h-9
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-xs
                    font-semibold
                    text-slate-700
                    transition-all

                    hover:border-[#ee027e]/40
                    hover:bg-[#ee027e]/5
                    hover:text-[#ee027e]

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {testing ===
                  "razorpay" ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Link2
                      size={15}
                    />
                  )}

                  {testing ===
                  "razorpay"
                    ? "Testing..."
                    : "Test Connection"}
                </button>


                {razorpay.has_secret && (
                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      text-[11px]
                      font-medium
                      text-emerald-600
                    "
                  >
                    <CheckCircle2
                      size={14}
                    />

                    Details saved
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* ===========================================
              LOGISTICS / SHIPROCKET
          =========================================== */}

          {/* <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-[0_1px_2px_rgba(15,23,42,0.03)]
              transition

              hover:border-[#ee027e]/20
              hover:shadow-sm
            "
          >
            <IntegrationHeader
              icon={PackageCheck}
              title="Logistics (Shiprocket)"
              description="Configure shipping, AWB generation and tracking."
              enabled={
                shiprocket.enabled
              }
              disabled={saving}
              onToggle={(value) => {
                setShiprocket(
                  (previous) => ({
                    ...previous,
                    enabled: value,
                  })
                );
              }}
            />


            <div
              className="
                p-4
                sm:p-5
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                "
              >
                <Field
                  label="API Email"
                  type="email"
                  value={
                    shiprocket.email
                  }
                  disabled={saving}
                  onChange={(value) => {
                    setShiprocket(
                      (previous) => ({
                        ...previous,
                        email: value,
                      })
                    );
                  }}
                  placeholder="Shiprocket API email"
                />


                <Field
                  label="Pickup Location"
                  value={
                    shiprocket
                      .pickup_location
                  }
                  disabled={saving}
                  onChange={(value) => {
                    setShiprocket(
                      (previous) => ({
                        ...previous,
                        pickup_location:
                          value,
                      })
                    );
                  }}
                  placeholder="Example: work"
                />


                <SecretField
                  label="API Password"
                  value={
                    shiprocket.password
                  }
                  disabled={saving}
                  show={
                    showShiprocketPassword
                  }
                  setShow={
                    setShowShiprocketPassword
                  }
                  onChange={(value) => {
                    setShiprocket(
                      (previous) => ({
                        ...previous,
                        password:
                          value,
                      })
                    );
                  }}
                  placeholder={
                    shiprocket
                      .has_password
                      ? "Password already saved — enter only to change"
                      : "Enter Shiprocket API password"
                  }
                />


                <Field
                  label="Channel ID (Optional)"
                  value={
                    shiprocket.channel_id
                  }
                  disabled={saving}
                  onChange={(value) => {
                    setShiprocket(
                      (previous) => ({
                        ...previous,
                        channel_id:
                          value,
                      })
                    );
                  }}
                  placeholder="Enter Channel ID if required"
                />
              </div>


              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={
                    handleTestShiprocket
                  }
                  disabled={
                    testing ===
                      "shiprocket" ||
                    saving
                  }
                  className="
                    flex
                    h-9
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-xs
                    font-semibold
                    text-slate-700
                    transition-all

                    hover:border-[#ee027e]/40
                    hover:bg-[#ee027e]/5
                    hover:text-[#ee027e]

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {testing ===
                  "shiprocket" ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Link2
                      size={15}
                    />
                  )}

                  {testing ===
                  "shiprocket"
                    ? "Testing..."
                    : "Test Connection"}
                </button>


                {shiprocket.has_password && (
                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      text-[11px]
                      font-medium
                      text-emerald-600
                    "
                  >
                    <CheckCircle2
                      size={14}
                    />

                    Details saved
                  </div>
                )}
              </div>
            </div>
          </div> */}


          {/* ===========================================
              COMMON SAVE BUTTON
          =========================================== */}

          <div
            className="
              flex
              justify-end
              border-t
              border-slate-100
              pt-4
            "
          >
            <button
              type="button"
              onClick={
                saveAllIntegrations
              }
              disabled={saving}
              className="
                flex
                h-10
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#ee027e]
                px-6
                text-xs
                font-semibold
                text-white
                shadow-sm
                transition-all

                hover:bg-[#d60272]
                hover:shadow-md

                focus:outline-none
                focus:ring-4
                focus:ring-[#ee027e]/20

                disabled:cursor-not-allowed
                disabled:opacity-60

                sm:w-auto
                sm:min-w-[175px]
              "
              style={{
                backgroundColor:
                  saving
                    ? undefined
                    : BRAND_COLOR,
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor =
                    BRAND_DARK;
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor =
                    BRAND_COLOR;
                }
              }}
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />

                  Save Settings
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}