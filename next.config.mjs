/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',          // When the user visits the root URL
          destination: '/home', // Redirect them to /home
          permanent: true,      // Set to true for a permanent redirect (301), false for temporary (302)
        },
      ];
    },
  };
  
  export default nextConfig;
  