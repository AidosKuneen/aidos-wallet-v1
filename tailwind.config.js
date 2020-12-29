module.exports = {
  purge: [
    "app/**/*.html",
    "app/ui/**/*.html",
    "app/**/*.js",
    "app/ui/**/*.js",
    "app/ui/images/spinner.svg",
  ],
  theme: {
    fontFamily: {
      roboto: [
        "Roboto",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Ubuntu",
        "Helvetica Neue",
        "sans-serif",
      ],
      montserrat: ["Montserrat", "Arial", "Helvetical", "sans-serif"],
    },
    extend: {
      colors: {
        "yellow-orange": "#FFCA7A",
        silver: "#989898",
        platinum: "#e5e5e5",
        cultured: "#f6f6f6",
        gainsboro: "#dddddd",
        viridian: "#008062",
        onyx: "#424242",
        "tetsu-black": "#2c3531",
        gravel: "#bbbbbb",
        "dark-green": "#227648",
        "dr-white": "#fafafa",
        "cerebral-grey": "#cccccc",
      },
      fontSize: {
        "2xs": "0.65rem",
      },
      inset: {
        "-2": "-0.5rem",
        center: "50%",
      },
      width: {
        66: "18rem",

        68: "20rem",
        70: "22rem",
        72: "24rem",
      },
      height: {
        34: "8.5rem",
        72: "24rem",
      },
      margin: {
        66: "18rem",
        68: "20rem",
      },
      borderRadius: {
        xl: "1.5rem",
      },
      opacity: {
        10: ".1",
      },
    },
  },
  variants: {},
  plugins: [],
};
