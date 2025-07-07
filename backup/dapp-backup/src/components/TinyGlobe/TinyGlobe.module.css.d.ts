// This proxy returns the property name as the value for any CSS class
const handler = {
  get: (_: object, prop: string) => prop
};
const proxy = new Proxy({}, handler);
export default proxy as { [key: string]: string };
