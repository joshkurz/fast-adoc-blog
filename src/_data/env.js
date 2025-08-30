export default (() => {
  const isLocal = process.env.ELEVENTY_ENV === "development";
  return { isLocal };
})();

