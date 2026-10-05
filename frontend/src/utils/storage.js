/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const MENU_KEY = "biryani_admin_menu";
const ORDER_KEY = "biryani_admin_orders";
const LOGIN_KEY = "biryani_admin_login";


/* =========================================================
   DEFAULT MENU
========================================================= */

const defaultMenu = [
  {
    id: 1,
    name: "Chicken Dum Biryani",
    portion: "Single",
    amount: 120,
  },
  {
    id: 2,
    name: "Chicken Dum Biryani",
    portion: "Double",
    amount: 210,
  },
  {
    id: 3,
    name: "Chicken Dum Biryani",
    portion: "Full",
    amount: 390,
  },
  {
    id: 4,
    name: "Mutton Dum Biryani",
    portion: "Single",
    amount: 180,
  },
  {
    id: 5,
    name: "Mutton Dum Biryani",
    portion: "Double",
    amount: 320,
  },
  {
    id: 6,
    name: "Mutton Dum Biryani",
    portion: "Full",
    amount: 480,
  },
];


/* =========================================================
   DEFAULT ORDERS
========================================================= */

const defaultOrders = [
  {
    id: 1,
    name: "Rahul",
    mobile: "9876543210",
    item: "Chicken Dum Biryani",
    portion: "Single",
    quantity: 2,
    paymentMethod: "GPay",
    totalAmount: 240,
  },

  {
    id: 2,
    name: "Kiran",
    mobile: "9123456780",
    item: "Mutton Dum Biryani",
    portion: "Double",
    quantity: 1,
    paymentMethod: "PhonePe",
    totalAmount: 320,
  },

  {
    id: 3,
    name: "Anjali",
    mobile: "9988776655",
    item: "Chicken Dum Biryani",
    portion: "Single",
    quantity: 2,
    paymentMethod: "GPay",
    totalAmount: 240,
  },
];


/* =========================================================
   NORMALIZE ORDER

   Old localStorage data property names different ga unna
   kuda correct values read chestundi.
========================================================= */

const normalizeOrder = (order, index) => {
  const quantity = Number(
    order.quantity ??
    order.qty ??
    1
  );

  const unitAmount = Number(
    order.amount ??
    order.price ??
    order.unitPrice ??
    0
  );

  const totalAmount = Number(
    order.totalAmount ??
    order.total ??
    order.total_amount ??
    order.grandTotal ??
    (unitAmount * quantity)
  );

  const paymentMethod =
    order.paymentMethod ??
    order.payment_method ??
    order.paymentMode ??
    order.payment_mode ??
    order.method ??
    "GPay";

  return {
    id:
      order.id ??
      Date.now() + index,

    name:
      order.name ??
      order.customerName ??
      order.customer_name ??
      "Customer",

    mobile:
      order.mobile ??
      order.mobileNumber ??
      order.phone ??
      "-",

    item:
      order.item ??
      order.itemName ??
      order.menuName ??
      order.productName ??
      "-",

    portion:
      order.portion ??
      order.size ??
      order.variant ??
      "-",

    quantity,

    paymentMethod,

    totalAmount,
  };
};


/* =========================================================
   GET MENU
========================================================= */

export const getMenu = () => {
  try {
    const savedMenu =
      localStorage.getItem(MENU_KEY);

    if (savedMenu) {
      return JSON.parse(savedMenu);
    }

    localStorage.setItem(
      MENU_KEY,
      JSON.stringify(defaultMenu)
    );

    return defaultMenu;
  } catch (error) {
    console.error(
      "Error loading menu:",
      error
    );

    return defaultMenu;
  }
};


/* =========================================================
   SAVE MENU
========================================================= */

export const saveMenu = (menu) => {
  try {
    localStorage.setItem(
      MENU_KEY,
      JSON.stringify(menu)
    );

    return true;
  } catch (error) {
    console.error(
      "Error saving menu:",
      error
    );

    return false;
  }
};


/* =========================================================
   GET ORDERS
========================================================= */

export const getOrders = () => {
  try {
    const savedOrders =
      localStorage.getItem(ORDER_KEY);

    /* -----------------------------------------
       EXISTING LOCAL STORAGE ORDERS
    ----------------------------------------- */

    if (savedOrders) {
      const parsedOrders =
        JSON.parse(savedOrders);

      if (
        Array.isArray(parsedOrders) &&
        parsedOrders.length > 0
      ) {
        const normalizedOrders =
          parsedOrders.map(
            (order, index) =>
              normalizeOrder(
                order,
                index
              )
          );

        /*
          Update old localStorage data
          with normalized structure.
        */

        localStorage.setItem(
          ORDER_KEY,
          JSON.stringify(
            normalizedOrders
          )
        );

        return normalizedOrders;
      }
    }

    /* -----------------------------------------
       NO ORDERS FOUND - ADD DEFAULT ORDERS
    ----------------------------------------- */

    localStorage.setItem(
      ORDER_KEY,
      JSON.stringify(
        defaultOrders
      )
    );

    return defaultOrders;
  } catch (error) {
    console.error(
      "Error loading orders:",
      error
    );

    return defaultOrders;
  }
};


/* =========================================================
   SAVE ORDERS
========================================================= */

export const saveOrders = (orders) => {
  try {
    const normalizedOrders =
      orders.map(
        (order, index) =>
          normalizeOrder(
            order,
            index
          )
      );

    localStorage.setItem(
      ORDER_KEY,
      JSON.stringify(
        normalizedOrders
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Error saving orders:",
      error
    );

    return false;
  }
};


/* =========================================================
   ADD ORDER
========================================================= */

export const addOrder = (order) => {
  try {
    const orders = getOrders();

    const newOrder = {
      id: Date.now(),

      name:
        order.name ||
        "Customer",

      mobile:
        order.mobile ||
        "-",

      item:
        order.item ||
        "-",

      portion:
        order.portion ||
        "-",

      quantity:
        Number(
          order.quantity || 1
        ),

      paymentMethod:
        order.paymentMethod ||
        "GPay",

      totalAmount:
        Number(
          order.totalAmount || 0
        ),
    };

    const updatedOrders = [
      newOrder,
      ...orders,
    ];

    localStorage.setItem(
      ORDER_KEY,
      JSON.stringify(
        updatedOrders
      )
    );

    return newOrder;
  } catch (error) {
    console.error(
      "Error adding order:",
      error
    );

    return null;
  }
};


/* =========================================================
   LOGIN STATUS
========================================================= */

export const getLoginStatus = () => {
  try {
    return (
      localStorage.getItem(
        LOGIN_KEY
      ) === "true"
    );
  } catch (error) {
    return false;
  }
};


/* =========================================================
   SET LOGIN STATUS
========================================================= */

export const setLoginStatus = (
  status
) => {
  try {
    localStorage.setItem(
      LOGIN_KEY,
      status
        ? "true"
        : "false"
    );
  } catch (error) {
    console.error(
      "Login error:",
      error
    );
  }
};


/* =========================================================
   LOGOUT
========================================================= */

export const logoutAdmin = () => {
  localStorage.removeItem(
    LOGIN_KEY
  );
};


/* =========================================================
   RESET ORDERS
========================================================= */

export const resetOrders = () => {
  localStorage.setItem(
    ORDER_KEY,
    JSON.stringify(
      defaultOrders
    )
  );

  return defaultOrders;
};