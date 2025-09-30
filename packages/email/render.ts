// TODO: This is a temporary function to render the component to a string.
// We should use the render function from react-email instead.
// renderToPipeableStream is not defined error from react-email
export const render = (component: React.ReactNode) => {
  // Lazy require to avoid bundling server-only modules in client builds
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { renderToStaticMarkup } = require("react-dom/server") as typeof import(
    "react-dom/server",
  );
  return renderToStaticMarkup(component);
};
