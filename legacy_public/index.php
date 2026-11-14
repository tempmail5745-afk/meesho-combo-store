<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Featured Products - Welcome</title>
    <meta name="description" content="Welcome to Meesho - Premium quality dry fruits, grocery combos, and daily essentials at lowest wholesale prices with free delivery.">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1190211293630447');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1190211293630447&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: #f0f2f5;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px 14px;
        }

        /* Container */
        .landing-wrapper {
            width: 100%;
            max-width: 440px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Entire Popup Card */
        .popup-card {
            background: #ffffff;
            width: 100%;
            border-radius: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 36px 26px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: inherit;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .popup-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .main-heading {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #000000;
            margin-bottom: 22px;
            text-transform: uppercase;
        }

        /* Product Inner Box */
        .product-box {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
            border: 1px solid #f1f1f1;
            width: 100%;
            padding: 16px;
            margin-bottom: 22px;
            text-align: left;
        }

        .single-image-container {
            width: 100%;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 16px;
            margin-bottom: 14px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .product-image {
            width: 100%;
            max-height: 220px;
            object-fit: contain;
            border-radius: 12px;
        }

        .product-title {
            font-size: 15px;
            font-weight: 600;
            color: #2c2c2c;
            line-height: 1.4;
            margin-bottom: 8px;
        }

        /* Rating */
        .rating-container {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;
        }

        .rating-badge {
            background-color: #388e3c;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 2px;
        }

        .rating-count {
            font-size: 12px;
            color: #878787;
        }

        /* Pricing */
        .price-container {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 8px;
        }

        .current-price {
            font-size: 22px;
            font-weight: 700;
            color: #000000;
        }

        .original-price {
            font-size: 14px;
            color: #878787;
            text-decoration: line-through;
        }

        .discount {
            font-size: 14px;
            font-weight: 600;
            color: #388e3c;
        }

        /* Continue to Shopping Button */
        .cta-button {
            display: inline-block;
            width: 100%;
            padding: 14px 24px;
            background-color: #fb641b;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            border-radius: 6px;
            text-decoration: none;
            text-align: center;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
            transition: background-color 0.2s ease, transform 0.1s ease;
            cursor: pointer;
            border: none;
        }

        .cta-button:hover {
            background-color: #e05515;
            transform: translateY(-1px);
        }

        .cta-button:active {
            transform: translateY(0px);
        }

        .welcome-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 22px;
            font-weight: 400;
        }

        /* Secure Payment Footer */
        .secure-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px;
            font-size: 13px;
            color: #555555;
            margin-bottom: 8px;
        }

        .razorpay-logo {
            height: 16px;
            width: auto;
            vertical-align: middle;
        }

        .trusted-box {
            border-left: 1px solid #dddddd;
            padding-left: 8px;
            margin-left: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 9px;
            text-align: left;
        }

        .trusted-icon {
            width: 16px;
            height: 16px;
            background: #2f6df6;
            color: #ffffff;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .trusted-title {
            color: #2954c8;
            font-size: 10px;
        }

        .trusted-description {
            color: #5f7fe5;
            font-size: 9px;
        }

        /* Compliance Footer Links */
        .landing-compliance-footer {
            margin-top: 18px;
            text-align: center;
            font-size: 12px;
            color: #71717a;
            max-width: 440px;
            line-height: 1.6;
        }

        .landing-compliance-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px 12px;
            margin-bottom: 8px;
        }

        .landing-compliance-links a {
            color: #52525b;
            text-decoration: none;
            transition: color 0.2s;
        }

        .landing-compliance-links a:hover {
            color: #09090b;
            text-decoration: underline;
        }

        @media (max-width: 480px) {
            body {
                padding: 12px;
            }

            .popup-card {
                padding: 26px 16px;
                border-radius: 28px;
            }

            .main-heading {
                font-size: 27px;
            }
        }
    </style>
</head>

<body>

    <div class="landing-wrapper">
        <a href="home.php" class="popup-card">
            <h1 class="main-heading">Welcome</h1>

            <div class="product-box">
                <div class="single-image-container">
                    <img
                        class="product-image"
                        src="https://cdn.shopify.com/s/files/1/0728/8487/9496/files/Gemini_Generated_Image_mgf77cmgf77cmgf7.png?v=1774764915"
                        alt="Dry Fruits Combo Pack"
                    >
                </div>

                <div class="product-title">
                    Premium 4KG Mix Dry Fruits Combo – Almonds, Cashews, Pistachios &amp; Kishmish (1KG Each)
                </div>

                <div class="rating-container">
                    <span class="rating-badge">4.4 ★</span>
                    <span class="rating-count">(4,320 Ratings)</span>
                </div>

                <div class="price-container">
                    <span class="current-price">₹199</span>
                    <span class="original-price">₹5,999</span>
                    <span class="discount">97% off</span>
                </div>
            </div>

            <!-- Continue to Shopping Button -->
            <span class="cta-button">🛒 Continue to Shopping</span>

            <p class="welcome-text">
                Welcome to our Dryfruit and Grocery Store
            </p>

            <div class="secure-footer">
                <span>🔒 Secure Payment by</span>

                <img
                    src="https://razorpay.com/assets/razorpay-logo.svg"
                    class="razorpay-logo"
                    alt="Razorpay"
                >

                <span class="trusted-box">
                    <span class="trusted-icon">✓</span>
                    <span>
                        <strong class="trusted-title">Trusted &amp; Secure</strong>
                        <br>
                        <span class="trusted-description">100% Safe Payments</span>
                    </span>
                </span>
            </div>
        </a>

        <!-- Meta Ad Policy Compliance Links -->
        <footer class="landing-compliance-footer">
            <div class="landing-compliance-links">
                <a href="privacy-policy.php">Privacy Policy</a>
                <span>&bull;</span>
                <a href="terms.php">Terms of Service</a>
                <span>&bull;</span>
                <a href="refund-policy.php">Refund Policy</a>
                <span>&bull;</span>
                <a href="shipping-policy.php">Shipping Policy</a>
                <span>&bull;</span>
                <a href="contact.php">Contact Us</a>
            </div>
            <p>&copy; 2026 Meesho. All rights reserved.</p>
        </footer>
    </div>

</body>
</html>
