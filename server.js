/* ----------------------------------------------------
   ChefPizza Full-Stack Node.js Express & SMTP Server
   ---------------------------------------------------- */

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8999;

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend assets from workspace root
app.use(express.static(__dirname));

// Default routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Secure SMTP Checkout Mail Dispatcher Route
app.post('/api/checkout', (req, res) => {
    const { name, phone, address, payment, cart, subtotal, delivery, tax, total } = req.body;

    console.log(`\n🔔 NEW ORDER RECEIVED: ${name}`);
    console.log(`📞 Contact Phone: ${phone}`);
    console.log(`📍 Delivery Address: ${address}`);
    console.log(`💵 Order Total: Rs. ${total}`);

    // Compile cart listings in HTML
    const cartItemsHtml = cart.map(item => `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 12px; color: #f5f3f7; font-family: 'Plus Jakarta Sans', sans-serif;">
                <strong>${item.name}</strong>
            </td>
            <td style="padding: 12px; color: #ff5722; text-align: center;">x${item.quantity}</td>
            <td style="padding: 12px; color: #a7a2b5; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
            <td style="padding: 12px; color: #f5f3f7; font-weight: bold; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
    `).join('');

    // Unique order tracking codes
    const orderNumber = `CP-${Math.floor(100000 + Math.random() * 900000)}-Z`;



    // Composing New Kitchen Order Ticket email template for Shop Owner
    const emailHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>ChefPizza NEW ORDER KITCHEN TICKET</title>
    </head>
    <body style="background-color: #07040e; color: #f5f3f7; font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #140f21 0%, #0d091a 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.5);">
            
            <!-- Header Glowing Accent -->
            <div style="background: linear-gradient(90deg, #ff5722 0%, #ffca28 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-family: 'Outfit', Arial, sans-serif; color: #ffffff; font-size: 28px; letter-spacing: -0.02em; text-transform: uppercase;">
                    🔔 NEW KITCHEN TICKET
                </h1>
                <p style="margin: 5px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px; font-weight: 500;">
                    Ticket ID: ${orderNumber}
                </p>
            </div>

            <div style="padding: 30px;">
                <h2 style="font-family: 'Outfit', Arial, sans-serif; color: #ffd54f; font-size: 20px; margin-top: 0;">
                    Action Required: Call Customer to Confirm Order!
                </h2>
                <p style="color: #a7a2b5; font-size: 14px; line-height: 1.6;">
                    Hello Chef, a new pizza order has been received via the online checkout portal. Please **call the customer immediately on their phone number** to confirm order details and begin baking.
                </p>

                <!-- Customer Details Card -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 18px; border-radius: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 8px 0; color: #ff5722; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
                        📞 Customer Details
                    </h3>
                    <p style="margin: 0; font-size: 15px; color: #f5f3f7; line-height: 1.6;">
                        <strong>Name:</strong> ${name}<br>
                        <strong>Phone:</strong> <strong style="color: #66bb6a; font-size: 16px;">${phone}</strong><br>
                        <strong>Delivery Address:</strong> ${address}
                    </p>
                </div>

                <!-- Pricing items Table -->
                <h3 style="color: #ffd54f; font-size: 14px; text-transform: uppercase; margin-bottom: 10px;">
                    🍕 Order Manifest
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.15); text-align: left;">
                            <th style="padding: 10px; color: #a7a2b5; font-size: 12px; text-transform: uppercase;">Pizza</th>
                            <th style="padding: 10px; color: #a7a2b5; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
                            <th style="padding: 10px; color: #a7a2b5; font-size: 12px; text-transform: uppercase; text-align: right;">Unit</th>
                            <th style="padding: 10px; color: #a7a2b5; font-size: 12px; text-transform: uppercase; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cartItemsHtml}
                    </tbody>
                </table>

                <!-- Summary prices -->
                <div style="width: 100%; max-width: 250px; margin-left: auto; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #a7a2b5; margin-bottom: 6px;">
                        <span>Crust Subtotal:</span>
                        <span style="color: #f5f3f7; font-weight: bold;">Rs. ${subtotal.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #a7a2b5; margin-bottom: 6px;">
                        <span>Delivery Fee:</span>
                        <span style="color: #f5f3f7;">Rs. ${delivery.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #a7a2b5; margin-bottom: 8px;">
                        <span>Sales Tax (16% GST):</span>
                        <span style="color: #f5f3f7;">Rs. ${tax.toLocaleString()}</span>
                    </div>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 8px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 15px; color: #ff5722; font-weight: bold;">
                        <span>Total Invoice:</span>
                        <span>Rs. ${total.toLocaleString()}</span>
                    </div>
                </div>

                <!-- Telemetry parameters -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <span style="display: block; font-size: 11px; color: #6b6678; text-transform: uppercase;">Payment Choice</span>
                        <strong style="font-size: 13px; color: #ffca28;">${payment.toUpperCase()}</strong>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 11px; color: #6b6678; text-transform: uppercase;">Operational Status</span>
                        <strong style="font-size: 13px; color: #ffd54f;">AWAITING CONFIRMATION</strong>
                    </div>
                </div>

            </div>

            <!-- Footer block -->
            <div style="background: #030206; padding: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                <p style="margin: 0; font-size: 11px; color: #6b6678;">
                    &copy; 2026 ChefPizza Inc. Handcrafting wood-fired masterpieces. Taste the Future.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Configure secure outbound SMTP credentials using Nodemailer
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.aistartups.me',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // Port 587 uses STARTTLS (requireTLS: true), not SSL (port 465)
        requireTLS: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            // Do not fail on self-signed certificates
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `"${name} (New Order)" <${process.env.SMTP_USER || 'no-reply@aistartups.me'}>`,
        to: process.env.RECEIVER_EMAIL || 'pizza2@aistartups.me',
        subject: `🔔 NEW ORDER TICKET: ${orderNumber} - [${name}]`,
        html: emailHtmlContent
    };

    console.log('📬 Dispatched order ticket to mail.aistartups.me...');

    // Attempt to dispatch email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('❌ SMTP Relay Failure:', error.message);
            
            // Check if SMTP is still placeholder-configured
            if (process.env.SMTP_USER === 'your_email@aistartups.me') {
                console.log('⚠️ Diagnostic Note: Server in local dev mode.');
            }

            return res.status(200).json({
                success: true,
                message: 'Order received but mail server timed out.',
                emailSent: false,
                error: error.message
            });
        }

        console.log('✨ Order ticket dispatched to Shop Owner! Message ID:', info.messageId);
        res.status(200).json({ 
            success: true, 
            message: 'Order Received & Dispatch Ticket Emailed!',
            emailSent: true,
            messageId: info.messageId
        });
    });
});

// Catch-all route to serve subpages directly without .html extension in URLs (clean links)
app.get('/:page', (req, res, next) => {
    const pageName = req.params.page;
    const filePath = path.join(__dirname, `${pageName}.html`);
    
    fs.exists(filePath, (exists) => {
        if (exists) {
            res.sendFile(filePath);
        } else {
            next(); // falls to 404
        }
    });
});

// Start listening
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🍕  ChefPizza Full-Stack Server active on Localhost!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📡 SMTP Server Relay: mail.aistartups.me:587`);
    console.log(`📁 Hosting Directory: ${__dirname}`);
    console.log(`======================================================\n`);
});
