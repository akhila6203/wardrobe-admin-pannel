import axios from "axios";


const axiosClient =
  axios.create({

    baseURL:
      import.meta.env
        .VITE_API_BASE_URL,

    headers: {
      "Content-Type":
        "application/json",
    },

    timeout:
      15000,

  });


/* =========================================
   ADD JWT
========================================= */

axiosClient.interceptors
  .request
  .use(

    (config) => {

      const token =
        localStorage.getItem(
          "admin_token"
        );


      if (token) {

        config.headers.Authorization =
          `Bearer ${token}`;

      }


      return config;

    },

    (error) =>
      Promise.reject(
        error
      )

  );


/* =========================================
   RESPONSE
========================================= */

axiosClient.interceptors
  .response
  .use(

    (response) =>
      response,

    (error) => {

      /*
       * Only logout when actual
       * authentication fails.
       *
       * 500 SQL error vachinappudu
       * logout avvakudadhu.
       */

      if (
        error.response
          ?.status === 401
      ) {

        localStorage.removeItem(
          "admin_token"
        );

      }


      return Promise.reject(
        error
      );

    }

  );


export default axiosClient;