import { EmailVerificationType } from 'src/types/general';

export const mailTemplate = (
  type: EmailVerificationType,
  url: string,
): string => {
  let template: string = '';

  if (type === EmailVerificationType.FORGOT_PASSWORD) {
    template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Email Template</title>
          </head>
          <body
            style="
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #333333;
              background-color: #f5f5f5;
            "
          >
            <!-- Wrapper table for better compatibility -->
            <table
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              style="table-layout: fixed"
            >
              <tr>
                <td align="center" style="padding: 20px 0">
                  <!-- Main content table - 600px is a good standard width -->
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="600"
                    style="
                      background-color: #ffffff;
                      border-radius: 8px;
                      box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
                    "
                  >
                    <!-- HEADER SECTION -->
                    <tr>
                      <td
                        align="center"
                        style="
                          padding: 30px 0;
                          background-color: #0056b3;
                          border-top-left-radius: 8px;
                          border-top-right-radius: 8px;
                        "
                      >
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center">
                              <!-- SVG Logo embedded as inline code for maximum compatibility -->
                              <svg
                                width="150"
                                height="50"
                                viewBox="0 0 150 50"
                                xmlns="http://www.w3.org/2000/svg"
                                style="fill: #ffffff"
                              >
                                <rect x="10" y="15" width="40" height="20" rx="5" />
                                <circle cx="80" cy="25" r="15" />
                                <path d="M100 15 L120 15 L130 25 L120 35 L100 35 Z" />
                              </svg>
                            </td>
                          </tr>
                          <tr>
                            <td
                              align="center"
                              style="
                                padding: 10px 0 0;
                                font-size: 26px;
                                font-weight: bold;
                                color: #ffffff;
                              "
                            >
                              Addo Salon
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
        
                    <!-- HERO SECTION -->
                    <tr>
                      <td
                        align="center"
                        style="padding: 40px 30px; background-color: #f0f7ff"
                      >
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <!-- Call to Action Section -->
                          <tr>
                            <td style="padding: 30px 0">
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="
                                      background-color: #f0f7ff;
                                      padding: 30px;
                                      border-radius: 8px;
                                    "
                                  >
                                    <p
                                      style="
                                        font-size: 22px;
                                        font-weight: bold;
                                        color: #0056b3;
                                        margin: 0 0 15px;
                                      "
                                    >
                                      Reset Password
                                    </p>
                                    <p
                                      style="
                                        font-size: 16px;
                                        line-height: 1.6;
                                        color: #333333;
                                        margin: 0 0 20px;
                                      "
                                    >
                                      Ikuti link ini untuk mereset kata sandi
                                    </p>
                                    <table border="0" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td
                                          style="
                                            background-color: #0056b3;
                                            border-radius: 4px;
                                          "
                                        >
                                          <a
                                            href="${url}"
                                            target="_blank"
                                            style="
                                              font-size: 16px;
                                              font-weight: bold;
                                              color: #ffffff;
                                              text-decoration: none;
                                              padding: 12px 25px;
                                              display: inline-block;
                                            "
                                          >
                                            Reset Kata Sandi
                                          </a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <p style="color:rgb(208, 43, 43); background-color:rgb(239, 136, 136); padding:10px"> Mohon diperhatikan, formulir reset kata sandi ini akan kedaluwarsa dalam waktu 12 menit setelah email ini dikirimkan </p>
                                    <p>
                                      Jika tombol di atas tidak berfungsi, Anda juga dapat mengatur ulang kata sandi dengan menyalin dan menempelkan tautan berikut ke browser Anda:
                                    </p>
                                    <p>${url}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
        
                    <!-- FOOTER SECTION -->
                    <tr>
                      <td
                        style="
                          padding: 30px;
                          background-color: #333333;
                          border-bottom-left-radius: 8px;
                          border-bottom-right-radius: 8px;
                        "
                      >
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <!-- Social Media Links -->
                          <tr>
                            <td align="center" style="padding-bottom: 20px">
                              <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <!-- Facebook -->
                                  <td style="padding: 0 10px">
                                    <a href="https://facebook.com/" target="_blank">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#ffffff"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      >
                                        <path
                                          d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                                        ></path>
                                      </svg>
                                    </a>
                                  </td>
                                  <!-- Instagram -->
                                  <td style="padding: 0 10px">
                                    <a href="https://instagram.com/" target="_blank">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#ffffff"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      >
                                        <rect
                                          x="2"
                                          y="2"
                                          width="20"
                                          height="20"
                                          rx="5"
                                          ry="5"
                                        ></rect>
                                        <path
                                          d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                                        ></path>
                                        <line
                                          x1="17.5"
                                          y1="6.5"
                                          x2="17.51"
                                          y2="6.5"
                                        ></line>
                                      </svg>
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!-- Contact Information -->
                          <tr>
                            <td
                              align="center"
                              style="
                                color: #ffffff;
                                font-size: 14px;
                                padding-bottom: 20px;
                              "
                            >
                              <p style="margin: 0 0 5px">
                                Addo Salon, Jl. PLN Dalam I, Bandung, Jawa Barat
                              </p>
                              <p style="margin: 0 0 5px">
                                Phone: 08121409029 | Email: addosalon@gmail.com
                              </p>
                            </td>
                          </tr>
                          <!-- Legal & Unsubscribe -->
                          <tr>
                            <td align="center" style="color: #aaaaaa; font-size: 12px">
                              <p style="margin: 0 0 5px">
                                Anda mendapatkan email ini karena Anda mendaftar di aplikasi kami
                              </p>
                              <p style="margin: 0 0 5px">
                                <a
                                  href="https://example.com/privacy"
                                  target="_blank"
                                  style="color: #aaaaaa; text-decoration: underline"
                                  >Privacy Policy</a
                                >
                                |
                                <a
                                  href="https://example.com/terms"
                                  target="_blank"
                                  style="color: #aaaaaa; text-decoration: underline"
                                  >Terms of Service</a
                                >
                              </p>
                              <p style="margin: 10px 0 0">
                                © 2025 Addo Salon. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        `;
  } else if (type === EmailVerificationType.REGISTER) {
    template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    "
  >
    <!-- Wrapper table for better compatibility -->
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="table-layout: fixed"
    >
      <tr>
        <td align="center" style="padding: 20px 0">
          <!-- Main content table - 600px is a good standard width -->
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="600"
            style="
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- HEADER SECTION -->
            <tr>
              <td
                align="center"
                style="
                  padding: 30px 0;
                  background-color: #0056b3;
                  border-top-left-radius: 8px;
                  border-top-right-radius: 8px;
                "
              >
                <!-- Logo -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <!-- SVG Logo embedded as inline code for maximum compatibility -->
                      <svg
                        width="150"
                        height="50"
                        viewBox="0 0 150 50"
                        xmlns="http://www.w3.org/2000/svg"
                        style="fill: #ffffff"
                      >
                        <rect x="10" y="15" width="40" height="20" rx="5" />
                        <circle cx="80" cy="25" r="15" />
                        <path d="M100 15 L120 15 L130 25 L120 35 L100 35 Z" />
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      style="
                        padding: 10px 0 0;
                        font-size: 26px;
                        font-weight: bold;
                        color: #ffffff;
                      "
                    >
                      Addo Salon
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- HERO SECTION -->
            <tr>
              <td
                align="center"
                style="padding: 40px 30px; background-color: #f0f7ff"
              >
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <!-- Call to Action Section -->
                  <tr>
                    <td style="padding: 30px 0">
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            align="center"
                            style="
                              background-color: #f0f7ff;
                              padding: 30px;
                              border-radius: 8px;
                            "
                          >
                            <p
                              style="
                                font-size: 22px;
                                font-weight: bold;
                                color: #0056b3;
                                margin: 0 0 15px;
                              "
                            >
                              Verifikasi email Anda
                            </p>
                            <p
                              style="
                                font-size: 16px;
                                line-height: 1.6;
                                color: #333333;
                                margin: 0 0 20px;
                              "
                            >
                              Terima kasih telah mendaftar! Harap verifikasi alamat email Anda untuk menyelesaikan pendaftaran dengan mengklik tombol di bawah ini
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td
                                  style="
                                    background-color: #0056b3;
                                    border-radius: 4px;
                                  "
                                >
                                  <a
                                    href="${url}"
                                    target="_blank"
                                    style="
                                      font-size: 16px;
                                      font-weight: bold;
                                      color: #ffffff;
                                      text-decoration: none;
                                      padding: 12px 25px;
                                      display: inline-block;
                                    "
                                  >
                                    Verifikasi alamat email
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p>
                              Jika tombol di atas tidak berfungsi, Anda juga dapat mengatur ulang kata sandi dengan menyalin dan menempelkan tautan berikut ke browser Anda:
                            </p>
                            <p>${url}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER SECTION -->
            <tr>
              <td
                style="
                  padding: 30px;
                  background-color: #333333;
                  border-bottom-left-radius: 8px;
                  border-bottom-right-radius: 8px;
                "
              >
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <!-- Social Media Links -->
                  <tr>
                    <td align="center" style="padding-bottom: 20px">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <!-- Facebook -->
                          <td style="padding: 0 10px">
                            <a href="https://facebook.com/" target="_blank">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ffffff"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <path
                                  d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                                ></path>
                              </svg>
                            </a>
                          </td>
                          <!-- Instagram -->
                          <td style="padding: 0 10px">
                            <a href="https://instagram.com/" target="_blank">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ffffff"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <rect
                                  x="2"
                                  y="2"
                                  width="20"
                                  height="20"
                                  rx="5"
                                  ry="5"
                                ></rect>
                                <path
                                  d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                                ></path>
                                <line
                                  x1="17.5"
                                  y1="6.5"
                                  x2="17.51"
                                  y2="6.5"
                                ></line>
                              </svg>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Contact Information -->
                  <tr>
                    <td
                      align="center"
                      style="
                        color: #ffffff;
                        font-size: 14px;
                        padding-bottom: 20px;
                      "
                    >
                      <p style="margin: 0 0 5px">
                        Addo Salon, Jl. PLN Dalam I, Bandung, Jawa Barat
                      </p>
                      <p style="margin: 0 0 5px">
                        Phone: 08121409029 | Email: addosalon@gmail.com
                      </p>
                    </td>
                  </tr>
                  <!-- Legal & Unsubscribe -->
                  <tr>
                    <td align="center" style="color: #aaaaaa; font-size: 12px">
                      <p style="margin: 0 0 5px">
                        Anda mendapatkan email ini karena Anda mendaftar di aplikasi kami
                      </p>
                      <p style="margin: 0 0 5px">
                        <a
                          href="https://example.com/privacy"
                          target="_blank"
                          style="color: #aaaaaa; text-decoration: underline"
                          >Privacy Policy</a
                        >
                        |
                        <a
                          href="https://example.com/terms"
                          target="_blank"
                          style="color: #aaaaaa; text-decoration: underline"
                          >Terms of Service</a
                        >
                      </p>
                      <p style="margin: 10px 0 0">
                        © 2025 Addo Salon. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
  }
  return template;
};
