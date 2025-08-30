// src/components/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-gray-100 text-center text-sm text-gray-600 py-4">
      <div>
        © 2025 BlackBill. All rights reserved.
        <br />
        Contact :{" "}
        <a
          href="mailto:devblackbill@gmail.com"
          // className="text-blue-500 hover:underline"
        >
          devblackbill@gmail.com
        </a>{" "}
        {/* | 010-1234-5678 */}
      </div>
    </footer>
  );
};

export default Footer;
