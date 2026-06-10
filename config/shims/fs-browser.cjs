module.exports = new Proxy(
  {},
  {
    get(_target, key) {
      if (key === "__esModule") {
        return true;
      }

      return () => {
        throw new Error(
          `Node builtin "fs.${String(key)}" недоступен в браузере.`,
        );
      };
    },
  },
);
