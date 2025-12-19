import nodemailer from 'nodemailer'
import hbs from "nodemailer-express-handlebars";

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var transporter = nodemailer.createTransport({
    // service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    // secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


const handlebarOptions = {
    viewEngine: {
        extName: '.handlebars',
        partialsDir: join(__dirname, '../view/'),
        layoutsDir: join(__dirname, '../view/'),
        defaultLayout: false,
    },
    viewPath: join(__dirname, '../view/'),
    extName: '.handlebars',
};

transporter.use("compile", hbs(handlebarOptions));


export const sendOtpMail = async function (otp, to) {
    let mailOptions = {
        from: process.env.SMTP_USER, // sender address
        to: to,
        subject: "OTP Verification",
        template: "account",
        context: {
            otp
        },
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) { // If error occurs while sending email
            console.log("Error -" + err); // Log the error
        } else { // If email sent successfully
            console.log("Email sent successfully", info.response); // Log the success message with email response info
        }
    });
};


export const sendOtpforgotPasswordMail = async function ( otp, to) {
    let mailOptions = {
        from: process.env.SMTP_USER, // sender address
        to: to,
        subject: "Password Reset OTP",
        template: "password",
        context: {
            otp
        },
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) { // If error occurs while sending email
            console.log("Error -" + err); // Log the error
        } else { // If email sent successfully
            console.log("Email sent successfully", info.response); // Log the success message with email response info
        }
    });
};


export const sendContactUsMail = async function (name, msg, from) {
    let mailOptions = {
        from: from, 
        to: process.env.SMTP_USER,
        subject: "Contact us",
        template: "contact",
        context: {
            name,
            msg
        },
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) { // If error occurs while sending email
            console.log("Error -" + err); // Log the error
        } else { // If email sent successfully
            console.log("Email sent successfully", info.response); // Log the success message with email response info
        }
    });
};