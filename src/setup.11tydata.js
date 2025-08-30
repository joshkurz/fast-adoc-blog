export default function() {
  const isDev = process.env.ELEVENTY_ENV === "development";
  return {
    permalink: isDev ? "/setup/index.html" : false,
  };
}

